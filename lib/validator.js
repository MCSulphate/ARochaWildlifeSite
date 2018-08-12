// Matthew Lester NEA Project - validator.js (Form Data Validation Methods)

// Imports
import CustomError from "./custom-error";
import logger from "coloured-logger";

// Log
let log = logger({ logName: "Lib/Validator" });

// Map of validation code identifiers to values.
const VALIDATION_CODES = {
    VALIDATE_TYPE: 0,
    VALIDATE_TYPES: 1,
    VALIDATE_LENGTH: 2,
    VALIDATE_LENGTHS: 3,
    VALIDATE_ARRAY_TYPES: 4,
    VALIDATE_ARRAY_LENGTHS: 5,
    VALIDATE_NUMBER_SIZE: 6,
    VALIDATE_KEY_COUNT: 7
};

// Validator Class
class Validator {

    constructor() {
        throw new CustomError("Validator cannot be instantiated.");
    }
    
    // Returns whether a variable is null or undefined.
    static isNullOrUndefined(variable) {
        return (variable === undefined || variable === null);
    }

    // Returns whether a variable is an empty object.
    static isEmptyObject(variable) {
        return Object.keys(variable).length === 0;
    }
    
    // Returns a string version of a data's type.
    static getTypeRepresentation(data) {
        if (Validator.isNullOrUndefined(data)) {
            return "Empty";
        }
        else {
            return data.constructor.name;
        }
    }

    // Returns whether all results in an array are valid.
    static allValid(arr) {
        let valid = true;

        arr.forEach(e => {
            if (!valid) {
                return;
            }

            valid = e.valid;
        });

        return valid;
    }

