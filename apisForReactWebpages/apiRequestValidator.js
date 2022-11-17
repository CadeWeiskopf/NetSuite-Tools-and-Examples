/**
@NApiVersion 2.1
@NModuleScope Public
*/

define([
    'N/error',
    'N/record'
], (
    error,
    record
) => {
    const GUID_FIELD_ID = 'custbody_guidforsuitelet';
    // TODO: make map ^^

    return {
        validateRequest: (obj) => {
            const rec = record.load({
                type: obj.type,
                id: obj.id
            });
            const guidOnRecord = rec.getValue({fieldId: GUID_FIELD_ID});
            if (guidOnRecord !== obj.guid) {
                const err = error.create({
                    message: 'Failed to validate request',
                    name: 'BAD_VALIDATION',
                    notifyOff: false
                });
                throw err;
            }
        }
    };
});