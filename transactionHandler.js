/**
@NApiVersion 2.1
@NModuleScope Public
*/

define([
    'N/error',
    'N/log',
    'N/record',
    './generalHelper.js'
], (
    error,
    log,
    record,
    generalHelper
) => {
    const exports = {};

    const createSalesOrder_model = {
        entity: null,
        lineItems: null,
        location: null,
        terms: null,
        custbody30: null,
        custbody__verizon_rep_email: null,
        custbody_intnotes: null,
        salesrep: null,
        territory: null,
        shipmethod: null,
        shippingcost: null
    };

    const salesOrderLineItem_model = {

    };

    /**
     * 
     * @param {Object} obj 
     * @returns 
     */
    exports.createSalesOrder = (obj) => {
        const objKeys = Object.keys(obj);
        const isValidKeys = generalHelper.isSubset({
            mainArray: objKeys,
            subsetArray: Object.keys(createSalesOrder_model)
        });
        if (!isValidKeys) {
            const err = error.create({
                message: (
                    `${generalHelper.generateErrorMessageReturn(createSalesOrder_model, obj)}  
                    \n missing keys: ${generalHelper.findMissingKeys({mainArray: Object.keys(obj), subsetArray: Object.keys(createSalesOrder_model)})}`
                ),
                name: 'BAD_OBJ',
                notifyOff: false
            });
            throw err;
        }

        const salesOrder = record.create({type: record.Type.SALES_ORDER});
        const salesOrderRecFields = salesOrder.getFields();
        objKeys.forEach(key => {
            if (salesOrderRecFields.indexOf(key) > -1) {

                salesOrder.setValue({
                    fieldId: key,
                    value: obj[key]
                });
                
            }
        });

        //const lineItems = body.line_items;
        obj.lineItems.forEach((item, index) => {
            const lineItemKeys = Object.keys(item);
            lineItemKeys.forEach((key) => {
                salesOrder.setSublistValue({
                    sublistId: 'item',
                    fieldId: key,
                    line: index,
                    value: item[key]
                });
            });
        });
        
        return salesOrder.save();
        return;
        /*for (var i = 0; i < lineItems.length; i++) {
            //var itemId = getItemId(lineItems[i].sku);
            var itemId = lineItems[i].id;
            var quantity = lineItems[i].quantity;
            var price = quantity * lineItems[i].price - lineItems[i].total_discount;
            log.debug('itemId=' + itemId);
            salesOrder.setSublistValue({
                sublistId: 'item',
                fieldId: 'item',
                line: i,
                value: itemId
            });
            salesOrder.setSublistValue({
                sublistId: 'item',
                fieldId: 'amount',
                line: i,
                value: price
            });
            salesOrder.setSublistValue({
                sublistId: 'item',
                fieldId: 'taxcode',
                line: i,
                value: 6873
            });
            salesOrder.setSublistValue({
                sublistId: 'item',
                fieldId: 'quantity',
                line: i,
                value: quantity
            });
        }*/

        /*
        Location:  40 = VZ Router Express
        Terms:  75 = VZRouterExpress
        BI PLAN ID -custbody30:  [Business Internet Plan] value from Shopify
        Verizon Rep Email – custbody__verizon_rep_email: [Verizon_rep_email] value from Shopify
        Internal Notes – cutbody_intnotes:  [Special Notes] value from Shopify
        Sales Rep:  [csg_sales_rep_name] value from Shopify
        */
        salesOrder.setValue({
            fieldId: 'location',
            value: 40
        });
        salesOrder.setValue({
            fieldId: 'terms',
            value: 75
        });
        var biPlanId = getBiPlanId(body);
        salesOrder.setValue({
            fieldId: 'custbody30',
            value: biPlanId
        });
        var verizonRepEmail = getVerizonRepEmail(body);
        salesOrder.setValue({
            fieldId: 'custbody__verizon_rep_email',
            value: verizonRepEmail
        });
        var internalNotes = getInternalNotes(body);
        salesOrder.setValue({
            fieldId: 'custbody_intnotes',
            value: internalNotes
        });
        var salesRepId = getSalesRepId(body);
        var noSalesRep; //
        if (salesRepId === noSalesRepInternalId) { //
            salesRepId = 11730; // 
            noSalesRep = true; //
        } //
        salesOrder.setValue({
            fieldId: 'salesrep',
            value: salesRepId
        });
        var territory = getTerritory(body);
        var salesAssistantId = getSalesAssistantId(salesRepId, territory);
        if (noSalesRep) { //
            salesAssistantId = noSalesRepAssistantMap[territory]; // 
            log.debug('territory', territory);
        } //
        salesOrder.setValue({
            fieldId: 'custbody_salesassist',
            value: salesAssistantId
        });

        /*
        Shipping 
        Ground Shipping (5-7 days) Free	4|0
        2- Day shipping ($40) - (Available for IR305 ONLY)	6738|40
        Overnight ($70) - (Available for IR305ONLY)	6740|70
        */
        var shippingOptionTitle = body.shipping_lines[0].title;
        var shippingOptionMapped = shippingOptionsMap[shippingOptionTitle];
        var shippingOptionSplit = shippingOptionMapped.split('|');
        var shippingOption = parseInt(shippingOptionSplit[0]);
        var shippingCost = parseFloat(shippingOptionSplit[1]);
        salesOrder.setValue({
            fieldId: 'shipmethod',
            value: shippingOption
        });
        salesOrder.setValue({
            fieldId: 'shippingcost',
            value: shippingCost
        });


        return salesOrder.save();
    };

    return exports;
});