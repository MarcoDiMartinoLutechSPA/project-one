sap.ui.define([
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/odata/v2/ODataModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/btp/projectone/controller/BaseController",
    "../utils/DateFormatter"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
    */
    function (JSONModel, ODataModel, Filter, FilterOperator, BaseController, DateFormatter) {
        "use strict";

        const url_oData = "/V2/Northwind/Northwind.svc/";

        return BaseController.extend("sap.btp.projectone.controller.View2", 
        { 
            formatter : DateFormatter,

            onInit: function () {
                var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                oRouter.getRoute("RouteView2").attachPatternMatched(this._onRouteMatched, this);  
            },

            _onRouteMatched: async function(oEvent) {
                var encodedUserData = oEvent.getParameter("arguments").selectedOrderModel;
                var decodedUserData = JSON.parse(atob(encodedUserData)); 
                var oSelectedOrderModel = new JSONModel(decodedUserData);
                this.getView().setModel(oSelectedOrderModel, "selectedOrderModel"); 

                var sOrderID = decodedUserData.orderID;

                var aFilters = [];
                var oFilter = new Filter("OrderID", FilterOperator.EQ, sOrderID);
                aFilters.push(oFilter);

                var oModel = new ODataModel(url_oData);

                var oData = await this.fetchDataFromOData("Order_Details", oModel, aFilters, null);

                var orderDetailsTableModel = new JSONModel();
                orderDetailsTableModel.setData(oData.results);
                this.getView().setModel(orderDetailsTableModel, "orderDetailsTableModel");
            },

            onNavigateToPage1: function() {
                var oRouter = this.getOwnerComponent().getRouter();
                oRouter.navTo("RouteView1");
            },
        });
    });