
var server = require('server');
var base = module.superModule;
var Resource = require('dw/web/Resource');
var URLUtils = require('dw/web/URLUtils');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var userLoggedIn = require('*/cartridge/scripts/middleware/userLoggedIn');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');


server.get(
    'Return',
    consentTracking.consent,
    server.middleware.https,
    userLoggedIn.validateLoggedIn,
    function (req, res, next) {
        var Site = require('dw/system/Site');
        var URLUtils = require('dw/web/URLUtils');
        const currSite = Site.getCurrent();

        var OrderMgr = require('dw/order/OrderMgr');
        var orderHelpers = require('*/cartridge/scripts/order/orderHelpers');

        var order = OrderMgr.getOrder(req.querystring.orderID);
        var orderCustomerNo = req.currentCustomer.profile.customerNo;
        var currentCustomerNo = order.customer.profile.customerNo;
        var breadcrumbs = [
            {
                htmlValue: Resource.msg('global.home', 'common', null),
                url: URLUtils.home().toString()
            },
            {
                htmlValue: Resource.msg('page.title.myaccount', 'account', null),
                url: URLUtils.url('Account-Show').toString()
            },
            {
                htmlValue: Resource.msg('label.orderhistory', 'account', null),
                url: URLUtils.url('Order-History').toString()
            }
        ];

        if (order && orderCustomerNo === currentCustomerNo) {
            var orderModel = orderHelpers.getOrderDetails(req);
            var returnProductReasonsRef = currSite.getCustomPreferenceValue("showReturnProductReasons");

            res.render('checkout/productCard/returnProductsConfig', {
                order: orderModel,
                breadcrumbs: breadcrumbs,
                returnProductReasonsRef: returnProductReasonsRef,
            });
        } else {
            res.redirect(URLUtils.url('Account-Show'));
        }
        next();
    }
);



server.post(
    'Confirmation',
    consentTracking.consent,
    server.middleware.https,
    userLoggedIn.validateLoggedIn,
    function (req, res, next) {

        var form = request.getHttpParameterMap();
        var order = JSON.parse(form.get("orderData"));
        var lineItemIds = form.get("lineItemId").stringValues;

        var arrIDs = Array.from(lineItemIds);

        const returnedProductsData = [];

        arrIDs.forEach(id => {
            var reason = form.get(`reason_${id}`).stringValue;
            var quantity = form.get(`quantity_${id}`).stringValue;

            if (reason !== 'default') {
                returnedProductsData.push({
                    id, reason, quantity
                })
            }
        });

        returnedProductsData.forEach(returnProductData => {
            order.shipping[0].productLineItems.items
                .find(item => item.id === returnProductData.id)
                .returnProductData = returnProductData
        });


        res.render('checkout/productCard/returnProductsConfirmation', {
            order,
            returnedProductsData,
        });
        next();
    }
);


server.post('Update',
    consentTracking.consent,
    server.middleware.https,
    userLoggedIn.validateLoggedIn,
    function (req, res, next) {
        const OrderMgr = require('dw/order/OrderMgr');
        const Transaction = require('dw/system/Transaction');
        const URLUtils = require('dw/web/URLUtils');

        var form = request.getHttpParameterMap();
        var orderNumber = JSON.parse(form.get("orderNumber"));
        var lineItems = Array.from(JSON.parse(form.get("lineItems")));

        const returnData = []

        lineItems.forEach(item => {
            returnData.push(

                {
                    id: item.returnProductData.id,
                    reason: item.returnProductData.reason,
                    qty: item.returnProductData.quantity,

                    // TO DO: the date format is not as espected 03/03/2023
                    date: new Date().toLocaleDateString()
                }
            )

        });

        const returnedProductsData = {
            data: {
                batches: [
                    {
                        items: returnData
                    }
                ]
            }
        };



        Transaction.wrap(() => {
            let order = OrderMgr.getOrder(orderNumber);
            let returnedProducts = order.custom.returnedProducts ? JSON.parse(order.custom.returnedProducts) : { data: { batches: [] } };
            returnedProducts.data = returnedProductsData.data;
            order.custom.returnedProducts = JSON.stringify(returnedProducts);
        });

        res.json({
            success: true
        });
        res.redirect(URLUtils.url('Order-History'));

        next()
    }
);








module.exports = server.exports();