    // Returns a formatted error message for all invalid data.
    static getErrorMessage(results) {
        let errorMessage = "";

        results.forEach(result => {
            // Not adding to the error message for valid results.
            if (result.valid) {
                return;
            }

            // This adds validation-method-specific messages to the overall message.
            switch (result.validationCode) {

                case VALIDATION_CODES.VALIDATE_TYPE:
                    {
                        let dataName = result.localName || "Some data";
                        let messageBody = `${dataName} is an invalid data type (${result.received}). `;
                        let errorPart = `It should be a(n) ${result.expected}.`;

                        errorMessage += messageBody + errorPart + "\n";
                        break;
                    }

                case VALIDATION_CODES.VALIDATE_TYPES:
                    {
                        let invalidFields = result.invalidFields;
                        let invalidKeys = Object.keys(invalidFields);

                        invalidKeys.forEach(key => {
                            let field = invalidFields[key];
                            // Try and get a local name, but make sure one has actually been given.
                            let fieldName = result.localNames ? result.localNames[key] || `"${key}"` : `"${key}"`;
                            let messageBody = `The ${fieldName} field is an invalid data type (${field.received}). `;
                            let errorPart = `It should be ${field.expected}.`;

                            errorMessage += messageBody + errorPart + "\n";
                        });

                        break;
                    }

                case VALIDATION_CODES.VALIDATE_LENGTH:
                    {
                        let dataName = result.localName || "Some data";
                        let messageBody = `${dataName} has an invalid number of characters (${result.received}). `;
                        let errorPart = `It should be greater than ${result.expected[0]}, and less than ${result.expected[1]}.`;

                        errorMessage += messageBody + errorPart + "\n";
                        break;
                    }

                case VALIDATION_CODES.VALIDATE_LENGTHS:
                    {
                        let invalidFields = result.invalidFields;
                        let invalidKeys = Object.keys(invalidFields);

                        invalidKeys.forEach(key => {
                            let field = invalidFields[key];
                            let fieldName = result.localNames ? result.localNames[key] || `"${key}"` : `"${key}"`;
                            let messageBody = `The ${fieldName} field has an invalid number of characters (${field.received}). `;
                            let errorPart = `It should be greater than ${field.expected[0]}, and less than ${field.expected[1]}.`;

                            errorMessage += messageBody + errorPart + "\n";
                        });
                        break;
                    }

                case VALIDATION_CODES.VALIDATE_ARRAY_TYPES:
                    {
                        let invalidFields = result.invalidFields;
                        let invalidKeys = Object.keys(invalidFields);
                        let dataName = result.localName || "field";

                        invalidKeys.forEach(key => {
                            let field = invalidFields[key];
                            let fieldName = `"${key}"`; // There are no local names per key here.
                            let messageBody = `The ${dataName}, ${fieldName}, is an invalid data type (${field.received}). `;
                            let errorPart = `It should be a(n) ${field.expected}.`;

                            errorMessage += messageBody + errorPart + "\n";
                        });
                        break;
                    }

                case VALIDATION_CODES.VALIDATE_ARRAY_LENGTHS:
                    {
                        let invalidFields = result.invalidFields;
                        let invalidKeys = Object.keys(invalidFields);
                        let dataName = result.localName || "field";

                        invalidKeys.forEach(key => {
                            let field = invalidFields[key];
                            let fieldName = `"${key}"`;
                            let messageBody = `The ${dataName}, ${fieldName}, has an invalid number of characters (${field.received}). `;
                            let errorPart = `It should be greater than ${field.expected[0]}, and less than ${field.expected[1]}.`;

                            errorMessage += messageBody + errorPart + "\n";
                        });
                        break;
                    }

                case VALIDATION_CODES.VALIDATE_NUMBER_SIZE:
                    {
                        let dataName = result.localName || "Some data";
                        let messageBody = `${dataName} has an invalid size (${result.received}). `;
                        let errorPart = `It should be greater than ${result.expected[0]}, and less than ${result.expected[1]}.`;

                        errorMessage += messageBody + errorPart + "\n";
                        break;
                    }

                case VALIDATION_CODES.VALIDATE_KEY_COUNT:
                    {
                        let dataName = result.localName || "Some data";
                        let messageBody = `${dataName} has an invalid number of fields (${result.received}). `;
                        let errorPart = `It should be equal to ${result.expected}.`;

                        errorMessage += messageBody + errorPart + "\n";
                        break;
                    }

                default:
                    {
                        errorMessage += "Failed to generate partial error message, check console.\n";
                        console.log("Failed partial error message:");
                        console.log(result);
                    }

            }

        });

        return errorMessage;
    }

    // Validates the type of a single piece of data.
    static validateType(data, type, localName) {
        // Check if it's null or undefined.
        let valid = Validator.isNullOrUndefined(data) ? false : Object(data) instanceof type;

        return {
            valid: valid,
            received: Validator.getTypeRepresentation(data),
            expected: type.name,
            localName: localName,
            validationCode: VALIDATION_CODES.VALIDATE_TYPE
        };
    }

    // Validates the types of data within an object.
    static validateTypes(data, types, localNames) {
        let typeKeys = Object.keys(types);
        let valid = true;
        let invalidFields = {};

        typeKeys.forEach(key => {
            // Using instanceof, so things like String, Boolean and Number can be used as types.
            let typeValid = Validator.validateType(data[key], types[key]);
            if (!typeValid.valid) {
                valid = false;

                invalidFields[key] = {
                    received: Validator.getTypeRepresentation(data[key]),
                    expected: types[key].name
                };
            }
        });

        return {
            valid: valid,
            invalidFields: Validator.isEmptyObject(invalidFields) ? null : invalidFields,
            localNames: localNames,
            validationCode: VALIDATION_CODES.VALIDATE_TYPES
        };
    }

    // Validates the types of data within an array.
    static validateArrayTypes(data, type, localName) {
        // Check that an array has been passed.
        let valid = data instanceof Array;
        let invalidFields = {};

        if (valid) {
            data.forEach(element => {
                let typeValid = Validator.validateType(element, type);
                if (!typeValid.valid) {
                    valid = false;

                    invalidFields[element] = {
                        received: Validator.getTypeRepresentation(element),
                        expected: type.name
                    };
                }
            });
        }

        return {
            valid: valid,
            invalidFields: Validator.isEmptyObject(invalidFields) ? null : invalidFields,
            localName: localName,
            validationCode: VALIDATION_CODES.VALIDATE_ARRAY_TYPES
        };
    }

