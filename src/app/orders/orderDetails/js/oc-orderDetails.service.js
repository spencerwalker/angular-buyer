angular.module('orderCloud')
    .factory('ocOrderDetails', ocOrderDetailsService)
;

function ocOrderDetailsService($q, $exceptionHandler, OrderCloud){
    var service = {
        Get: _get
    };

    function _get(orderID){
        return OrderCloudSDK.Orders.Get(orderID)
            .then(function(order){
                return getBuyerOrg(order);
            });

        function getBuyerOrg(order){
            return OrderCloudSDK.Buyers.Get(order.FromCompanyID)
                .then(function(buyer){
                    order.FromCompany = buyer;
                    return order;
                })
                .catch(function(ex){
                    $exceptionHandler(ex);
                    return order;
                });
        }
    }

    return service;
}