/**
@NApiVersion 2.1
@NScriptType Suitelet
@NModuleScope Public
*/

define([
    'N/encode', 
    'N/error',
    'N/https',
    'N/log', 
    'N/runtime',
    'N/record',
    './apiRequestValidator.js'
], (
    encode, 
    error,
    https,
    log, 
    runtime,
    record,
    apiRequestValidator
) => {

    const actionMap = {
        getSalesOrder: (params) => {
            apiRequestValidator.validateRequest({
                type: params.type,
                id: params.id,
                guid: params.guid
            });
            const rec = record.load({
                type: params.type,
                id: params.id
            });
            return rec.getText({fieldId: 'entity'});
        }
    };

    const handleGET = (params) => {
        log.debug(`get params=${params.action}`, JSON.stringify(params));
        return actionMap[params.action](params);
    };

    /*const handlePOST = (params) => {
        log.debug('post params', params);
    };*/

    return {
        onRequest: (context) => {
            try {
                switch(context.request.method) {
                    case 'GET':
                        const response = handleGET(context.request.parameters);
                        // TODO: replace with specificed origins
                        context.response.addHeader({
                            name: 'Access-Control-Allow-Origin',
                            value: '*'
                        });
                        context.response.write(response);
                        break;
                    /*case 'POST':
                        handlePOST(context.request.parameters);
                        break;*/
                    default:
                        log.debug(context.request.method, context);
                }
            } catch (e) {
                log.debug('error', e);
                context.response.write({output: 'something went wrong'});
            }
        }
    }
});