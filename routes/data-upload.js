// Matthew Lester NEA Project - data-upload.js (Data Upload Router)

// Imports
import logger from "coloured-logger";
import BaseRouter from "./base-router";
import Middleware from "../lib/middleware";
import TaxonomicGroup from "../models/taxonomic-group";
import CustomError from "../lib/custom-error";
import Utils from "../lib/utils";
import Validator from "../lib/validator";
import User from "../models/user";
import DataUpload from "../models/data-upload";
import Location from "../models/location";
import Methodology from "../models/methodology";

// Log
const log = logger({ logName: "Routes/DataUpload" });

// DataUploadRouter Class
class DataUploadRouter extends BaseRouter {

    constructor() {
        super();

        // Models
        let tGroup = new TaxonomicGroup();
        let uModel = new User();
        let lModel = new Location();
        let dModel = new DataUpload();
        let mModel = new Methodology();

        // Redirect users if they are not logged in.
        this._router.use(Middleware.redirectTo("/login").ifNotLoggedIn);

        // New upload page route.
        this._router.get("/new", async(req, res) => {
            try {
                let groups = await tGroup.findAllGroups();
                let locations = await lModel.findAllLocations();
                let methodologies = await mModel.findAllMethodologies();
                
                res.render("data-upload/new", { groups, locations, methodologies });
            }
            catch (err) {
                new CustomError(err).printFormattedStack(log);
                res.render("data-upload/new", { error: err.message, groups: null, locations: null });
            }
        });

        // POST route for methodology creation.
        this._router.post("/methodology", async(req, res) => {
            let body = req.body;

            // Validate the data.
            let isValid = this._validateNewMethodologyData(body);
            if (isValid === true) {
                let success = await mModel.addNewMethodology(body);

                if (!success) {
                    Utils.sendJSONResponse(res);
                }
                else {
                    Utils.sendJSONResponse(res, {});
                }
            }
            else {
                Utils.sendJSONResponse(res, isValid);
            }
        });

        // POST route for location creation.
        this._router.post("/location", async(req, res) => {
            let body = req.body;
            
            // Make sure the uploaded data is valid.
            let isValid = this._validateNewLocationData(body);
            if (isValid === true) {
                let success = await lModel.addNewLocation(body);
                
                // Ensure that the process was a success.
                if (!success) {
                    Utils.sendJSONResponse(res);
                }
                else {
                    Utils.sendJSONResponse(res, {});
                }
            }
            else {
                // Send the validation error message.
                Utils.sendJSONResponse(res, isValid);
            }
        });

        // Handles requests to create new taxonomic groups.
        this._router.post("/taxonomic-group", async(req, res) => {
            let body = req.body;
            
            // Make sure the uploaded data is valid.
            let isValid = this._validateNewGroupData(body);
            if (isValid === true) {
                let success = await tGroup.createGroup(body);
                
                // Ensure that the process was a success.
                if (!success) {
                    Utils.sendJSONResponse(res);
                }
                else {
                    Utils.sendJSONResponse(res, {});
                }
            }
            else {
                // Send the validation error message.
                Utils.sendJSONResponse(res, isValid);
            }
        });

        // New upload post route.
        this._router.post("/new", async(req, res) => {

            let body = req.body;
            let species = body.species;
            let taxonomicGroup = body.taxonomicGroup;
            let location = body.location;
            let methodology = body.methodology;
            let observers = body.observers;
            let owner = req.user._id;

            // Attempt to resolve database ids for the taxonomic group and location.
            try {
                taxonomicGroup = await tGroup.findGroupID(taxonomicGroup);
                location = await lModel.findLocationID(location);
                methodology = await mModel.findMethodologyID(methodology);
            }
            catch (err) {
                log.error(`Failed to resolve Taxonomic Group / Location / Methodology IDs: ${err.message}`);
                Utils.sendJSONResponse(res);
                return;
            }

            // Attempt to replace every species date with an actual date object.
            try {
                for (let item of species) {
                    item.date = new Date(item.date);
                }
            }
            catch (err) {
                log.error(`Failed to create date objects for upload: ${err.message}`);
                Utils.sendJSONResponse(res);
                return;
            }

            // Create the data upload document.
            let dataUpload = {
                species,
                taxonomicGroup,
                location,
                methodology,
                observers,
                owner,
                date: new Date()
            };

            let createdUpload = await dModel.createUpload(dataUpload);

            if (!createdUpload) {
                // Upload failed, send an error.
                Utils.sendJSONResponse(res);
            }
            else {
                // Send the success response.
                log.info(`New data upload from ${req.user.username} completed, containing ${species.length} species.`);
                Utils.sendJSONResponse(res, {});
            }

        });

        // There is no index route for uploading, so redirect them to the new route.
        this._router.get("/", (req, res) => {
            res.redirect("/track/new");
        });

    }
    
