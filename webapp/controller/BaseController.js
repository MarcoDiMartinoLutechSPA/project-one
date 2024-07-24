sap.ui.define([
    "sap/ui/core/mvc/Controller"
], 

    function(Controller) {
        "use strict";

        return Controller.extend("sap.btp.projectone.controller.BaseController", {
            onInit: function() {

            },

            fetchDataFromOData: function(sEntitySet, oModel, aFilters, sQueryOptions) {
                return new Promise((resolve, reject) => {
                    var mParameters = {
                        filters: aFilters, //filters vuole sempre un array
                        success: function(oData, response) {
                            resolve(oData);
                        },
                        error: function(oError) {
                            reject(oError);
                        }
                    };
            
                    // Aggiungi il parametro $select solo se sQueryOptions non è vuoto o nullo
                    if (sQueryOptions) {
                        mParameters.urlParameters = { "$select": sQueryOptions };
                    }
                    
                    oModel.read("/" + sEntitySet, mParameters);
                });
            }
        });
    });