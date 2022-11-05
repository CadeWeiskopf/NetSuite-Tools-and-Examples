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
    };

    return exports;
});