    _validateNewLocationData(data) {
        let localNames = {
            locationName: "Location Name"
        };
        
        let typeValid = Validator.validateType(data, Object, "Uploaded Data");
        
        let typesValid = Validator.validateTypes(data, {
            locationName: String
        }, localNames);
        
        let lengthsValid = Validator.validateLengths(data, {
            locationName: [5, 50]
        }, localNames);
        
        let keysValid = Validator.validateKeyCount(data, 1, "The uploaded data");
        
        let resultsArray = [typeValid, typesValid, lengthsValid, keysValid];
        
        if (Validator.allValid(resultsArray)) {
            return true;
        }
        else {
            return Validator.getErrorMessage(resultsArray);
        }
    }

    _validateNewMethodologyData(data) {
        let localNames = {
            methodologyName: "Methodology Name"
        };

        let typeValid = Validator.validateType(data, Object, "Uploaded Data");

        let typesValid = Validator.validateTypes(data, {
            methodologyName: String
        }, localNames);

        let lengthsValid = Validator.validateLengths(data, {
            methodologyName: [5, 50]
        }, localNames);

        let keysValid = Validator.validateKeyCount(data, 1, "The uploaded data");
        
        let resultsArray = [typeValid, typesValid, lengthsValid, keysValid];
        
        if (Validator.allValid(resultsArray)) {
            return true;
        }
        else {
            return Validator.getErrorMessage(resultsArray);
        }
    }

    _validateNewGroupData(data) {
        let localNames = {
            groupName: "Group Name"
        };

        let typeValid = Validator.validateType(data, Object, "Uploaded Data");
        
        let typesValid = Validator.validateTypes(data, {
            groupName: String
        }, localNames);
        
        let lengthsValid = Validator.validateLengths(data, {
            groupName: [5, 50]
        }, localNames);
        
        let keysValid = Validator.validateKeyCount(data, 1, "The uploaded data");
        
        let resultsArray = [typeValid, typesValid, lengthsValid, keysValid];
        
        if (Validator.allValid(resultsArray)) {
            return true;
        }
        else {
            return Validator.getErrorMessage(resultsArray);
        }
    }

    _validateGetGroupData(data) {
        let localNames = {
            name: "Group Name"
        };

        let typeValid = Validator.validateType(data, Object, "Uploaded Data");

        let typesValid = Validator.validateTypes(data, {
            name: String
        }, localNames);

        let resultsArray = [typeValid, typesValid];

        if (Validator.allValid(resultsArray)) {
            return true;
        }
        else {
            return Validator.getErrorMessage(resultsArray);
        }
    }

    _validateSpeciesData(data, rowNumber, requiredFields, optionalFields, invalidFields, statuses) {

        // Upper-cases the first letter of a string.
        function upperCaseFirstLetter(string) {
            return string.charAt(0).toUpperCase() + string.slice(1);
        }

        let dataKeys = Object.keys(data);
        let errorMessage = `Error on row ${rowNumber}:\n`;

        // Required keys check.
        let requiredCheckFailed = false;
        requiredFields.forEach(field => {
            if (requiredCheckFailed) {
                return;
            }

            // Make it lower-case to match the key name.
            if (dataKeys.indexOf(field.toLowerCase()) === -1) {
                errorMessage += `The ${field} field is required. If you have not modified the table, please report this error to a system administrator.\n`;
                requiredCheckFailed = true;
            }
        });

        if (requiredCheckFailed) {
            return errorMessage;
        }

        // Now check each value, if it's undefined, check if it is optional.
        let optionalCheckFailed = false;
        dataKeys.forEach(key => {
            if (optionalCheckFailed) {
                return;
            }

            // This also acts as a 'required' field check, as it's making sure there are
            // no undefined values where they shouldn't be.
            if (!data[key]) {
                if (optionalFields.indexOf(upperCaseFirstLetter(key)) === -1) {
                    errorMessage += `The ${key} field is not optional, please fill it in.\n`;
                    optionalCheckFailed = true;
                }
                else {
                    // Remove the optional field, we don't want it in the upload, as it will mess with validation.
                    delete data[key];
                }
            }
        });

        if (optionalCheckFailed) {
            return errorMessage;
        }

        // Check that the entry has none of the invalid fields in it.
        let invalidCheckFailed = false;
        dataKeys.forEach(key => {
            if (invalidCheckFailed) {
                return;
            }

            if (invalidFields.indexOf(upperCaseFirstLetter(key)) !== -1) {
                errorMessage += `The ${key} cannot be used with this taxonomic group. If you have not modified the table, please report this error to a system administrator.\n`;
                invalidCheckFailed = true;
            }
        });

        if (invalidCheckFailed) {
            return errorMessage;
        }

        let isValid = this._validateRowData(data, rowNumber, statuses);
        if (isValid === true) {
            return true;
        }
        else {
            return isValid;
        }

    }

