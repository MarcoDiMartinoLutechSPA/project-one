sap.ui.define([
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/odata/v2/ODataModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageBox",
    "sap/ui/export/Spreadsheet",
    "sap/ui/export/library",
    "../utils/DateFormatter",
    "sap/btp/projectone/controller/BaseController"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
    */
    function (JSONModel, ODataModel, Filter, 
              FilterOperator, MessageBox, Spreadsheet, 
              exportLibrary, DateFormatter, BaseController) 
    {
        "use strict";

        const EdmType = exportLibrary.EdmType;
        const url_oData = "/V2/Northwind/Northwind.svc/";

        return BaseController.extend("sap.btp.projectone.controller.View1", 
        {
            formatter : DateFormatter,
        
            onInit: function () {
                var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                oRouter.getRoute("RouteView1").attachPatternMatched(this._onRouteMatched, this); 

                this.byId("DatePicker").setMaxDate(new Date('1997-12-31'));
            },

            _onRouteMatched: function() {
                
            },

            onNavigateToPage2: function() {
                var oSelectedRow = this.byId("ordersTable").getSelectedItem();

                if (!oSelectedRow) {
                    MessageBox.error("Seleziona un rigo dalla tabella.");
                    return;
                }
            
                var oSelectedRowContext = oSelectedRow.getBindingContext("ordersTableModel");
                var sOrderID = oSelectedRowContext.getProperty("OrderID");
                var sEmployeeID = oSelectedRowContext.getProperty("EmployeeID");
                var sCustomerID = oSelectedRowContext.getProperty("CustomerID");
                var sOrderDate = oSelectedRowContext.getProperty("OrderDate");
            
                var oData = {
                    orderID: sOrderID,
                    employeeID: sEmployeeID,
                    customerID: sCustomerID,
                    orderDate: sOrderDate
                };

                var oModel = new JSONModel(oData);

                var oRouter = this.getOwnerComponent().getRouter();
                oRouter.navTo("RouteView2", {
                    selectedOrderModel: btoa(JSON.stringify(oModel.getData()))
                });
            },
 
            // Gestione della ricerca tramite la FilterBar
            onSearch: async function (oEvent) {
                var aFilters = [];

                var oFilterBar = oEvent.getSource();
                var bCustomerIDValid = true; // Flag per verificare se il CustomerID è valido

                oFilterBar.getFilterGroupItems().forEach(function(oFilterGroupItem) {
                    var oControl = oFilterGroupItem.getControl();
                    var sName = oFilterGroupItem.getName();
                    var sValue = oControl.getValue();

                    if (sName === "CustomerID") {
                        if (!sValue) {
                            MessageBox.error("Inserisci il Customer ID nella barra di ricerca.");
                            bCustomerIDValid = false; // Imposta il flag su false se il CustomerID non è valido
                            return;
                        }
                    }

                    if (sValue) {
                        var oFilter;
                        if (sName === "OrderDate") {
                            var oDatePicker = oFilterGroupItem.getControl();
                            var oSelectedDate = oDatePicker.getDateValue();

                            // Verifica se la data selezionata è valida
                            if (!(oSelectedDate instanceof Date) || isNaN(oSelectedDate)) {
                                MessageBox.error("La data selezionata non è valida.");
                                return; // Interrompi immediatamente l'iterazione
                            }

                            var oDateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
                                pattern: "yyyy-MM-dd" // Formato richiesto dall'OData Northwind
                            });

                            var sFormattedDate = oDateFormat.format(oSelectedDate);
                            oFilter = new Filter(sName, FilterOperator.EQ, sFormattedDate);
                        } else {
                            oFilter = new Filter(sName, FilterOperator.EQ, sValue);
                        }

                        aFilters.push(oFilter);
                    }
                });

                // Se il CustomerID non è valido, interrompi l'esecuzione
                if (!bCustomerIDValid) {
                    return;
                }

                // Esegui la chiamata OData per popolare i dati della tabella
                try {
                    var oModel = new ODataModel(url_oData);
                    var oData = await this.fetchDataFromOData("Orders", oModel, aFilters, null);
                    //var oData = await this.fetchDataFromOData("Order_Details", oModel, oFilter, null);

                    this.getView().setModel(new JSONModel(oData.results), "ordersTableModel");
                } catch(error) {
                    console.error("Errore nel recuperare i dati: ", error);
                }
            },

            onTableRowSelect: function(oEvent) {
                var oSelectedItem = oEvent.getParameter("listItem");
                var oSelectedData = oSelectedItem.getBindingContext("ordersTableModel").getObject();
                var oSelectedOrderModel = new JSONModel(oSelectedData);
                this.getView().setModel(oSelectedOrderModel, "selectedOrderModel");
            },

            //codice per permettere il download del foglio excel
            createColumnConfig: function() {
                var aCols = [];
    
                aCols.push({
                    label: 'OrderID',
                    property: ['OrderID'],
                    type: EdmType.String,
                });

                aCols.push({
                    label: 'EmployeeID',
                    property: ['EmployeeID'],
                    type: EdmType.String,
                });

                aCols.push({
                    label: 'CustomerID',
                    property: ['CustomerID'],
                    type: EdmType.String,
                });
    
                return aCols;
            },
    
            onExport: function() {
                var aCols, oRowBinding, oSettings, oSheet, oTable;
    
                if (!this._oTable) {
                    this._oTable = this.byId('ordersTable');
                }
    
                oTable = this._oTable;
                oRowBinding = oTable.getBinding('items').oList; 
                aCols = this.createColumnConfig();
    
                oSettings = {
                    workbook: {
                        columns: aCols,
                        hierarchyLevel: 'Level'
                    },
                    dataSource: oRowBinding,
                    fileName: 'Table export sample.xlsx',
                    worker: false 
                };
    
                oSheet = new Spreadsheet(oSettings);
                oSheet.build().finally(function() {
                    oSheet.destroy();
                });
            },

            onValueHelp: async function() {
                if(!this._oDialog) 
                {
                    this._oDialog = sap.ui.xmlfragment("valueHelp", "sap.btp.progetto1.view.template.ValueHelp", this);
                    this.getView().addDependent(this._oDialog);

                    try {
                        var oModel = new ODataModel(url_oData);
                        var oData = await this.fetchDataFromOData("Orders", oModel, null, "CustomerID");

                        this.getView().setModel(new JSONModel(oData.results), "customerIDTableModel");
                    } catch(error) {
                        console.error("Errore nel recuperare i dati: ", error);
                    }

                    this._oDialog.open();
                } 
                else 
                {
                    this._oDialog.open();
                }
            },

            onCloseFragment: function() {
                this._oDialog.close();
                this._oDialog.destroy();
                this._oDialog = undefined;
            },

            onOKPressed: function() {
                // Ottieni l'elemento che ha generato l'evento, che dovrebbe essere la riga selezionata
                var oSelectedItem = sap.ui.core.Fragment.byId("valueHelp", "customerIDTable").getSelectedItem();

                // Ottieni il binding context dell'elemento selezionato
                var oBindingContext = oSelectedItem.getBindingContext("customerIDTableModel");

                // Ottieni il valore del CustomerID dal binding context
                var sCustomerID = oBindingContext.getProperty("CustomerID"); 

                // Passa il valore all'input CustomerID nella View1
                var oInputCustomerID = this.getView().byId("valueHelp");
                oInputCustomerID.setValue(sCustomerID);

                // Chiudi il dialog
                this.onCloseFragment();
            }
        });
    });
