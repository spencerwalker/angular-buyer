angular.module('orderCloud')
    .factory('ocCheckoutPaymentService', OrderCloudCheckoutPaymentService)
;

function OrderCloudCheckoutPaymentService($q, $uibModal, sdkOrderCloud) {
    var service = {
        PaymentsExceedTotal: _paymentsExceedTotal,
        RemoveAllPayments: _removeAllPayments,
        SelectPaymentAccount: _selectPaymentAccount,
        Save: _save
    };

    function _paymentsExceedTotal(payments, orderTotal) {
        var paymentTotal = 0;
        angular.forEach(payments.Items, function(payment) {
            paymentTotal += payment.Amount;
        });

        return paymentTotal.toFixed(2) > orderTotal;
    }

    function _removeAllPayments(payments, order) {
        var deferred = $q.defer();

        var queue = [];
        angular.forEach(payments.Items, function(payment) {
            queue.push(sdkOrderCloud.Payments.Delete('outgoing', order.ID, payment.ID));
        });

        $q.all(queue).then(function() {
            deferred.resolve();
        });

        return deferred.promise;
    }

    function _selectPaymentAccount(payment, order) {
        return $uibModal.open({
            templateUrl: 'checkout/payment/directives/templates/selectPaymentAccount.modal.html',
            controller: 'SelectPaymentAccountModalCtrl',
            controllerAs: 'selectPaymentAccount',
            size: 'md',
            resolve: {
                Accounts: function(sdkOrderCloud) {
                    var options = {page: 1, pageSize: 100};
                    if (payment.Type == 'SpendingAccount') {
                        options.filters = {RedemptionCode: '!*', AllowAsPaymentMethod: true};
		                return sdkOrderCloud.Me.ListSpendingAccounts(options);
                    } else {
                        return sdkOrderCloud.Me.ListCreditCards(options);
                    }
                },
                Payment: function() {
                    return payment;
                },
                Order: function() {
                    return order;
                }
            }
        }).result;
    }

    function _save(payment, order, account) {
        var df = $q.defer();

        if (payment.ID) {
			sdkOrderCloud.Payments.Delete('outgoing', order.ID, payment.ID)
				.then(function() {
					delete payment.ID;
					createPayment(payment);
				});
		} else {
			createPayment(payment);
		}

		function createPayment(newPayment) {
			sdkOrderCloud.Payments.Create('outgoing', order.ID, newPayment)
				.then(function(data) {
					if (data.SpendingAccountID) data.SpendingAccount = account;
					if (data.CreditCardID) data.CreditCard = account;

                    df.resolve(data);
				});
		}

        return df.promise;
    }

    return service;
}