    // Validates a row of form data.
    _validateRowData(data, rowNumber, statusSet) {
        // Declare the results array up here, we have to dynamically check the fields.
        let resultsArray = [];

        // Some inputs have a set of values, so let's check that it's within those sets.
        let setError = false;
        let setErrorMessage;

        // Date types must also be validated differently.
        let dateError = false;
        let dateErrorMessage;

        // This occurs when there is an unexpected key.
        let keyError = false;
        let keyErrorMessage;

        // Sets
        let genderSet = ["Male", "Female"];
        let ageSet = ["Juvenile / Young", "Mature / Full-Grown"];

        let dataKeys = Object.keys(data);
        dataKeys.forEach(key => {
            // If there is a set, date or key error, return straight away (because we are only storing one).
            if (setError || dateError || keyError) {
                return;
            }

            // If the value is undefined, just skip it (we've already checked if it's allowed to be empty).
            if (!data[key]) {
                return;
            }
            else if (data[key] instanceof Array && data[key].length === 0) {
                return;
            }

            switch (key) {

                case "species":
                    // Push Validator.validation results straight into the results array.
                    resultsArray.push(Validator.validateType(data[key], String, "Species"));
                    resultsArray.push(Validator.validateLength(data[key], 3, 50, "Species"));
                    break;

                case "number":
                    resultsArray.push(Validator.validateType(data[key], Number, "Number"));
                    resultsArray.push(Validator.validateNumberSize(data[key], 1, 10000, "Number"));
                    break;

                case "gender":
                    resultsArray.push(Validator.validateType(data[key], String, "Gender"));
                    if (genderSet.indexOf(data[key]) === -1) {
                        setError = true;
                        setErrorMessage = "Invalid value for Gender: " + data[key] + ".";
                    }
                    break;

                case "age":
                    resultsArray.push(Validator.validateType(data[key], String, "Age"));
                    if (ageSet.indexOf(data[key]) === -1) {
                        setError = true;
                        setErrorMessage = "Invalid value for Age: " + data[key] + ".";
                    }
                    break;

                case "status":
                    resultsArray.push(Validator.validateType(data[key], String, "Status"));
                    if (statusSet.indexOf(data[key]) === -1) {
                        setError = true;
                        setErrorMessage = "Invalid value for Status: " + data[key] + ".";
                    }
                    break;

                case "date":
                    resultsArray.push(Validator.validateType(data[key], String, "Date"));
                    let dateObject = new Date(data[key]);

                    // We can check if it's a Validator.valid date quite easily (note the ==, not ===):
                    if (dateObject == "Invalid Date") {
                        dateError = true;
                        dateErrorMessage = "Invalid date supplied, make sure you have given a real date.";
                    }
                    // Check if it's in the future...
                    else if (dateObject.getTime() > Date.now()) {
                        dateError = true;
                        dateErrorMessage = "You can't set a date in the future!";
                    }
                    break;

                case "observers":
                    resultsArray.push(Validator.validateArrayTypes(data[key], String, "Observer"));
                    resultsArray.push(Validator.validateArrayLengths(data[key], 3, 30, "Observer"));
                    break;

                case "comment":
                    resultsArray.push(Validator.validateType(data[key], String, "Comment"));
                    resultsArray.push(Validator.validateLength(data[key], 3, 500, "Comment"));
                    break;

                default:
                    keyErrorMessage = `Unexpected key found in data: ${key}.`;
                    keyError = true;

            }

        });

        // Show an error message if necessary.
        let errorStart = `Error on row ${rowNumber}:\n`;

        if (setError) {
            return errorStart + setErrorMessage;
        }
        else if (dateError) {
            return errorStart + dateErrorMessage;
        }
        else if (keyError) {
            return errorStart + keyErrorMessage;
        }
        else if (Validator.allValid(resultsArray)) {
            return true;
        }
        else {
            return Validator.getErrorMessage(resultsArray);
        }
    }

}

// Export the class.
export default DataUploadRouter;
