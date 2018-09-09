// Matthew Lester NEA Project - data-upload.js (Data Upload Router)

// Imports
import logger from "coloured-logger";
import BaseRouter from "./base-router";
import Middleware from "../lib/middleware";
import TaxonomicGroup from "../models/taxonomic-group";
import CustomError from "../lib/custom-error";
import Utils from "../lib/utils";
import Validator from "../lib/validator";
import Species from "../models/species";
import User from "../models/user";
import DataUpload from "../models/data-upload";
import Location from "../models/location";

// Log
const log = logger({ logName: "Routes/DataUpload" });

// DataUploadRouter Class
class DataUploadRouter extends BaseRouter {

    constructor() {
        super();

        // Models
        let tGroup = new TaxonomicGroup();
        let sModel = new Species();
        let uModel = new User();
        let lModel = new Location();

        // Redirect users if they are not logged in.
        this._router.use(Middleware.redirectTo("/login").ifNotLoggedIn);

        // New upload page route.
        this._router.get("/new", async(req, res) => {
            try {
                let groups = await tGroup.findAllGroups();
                let locations = await lModel.findAllLocations();
                res.render("data-upload/new", { groups, locations });
            }
            catch (err) {
                new CustomError(err).printFormattedStack(log);
                res.render("data-upload/new", { error: err.message, groups: null, locations: null });
            }
        });

        // POST route for location creation.
        this._router.post("/new-location", async(req, res) => {
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

        // New upload post route.
        this._router.post("/new", async(req, res) => {

            let body = req.body;

            let isValid = this._validateDataUpload(body);
            if (isValid === true) {
                let taxonomicGroup = body.taxonomicGroup;
                let foundGroup = await tGroup.findGroupByName(taxonomicGroup);

                if (foundGroup) {

                    // Set the db reference on the upload.
                    body.taxonomicGroup = foundGroup._id;

                    // List of all possible fields.
                    let fieldList = ["Species", "Number", "Gender", "Age", "Status", "Date", "Observers", "Comment"];

                    let optionalFields = foundGroup.optionalFields;
                    let invalidFields = foundGroup.invalidFields;
                    // Generate required fields by filtering out optional and invalid ones.
                    let requiredFields = fieldList.filter(field => {
                        return optionalFields.indexOf(field) === -1 && invalidFields.indexOf(field) === -1;
                    });

                    // Only allow 500 species at a time.
                    if (body.species.length > 500) {
                        return Utils.sendJSONResponse(res, "Please only upload a maximum of 500 species at a time.");
                    }

                    // Validate the upload.
                    let speciesError = false;
                    body.species.forEach((s, index) => {
                        if (speciesError) {
                            return;
                        }

                        // Validate the row of data.
                        // This both checks for the needed, optional and invalid fields and validates the data.
                        let speciesValid = this._validateSpeciesData(s, index + 1, requiredFields, optionalFields, invalidFields, foundGroup.statuses);

                        if (speciesValid !== true) {
                            speciesError = true;
                            Utils.sendJSONResponse(res, speciesValid);
                        }
                    });

                    if (speciesError) {
                        return;
                    }

                    // Loop through the species again.
                    // This section looks to see if a new species document should be created, or if it should
                    // just update an existing one.
                    try {
                        for (let species of body.species) {
                            // Set the name to lower-case, otherwise it will be stored in the database wrong!
                            let speciesName = species.species.toLowerCase();
                            let foundSpecies = await sModel.findSpeciesByName(speciesName);

                            // Set the number to itself or 1, for DRY code.
                            species.number = species.number || 1;

                            if (foundSpecies) {
                                // Update the count.
                                foundSpecies.count += species.number;

                                // Convert the species' date field into a Date object.
                                let firstSeen = foundSpecies.firstSeen;
                                let lastSeen = foundSpecies.lastSeen;
                                let thisDate = new Date(species.date);

                                // Update the firstSeen property if earlier than current one.
                                if (firstSeen.getTime() > thisDate.getTime()) {
                                    foundSpecies.firstSeen = thisDate;
                                }

                                // Update the lastSeen property of the species if it's more recent.
                                if (lastSeen.getTime() < thisDate.getTime()) {
                                    foundSpecies.lastSeen = thisDate;
                                }

                                // Update the seenBy property if it's the first time they've seen it.
                                let userId = req.user._id;
                                let stringifiedSeenBy = foundSpecies.seenBy.map(id => id.toString());

                                if (stringifiedSeenBy.indexOf(userId.toString()) === -1) {
                                    foundSpecies.seenBy.push(userId);
                                }

                                // Update the species document.
                                let updatedSpecies = await sModel.updateSpecies(foundSpecies);
                                // Set the db reference for the species.
                                species.species = updatedSpecies._id;
                            }
                            else {
                                // Set up the object.
                                let newSpecies = {
                                    name: speciesName,
                                    taxonomicGroup: foundGroup._id,
                                    count: species.number,
                                    seenBy: [req.user._id],
                                    firstSeen: new Date(species.date),
                                    lastSeen: new Date(species.date)
                                };

                                // Create the document.
                                let createdSpecies = await sModel.createSpecies(newSpecies);
                                // db reference.
                                species.species = createdSpecies._id;
                                log.info(`New species created: ${speciesName}.`);

                                // Add the species to the taxonomic group.
                                foundGroup.species.push(createdSpecies._id);
                            }

                            // Update the user's speciesSeen field.
                            await uModel.updateSpeciesCount(req.user.username, speciesName, species.number);
                        }

                        // Update the taxonomic group document.
                        await tGroup.updateGroup(foundGroup);
                    }
                    catch (err) {
                        new CustomError(err).printFormattedStack(log);
                        return Utils.sendJSONResponse(res);
                    }

                    try {
                        // Time to create the upload!
                        let newUpload = body;
                        newUpload.location = req.user.locationName;
                        newUpload.owner = req.user._id;
                        newUpload.date = new Date();

                        // Create the document.
                        let dModel = new DataUpload();
                        let upload = await dModel.createUpload(newUpload);

                        // Add the upload reference to the user.
                        let user = await uModel.findUserByUsername(req.user.username);
                        user.dataUploads.push(upload._id);
                        await uModel.updateUser(user);

                        // Upload completed!!
                        Utils.sendJSONResponse(res, {});

                        log.info(`New upload completed from user ${req.user.username}`);
                    }
                    catch (err) {
                        new CustomError(err).printFormattedStack(log);
                        return Utils.sendJSONResponse(res);
                    }

                }
                else {
                    Utils.sendJSONResponse(res, `Failed to find the taxonomic group, ${taxonomicGroup}.`);
                }
            }
            else {
                Utils.sendJSONResponse(res, isValid);
            }

        });

        // This route finds and returns form data for a specific taxonomic group.
        this._router.post("/taxonomic-group", async(req, res) => {
            let body = req.body;

            if (!body) {
                return Utils.sendJSONResponse(res, "No request body found.");
            }

            let isValid = this._validateGetGroupData(body);
            if (isValid === true) {
                try {
                    let group = await tGroup.findGroupByName(body.name);
                    Utils.sendJSONResponse(res, group);
                }
                catch (err) {
                    new CustomError(err).printFormattedStack(log);
                    Utils.sendJSONResponse(res);
                }
            }
            else {
                Utils.sendJSONResponse(res, isValid);
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

    _validateDataUpload(data) {
        let localNames = {
            species: "Species",
            taxonomicGroup: "Taxonomic Group"
        };

        let typeValid = Validator.validateType(data, Object);

        let typesValid = Validator.validateTypes(data, {
            species: Array,
            taxonomicGroup: String
        }, localNames);

        let keysValid = Validator.validateKeyCount(data, 2);

        let resultsArray = [typeValid, typesValid, keysValid];

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