    // Validates the length of a single piece of data.
    static validateLength(data, minLength, maxLength, localName) {
        let valid = true;
        let received;

        if (Validator.isNullOrUndefined(data.length)) {
            valid = false;
            received = "No Length";
        }
        else {
            if (data.length < (minLength || 0) || data.length > (maxLength || Infinity)) {
                valid = false;
            }
        }

        return {
            valid: valid,
            received: received || data.length,
            expected: [minLength, maxLength],
            localName: localName,
            validationCode: VALIDATION_CODES.VALIDATE_LENGTH
        };
    }

    // Validates the lengths of data within an object.
    static validateLengths(data, lengths, localNames) {
        let lengthKeys = Object.keys(lengths);
        let valid = true;
        let invalidFields = {};

        lengthKeys.forEach(key => {
            // Check if each bit of data has a .length property.
            if (Validator.isNullOrUndefined(data[key].length)) {
                valid = false;

                invalidFields[key] = {
                    received: "No Length",
                    expected: lengths[key]
                };
            }
            else {
                let dataLength = data[key].length;
                let minLength = lengths[key][0] || 0; // If none specified, the minimum is 0.
                let maxLength = lengths[key][1] || Infinity; // If none specified, there is no maximum.

                if (dataLength < minLength || dataLength > maxLength) {
                    valid = false;

                    invalidFields[key] = {
                        received: dataLength,
                        expected: [minLength, maxLength]
                    };
                }
            }
        });

        return {
            valid: valid,
            invalidFields: Validator.isEmptyObject(invalidFields) ? null : invalidFields,
            localNames: localNames,
            validationCode: VALIDATION_CODES.VALIDATE_LENGTHS
        };
    }

    // Validates the lengths of data in an array.
    static validateArrayLengths(data, minLength, maxLength, localName) {
        let valid = true;
        let invalidFields = {};

        // Set defaults.
        minLength = minLength || 0;
        maxLength = maxLength || Infinity;

        data.forEach(element => {
            if (Validator.isNullOrUndefined(element.length)) {
                valid = false;

                invalidFields[element] = {
                    received: "No Length",
                    expected: [minLength, maxLength]
                };
            }
            else {
                let elementLength = element.length;

                if (elementLength < minLength || elementLength > maxLength) {
                    valid = false;

                    invalidFields[element] = {
                        received: elementLength,
                        expected: [minLength, maxLength]
                    };
                }
            }
        });

        return {
            valid: valid,
            invalidFields: Validator.isEmptyObject(invalidFields) ? null : invalidFields,
            localName: localName,
            validationCode: VALIDATION_CODES.VALIDATE_ARRAY_LENGTHS
        };
    }

    // Validates the size of a number.
    static validateNumberSize(number, minSize, maxSize, localName) {
        let valid = !isNaN(number);

        minSize = minSize || 0;
        maxSize = maxSize || Infinity;

        if (valid) {
            valid = !(number < minSize || number > maxSize);
        }

        return {
            valid: valid,
            received: number,
            expected: [minSize, maxSize],
            localName: localName,
            validationCode: VALIDATION_CODES.VALIDATE_NUMBER_SIZE
        };
    }

    // Validates the number of bits of data within an object.
    static validateKeyCount(data, count, localName) {
        let keyCount = Object.keys(data).length;
        let valid = (data instanceof Object) && keyCount === count;

        return {
            valid: valid,
            received: keyCount,
            expected: count,
            localName: localName,
            validationCode: VALIDATION_CODES.VALIDATE_KEY_COUNT
        };
    }


}

// Export the class.
export default Validator;
