/**
@NApiVersion 2.1
@NModuleScope Public
*/

define([
    'N/error',
], (
    error,
) => {
    const exports = {};

    /**
     * use this to return error messages when passed in obj does not have all the necessary keys
     * @param {Object} model 
     * @param {Object} obj 
     * @returns String
     */
    exports.generateErrorMessageReturn = (model, obj) => {
        return `Please provide object with these keys: ${JSON.stringify(model)}.`;
    }

    /**
     * helper function to make sure object passed in has all required keys.
     * mainArray must always be the passed in object keys.
     * subsetArray must be a _model object's keys.
     * 
     * foreach element in the mainArray scan to see if the subsetArray has that key
     * if so numMatches++
     * return true when numMatchesFromSubset = subsetArray.length 
     * @param {String[]} a 
     * @param {String[]} b 
     * @returns Boolean or error String
     */
    exports.isSubset = (obj) => {
        if (!obj.mainArray || !obj.subsetArray) {
            const err = error.create({
                message: generateErrorMessageReturn({mainArray: [], subsetArray: []}, obj),
                name: 'BAD_OBJ',
                notifyOff: true
            });
            throw err;
        }

        let k = 0;
        let numMatchesFromSubset = 0;
        for (let i = 0; i < obj.mainArray.length; i++) {
            for (k = 0; k < obj.subsetArray.length; k++) {
                if (obj.subsetArray[k] === obj.mainArray[i]) {
                    break;
                }
            }

            if (k !== obj.subsetArray.length) {
                numMatchesFromSubset++;
            }
        }

        return numMatchesFromSubset === obj.subsetArray.length;
    }

    /**
     * 
     * @param {Object} obj 
     * @returns String[] missingKeys
     */
    exports.findMissingKeys = (obj) => {
        const missingKeys = [];
        const keysFound = [];
        let k = 0;
        let numMatchesFromSubset = 0;
        for (let i = 0; i < obj.mainArray.length; i++) {
            for (k = 0; k < obj.subsetArray.length; k++) {
                if (obj.subsetArray[k] === obj.mainArray[i]) {
                    break;
                }
            }

            if (k !== obj.subsetArray.length) {
                keysFound.push(obj.mainArray[i]);
                numMatchesFromSubset++;
            }
        }

        obj.subsetArray.forEach(e => {
            if (keysFound.indexOf(e) === -1) {
                missingKeys.push(e);
            }
        });

        return missingKeys;
    };

    return exports;
});