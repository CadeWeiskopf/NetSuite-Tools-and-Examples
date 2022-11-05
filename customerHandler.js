/**
@NApiVersion 2.1
@NModuleScope Public
*/

define([
    'N/error',
    'N/log',
    'N/record',
    'N/search',
    './generalHelper.js'
], (
    error,
    log,
    record, 
    search, 
    generalHelper
) => {
    
    const exports = {};
    
    const getCustomers_model = {
        companyname: null,
        email: null
    };

    const updateDefaultShippingAndBillingAddresses_model = {
        shippingAddress: null,
        billingAddress: null,
        customerId: null
    };

    const createContact_model = {
        customerId: null,
        email: null,
        firstName: null,
        lastName: null,
        phone: null,
        title: null
    };

    const createCustomer_model = {
        companyname: null,
        email: null,
        shippingAddress: null,
        billingAddress: null,
        firstName: null,
        lastName: null,
        phone: null,
        title: null
    }

    /**
     * Searches for exact entityid (or name) match
     * Then searches for an exact email if did not find a name match
     * Lastly if no customer found still it will look for a domain match if only one record returns
     * (note the domain matching is limited and likely needs to be manually sorted out)
     * @param {Object} obj 
     * @returns customerId Integer 0 if none found
     */
    exports.getCustomer = (obj) => {
        const isValidKeys = generalHelper.isSubset({
            mainArray: Object.keys(obj),
            subsetArray: Object.keys(getCustomers_model)
        });
        if (!isValidKeys) {
            const err = error.create({
                message: (
                    `${generalHelper.generateErrorMessageReturn(getCustomers_model, obj)}
                    \n missing keys: ${generalHelper.findMissingKeys({mainArray: Object.keys(obj), subsetArray: Object.keys(getCustomers_model)})}`
                ),
                name: 'BAD_OBJ',
                notifyOff: false
            });
            throw err;
        }

        let customerId = 0;

        // exact customer name check
        let customerSearchObj = search.create({
            type: "customer",
            filters: [
                ["entityid", "is", obj.companyname]
            ],
            columns: [
                "internalid"
            ]
        });
        customerSearchObj.run().each(function (result) {
            customerId = result.getValue({name: 'internalid'});
        });
        if (customerId) {
            return customerId;
        }

        // exact email match check
        customerSearchObj = search.create({
            type: "customer",
            filters: [
                ["email", "is", obj.email]
            ],
            columns: [
                search.createColumn({
                    name: "internalid",
                    sort: search.Sort.DESC
                })
            ]
        });
        customerSearchObj.run().each(function (result) {
            customerId = result.getValue({name: 'internalid'});
        });
        if (customerId) {
            return customerId;
        }

        // search by email domain (only use customerId if one matches)
        let emailDomain = obj.email.split('@')[1];
        customerSearchObj = search.create({
            type: "customer",
            filters: [
                ["email", "contains", emailDomain]
            ],
            columns: [
                search.createColumn({
                    name: "internalid",
                    sort: search.Sort.DESC
                })
            ]
        });
        if (customerSearchObj.runPaged().count == 1) {
            customerSearchObj.run().each(function (result) {
                customerId = result.getValue({name: 'internalid'});
            });   
        }    

        // returns 0 if none found
        return customerId;
    };

    /**
     * creates a contact or updates an existing one
     * @param {Object} obj 
     * @returns 
     */
    exports.createContact = (obj) => {
        const isValidKeys = generalHelper.isSubset({
            mainArray: Object.keys(obj),
            subsetArray: Object.keys(createContact_model)
        });
        if (!isValidKeys) {
            const err = error.create({
                message: (
                    `${generalHelper.generateErrorMessageReturn(createContact_model, obj)}
                    \n missing keys: ${generalHelper.findMissingKeys({mainArray: Object.keys(obj), subsetArray: Object.keys(createContact_model)})}`
                ),
                name: 'BAD_OBJ',
                notifyOff: false
            });
            throw err;
        }
        
        let contactId = 0;
        let contactSearchObj = search.create({
            type: "contact",
            filters: [
                [
                    [
                        ["firstname","is",obj.firstName],"AND",["lastname","is",obj.lastName]
                    ],
                    "OR",
                    [
                        "entityid","is",`${obj.firstName} ${obj.lastName}`
                    ]
                ], 
                "AND", 
                [
                    "company", "anyof", obj.customerId
                ]
            ],
            columns: [
                search.createColumn({
                    name: "internalid",
                    sort: search.Sort.DESC
                })
            ]
        });
        contactSearchObj.run().each(function (result) {
            contactId = result.getValue({name: 'internalid'});
        });
        
        if (contactId) {
            // update contact
            var existingContact = record.load({
                type: record.Type.CONTACT,
                id: contactId
            });
            existingContact.setValue({
                fieldId: 'email',
                value: obj.email
            });
            existingContact.setValue({
                fieldId: 'phone',
                value: obj.phone
            });
            existingContact.setValue({
                fieldId: 'title',
                value: obj.title
            });
            existingContact.save();
        } else {
            // create contact
            var newContact = record.create({type: record.Type.CONTACT});
            newContact.setValue({
                fieldId: 'firstname',
                value: obj.firstName
            });
            newContact.setValue({
                fieldId: 'lastname',
                value: obj.lastName
            });
            newContact.setValue({
                fieldId: 'title',
                value: obj.title
            });
            newContact.setValue({
                fieldId: 'email',
                value: obj.email
            });
            newContact.setValue({
                fieldId: 'phone',
                value: obj.phone
            });
            newContact.setValue({
                fieldId: 'company',
                value: obj.customerId
            });
            newContact.save();
        }
    }


    /**
     * 
     * @param {Object} obj 
     */
    exports.updateDefaultShippingAndBillingAddresses = (obj) => {
        const isValidKeys = generalHelper.isSubset({
            mainArray: Object.keys(obj),
            subsetArray: Object.keys(updateDefaultShippingAndBillingAddresses_model)
        });
        if (!isValidKeys) {
            const err = error.create({
                message: (
                    `${generalHelper.generateErrorMessageReturn(updateDefaultShippingAndBillingAddresses_model, obj)}
                    \n missing keys: ${generalHelper.findMissingKeys({mainArray: Object.keys(obj), subsetArray: Object.keys(updateDefaultShippingAndBillingAddresses_model)})}`
                ),
                name: 'BAD_OBJ',
                notifyOff: false
            });
            throw err;
        }

        const customerRec = record.load({
            type: record.Type.CUSTOMER,
            id: obj.customerId
        });

        let lineCount = customerRec.getLineCount({sublistId: 'addressbook'});
        customerRec.insertLine({
            sublistId: 'addressbook',
            line: lineCount
        });
        customerRec.setSublistValue({
            sublistId: 'addressbook',
            fieldId: 'label',
            line: lineCount,
            value: obj.billingAddress.label
        });
        customerRec.setSublistValue({
            sublistId: 'addressbook',
            fieldId: 'defaultbilling',
            line: lineCount,
            value: true
        });
        customerRec.setSublistValue({
            sublistId: 'addressbook',
            fieldId: 'defaultshipping',
            line: lineCount,
            value: false
        });
        var addressRecord = customerRec.getSublistSubrecord({
            sublistId: 'addressbook',
            fieldId: 'addressbookaddress',
            line: lineCount
        });
        addressRecord.setValue({
            fieldId: 'addressee',
            value: obj.billingAddress.addressee
        });
        addressRecord.setValue({
            fieldId: 'addr1',
            value: obj.billingAddress.addr1
        });
        addressRecord.setValue({
            fieldId: 'addr2',
            value: obj.billingAddress.addr2
        });
        addressRecord.setValue({
            fieldId: 'city',
            value: obj.billingAddress.city
        });
        addressRecord.setValue({
            fieldId: 'state',
            value: obj.billingAddress.state
        });
        addressRecord.setValue({
            fieldId: 'zip',
            value: obj.billingAddress.zip
        });

        // insert shipping
        lineCount++;
        customerRec.insertLine({
            sublistId: 'addressbook',
            line: lineCount
        });
        customerRec.setSublistValue({
            sublistId: 'addressbook',
            fieldId: 'label',
            line: lineCount,
            value: obj.shippingAddress.label
        });
        customerRec.setSublistValue({
            sublistId: 'addressbook',
            fieldId: 'defaultbilling',
            line: lineCount,
            value: false
        });
        customerRec.setSublistValue({
            sublistId: 'addressbook',
            fieldId: 'defaultshipping',
            line: lineCount,
            value: true
        });
        addressRecord = customerRec.getSublistSubrecord({
            sublistId: 'addressbook',
            fieldId: 'addressbookaddress',
            line: lineCount
        });
        addressRecord.setValue({
            fieldId: 'addressee',
            value: obj.shippingAddress.addressee
        });
        addressRecord.setValue({
            fieldId: 'addr1',
            value: obj.shippingAddress.addr1
        });
        addressRecord.setValue({
            fieldId: 'addr2',
            value: obj.shippingAddress.addr2
        });
        addressRecord.setValue({
            fieldId: 'city',
            value: obj.shippingAddress.city
        });
        addressRecord.setValue({
            fieldId: 'state',
            value: obj.shippingAddress.state
        });
        addressRecord.setValue({
            fieldId: 'zip',
            value: obj.shippingAddress.zip
        });
        
        customerRec.save();
    };

    /**
     * returns customer internal id
     * @param {Object} obj 
     */
     exports.createCustomer = (obj) => {
        const objKeys = Object.keys(obj);
        const isValidKeys = generalHelper.isSubset({
            mainArray: objKeys,
            subsetArray: Object.keys(createCustomer_model)
        });
        if (!isValidKeys) {
            const err = error.create({
                message: (
                    `${generalHelper.generateErrorMessageReturn(createCustomer_model, obj)}
                    \n missing keys: ${generalHelper.findMissingKeys({mainArray: Object.keys(obj), subsetArray: Object.keys(createCustomer_model)})}`
                ),
                name: 'BAD_OBJ',
                notifyOff: false
            });
            throw err;
        }

        const newCustomer = record.create({type: record.Type.CUSTOMER});
        const customerRecFields = newCustomer.getFields();
        objKeys.forEach(key => {
            if (customerRecFields.indexOf(key) > -1) {
                newCustomer.setValue({
                    fieldId: key,
                    value: obj[key]
                });
            }
        });

        /*newCustomer.setValue({
            fieldId: 'companyname',
            value: obj.companyname
        });*/

        let lineCount = 0;
        newCustomer.insertLine({
            sublistId: 'addressbook',
            line: lineCount
        });
        newCustomer.setSublistValue({
            sublistId: 'addressbook',
            fieldId: 'label',
            line: lineCount,
            value: obj.billingAddress.label
        });
        newCustomer.setSublistValue({
            sublistId: 'addressbook',
            fieldId: 'defaultbilling',
            line: lineCount,
            value: true
        });
        newCustomer.setSublistValue({
            sublistId: 'addressbook',
            fieldId: 'defaultshipping',
            line: lineCount,
            value: false
        });
        var addressRecord = newCustomer.getSublistSubrecord({
            sublistId: 'addressbook',
            fieldId: 'addressbookaddress',
            line: lineCount
        });
        addressRecord.setValue({
            fieldId: 'addressee',
            value: obj.billingAddress.addressee
        });
        addressRecord.setValue({
            fieldId: 'addr1',
            value: obj.billingAddress.addr1
        });
        addressRecord.setValue({
            fieldId: 'addr2',
            value: obj.billingAddress.addr2
        });
        addressRecord.setValue({
            fieldId: 'city',
            value: obj.billingAddress.city
        });
        addressRecord.setValue({
            fieldId: 'state',
            value: obj.billingAddress.state
        });
        addressRecord.setValue({
            fieldId: 'zip',
            value: obj.billingAddress.zip
        });

        // insert shipping
        lineCount++;
        newCustomer.insertLine({
            sublistId: 'addressbook',
            line: lineCount
        });
        newCustomer.setSublistValue({
            sublistId: 'addressbook',
            fieldId: 'label',
            line: lineCount,
            value: obj.shippingAddress.label
        });
        newCustomer.setSublistValue({
            sublistId: 'addressbook',
            fieldId: 'defaultbilling',
            line: lineCount,
            value: false
        });
        newCustomer.setSublistValue({
            sublistId: 'addressbook',
            fieldId: 'defaultshipping',
            line: lineCount,
            value: true
        });
        addressRecord = newCustomer.getSublistSubrecord({
            sublistId: 'addressbook',
            fieldId: 'addressbookaddress',
            line: lineCount
        });
        addressRecord.setValue({
            fieldId: 'addressee',
            value: obj.shippingAddress.addressee
        });
        addressRecord.setValue({
            fieldId: 'addr1',
            value: obj.shippingAddress.addr1
        });
        addressRecord.setValue({
            fieldId: 'addr2',
            value: obj.shippingAddress.addr2
        });
        addressRecord.setValue({
            fieldId: 'city',
            value: obj.shippingAddress.city
        });
        addressRecord.setValue({
            fieldId: 'state',
            value: obj.shippingAddress.state
        });
        addressRecord.setValue({
            fieldId: 'zip',
            value: obj.shippingAddress.zip
        });
        
        const customerId = newCustomer.save();

        // create contact record
        exports.createContact({
            ...obj,
            customerId
        });

        return customerId;
    };

    return exports;
});