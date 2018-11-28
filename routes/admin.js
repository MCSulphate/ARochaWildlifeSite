// Matthew Lester NEA Project - admin.js (Admin Routes)

// Imports
import BaseRouter from "./base-router";
import Middleware from "../lib/middleware";
import User from "../models/user";
import CustomError from "../lib/custom-error";
import logger from "coloured-logger";
import Validator from "../lib/validator";
import Utils from "../lib/utils";
import TaxonomicGroup from "../models/taxonomic-group";
import DataUpload from "../models/data-upload";
import Species from "../models/species";

// AdminRouter Class
class AdminRouter extends BaseRouter {

    constructor() {
        super();

        // Log
        let log = logger({ logName: "Routes/Admin" });

        // Model Instances
        let user = new User();
        let tGroup = new TaxonomicGroup();
        let dUpload = new DataUpload();
        let sModel = new Species();

        // Always redirect non-admin users back to the landing page if they are
        // not the admin user.
        this._router.use(Middleware.redirectTo("/").ifNotAdmin);

        // Admin panel route.
        this._router.get("/panel", (req, res) => {
            res.render("admin/panel");
        });

        // Accounts Page
        // Account management route.
        this._router.get("/accounts", async(req, res) => {

            try {
                let users = await user.findAllUsers();
                res.render("admin/accounts", { users: users });
            }
            catch (err) {
                // Log the error, and render an error message.
                new CustomError(err, "Models/User").printFormattedStack(log);
                res.render("admin/accounts", { error: err.message });
            }
        });

        // Handles new account creation.
        this._router.post("/accounts", async(req, res) => {
            // Get the form data from the request.
            let userToCreate = req.body;

            // Validate the form data.
            let isValid = this._validateFormData(userToCreate);

            if (isValid === true) {

                try {
                    // Register the new user.
                    let createdUser = await user.registerUser(userToCreate);

                    log.info("Created a new user: " + createdUser.username);
                    Utils.sendJSONResponse(res, {});
                }
                catch (err) {
                    // Check if the reason is that the username already exists.
                    if (err.message.indexOf("duplicate key error") !== -1) {
                        // Send a more specific error message.
                        Utils.sendJSONResponse(res, "A user with that username already exists.");
                        log.warn("An admin tried to create an account with an existing username, " + userToCreate.username);
                    }
                    else {
                        Utils.sendJSONResponse(res);
                    }
                }
            }
            else {
                // If it's not true, it will be the formatted error message.
                Utils.sendJSONResponse(res, isValid);
            }
        });

        // Handles account deleting.
        this._router.delete("/accounts", async(req, res) => {
            // Get the submitted data.
            let body = req.body;

            let isValid = this._validateUserDeleteData(body);

            if (isValid === true) {
                let username = body.username;

                // Delete the user.
                try {
                    await user.removeUserByUsername(username);
                    log.info("Deleted a user: " + username);
                    Utils.sendJSONResponse(res, {});
                }
                catch (err) {
                    // Log and send error message.
                    new CustomError(err).printFormattedStack(log);
                    Utils.sendJSONResponse(res);
                }
            }
            else {
                Utils.sendJSONResponse(res, isValid);
            }
        });

        // Handles account updating.
        this._router.put("/accounts", async(req, res) => {
            // Get the submitted data.
            let body = req.body;
            
            // Update the user's password.
            let success = await user.changeUserPassword(body, true);

            // Send the appropriate response.
            if (!success) {
                Utils.sendJSONResponse(res, "Failed to update the user.");
            }
            else {
                log.info(`Admin updated the password for ${body.username}.`);
                Utils.sendJSONResponse(res, {});
            }
        });

        // Taxonomic Groups Page
        // Page route.
        this._router.get("/taxonomic-groups", async(req, res) => {
            try {
                let groups = await tGroup.findAllGroups();
                res.render("admin/taxonomic-groups", { groups: groups });
            }
            catch (err) {
                new CustomError(err, "Routes/Admin").printFormattedStack(log);
                res.render("admin/taxonomic-groups", { error: err.message });
            }
        });

        // Handles creation of taxonomic groups.
        this._router.post("/taxonomic-groups", async(req, res) => {
            let body = req.body;

            // Validate the data.
            let isValid = this._validateGroupData(body);
            if (isValid === true) {

                try {
                    let createdGroup = await tGroup.createGroup(body);
                    log.info("Created a taxonomic group: " + createdGroup.name);
                    Utils.sendJSONResponse(res, {});
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

        // Handles deletion of taxonomic groups.
        this._router.delete("/taxonomic-groups", async(req, res) => {
            let body = req.body;

            // Validate
            let isValid = this._validateGroupDeleteData(body);
            if (isValid === true) {

                try {
                    await tGroup.removeGroupByName(body.name);
                    log.info("Deleted a taxonomic group: " + body.name);
                    Utils.sendJSONResponse(res, {});
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

        // Handles group updating.
        this._router.put("/taxonomic-groups", async(req, res) => {
            let body = req.body;

            // Validate
            let isValid = this._validateGroupData(body);
            if (isValid === true) {

                try {
                    let updatedGroup = await tGroup.updateGroup(body);
                    log.info("Updated a taxonomic group: " + updatedGroup.name);
                    Utils.sendJSONResponse(res, {});
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

        // Data Upload Show Page
        // Page route.
        this._router.get("/data-uploads", async(req, res) => {
            // Get all of the data uploads.
            try {
                let uploads = await dUpload.findAndPopulateAllUploads();
                res.render("admin/data-uploads", { uploads });
            }
            catch (err) {
                new CustomError(err).printFormattedStack(log);
                res.render("admin/data-uploads", { error: err.message });
            }
        });

        // Handles updating of data uploads.
        this._router.put("/data-uploads", (req, res) => {
            let body = req.body;

            // TODO
        });

        // Handles deleting of data uploads.
        this._router.delete("/data-uploads", async(req, res) => {
            let body = req.body;

            if (body) {
                let id = body.id;
                if (!id) {
                    return Utils.sendJSONResponse(res, "No upload ID given.");
                }

                // Find the data upload to remove.
                let upload = await dUpload.findUploadByID(id);
                if (upload) {
                    // Variable that stores changes to species.
                    let changes = [];
                    
                    // User info.
                    let userDoc = await user.findUserById(upload.owner);

                    // Loop through the species, and update the data for each.
                    for (let species of upload.species) {
                        let id = species.species;
                        let number = species.number || 1;
                        let foundSpecies = await sModel.findSpeciesByID(id);
                        let speciesExists = !!foundSpecies;

                        if (!speciesExists) {
                            foundSpecies = {};
                        }

                        // Species info.
                        let count = foundSpecies.count;
                        let seenBy = foundSpecies.seenBy;
                        let firstSeen = foundSpecies.firstSeen;
                        let lastSeen = foundSpecies.lastSeen;

                        // Check if the user actually exists.
                        if (userDoc) {
                            let speciesSeen = userDoc.speciesSeen;
                            let speciesCount = speciesSeen[id.toString()];
                            speciesCount -= number;

                            // Check if the user has still 'seen' the species.
                            speciesSeen[id.toString()] = speciesCount;
                            if (speciesCount <= 0) {
                                // Remove them from the species' 'seen by' list.
                                seenBy.splice(seenBy.indexOf(userDoc.id.toString()), 1);
                                foundSpecies.seenBy = seenBy;
                                
                                // Remove the species from the user's document.
                                delete speciesSeen[id.toString()];
                            }
                            else {
                                // Update the count on the user's document.
                                speciesSeen[id.toString()] = speciesCount;
                            }
                            
                            userDoc.speciesSeen = speciesSeen;
                        }

                        // Lower the count, check if it is <= 0. If it is, then remove the species altogether, removing any other references.
                        count -= number;
                        if (count <= 0 && speciesExists) { // Make sure the species still exists!
                            // TODO: Remove the species and all references (nothing else needed to be done).
                            // Remove the species from the taxonomic group, and update it.
                            let group = await tGroup.findGroupByID(upload.taxonomicGroup);
                            group.species.splice(group.species.indexOf(id), 1);
                            await tGroup.updateGroup(group);

                            // Remove the upload document, from the user's references and the database.
                            if (userDoc) {
                                userDoc.dataUploads.splice(userDoc.dataUploads.indexOf(upload._id), 1);
                                await user.updateUser(userDoc);
                            }

                            // Remove the species model.
                            await sModel.removeSpeciesByID(id);

                            // Add a change log.
                            changes.push(`The species ${foundSpecies.name} was deleted (no more have been seen).`);
                        }
                        else {
                            foundSpecies.count = count;

                            if (userDoc) {
                                // Remove the upload from the user's document and update the user.
                                userDoc.dataUploads.splice(userDoc.dataUploads.indexOf(upload._id), 1);
                                await user.updateUser(userDoc);
                            }

                            // Check if firstSeen or lastSeen need to be changed.
                            if (upload.date.toDateString() === firstSeen.toDateString()) {
                                let firstSeen = await dUpload.findWhenSpeciesFirstSeen(id);
                                foundSpecies.firstSeen = firstSeen;
                            }
                            else if (upload.date.toDateString() === lastSeen.toDateString) {
                                let lastSeen = await dUpload.findWhenSpeciesLastSeen(id);
                                foundSpecies.lastSeen = lastSeen;
                            }

                            // Update the species document.
                            await sModel.updateSpecies(foundSpecies);
                            
                            // Add a change log.
                            changes.push(`The species ${foundSpecies.name} was updated (-${number} seen, now ${count} have been seen).`);
                        }
                    }
                    
                    // Log a summary of the changes made.
                    log.info(`${req.user.username} deleted an upload, here are a summary of the changes:`);
                    for (let key of Object.keys(changes)) {
                        log.info((parseInt(key) + 1) + ". " + changes[key]);
                    }

                    // Delete the upload, and send a success message.
                    await dUpload.removeUploadByID(upload._id);
                    Utils.sendJSONResponse(res, {});
                }
                else {
                    Utils.sendJSONResponse(res, "Invalid upload ID given.");
                }
            }
            else {
                Utils.sendJSONResponse(res, "No request body found.");
            }
        });

        // There is no index route for this, redirect to the panel.
        this._router.get("/", (req, res) => res.redirect("/admin/panel"));

    }

    _validateFormData(data) {
        // Local names.
        let localNames = {
            username: "Username",
            password: "Password"
        };

        // Validate the data type.
        let dataValid = Validator.validateType(data, Object, "Uploaded Data");

        // Validate data types.
        let typesValid = Validator.validateTypes(data, {
            username: String,
            password: String
        }, localNames);

        // Validate data lengths.
        let lengthsValid = Validator.validateLengths(data, {
            username: [3, 20],
            password: [8, 200]
        }, localNames);

        // Validate data keys.
        let keysValid = Validator.validateKeyCount(data, 2, "Uploaded Data");

        // Array of all results.
        let resultsArray = [dataValid, typesValid, lengthsValid, keysValid];

        if (Validator.allValid(resultsArray)) {
            return true;
        }
        else {
            return Validator.getErrorMessage(resultsArray);
        }
    }

    _validateUserDeleteData(data) {
        let localNames = {
            username: "Username"
        };

        let dataValid = Validator.validateType(data, Object, "Uploaded Data");

        let typesValid = Validator.validateTypes(data, {
            username: String
        }, localNames);

        let resultsArray = [dataValid, typesValid];

        if (Validator.allValid(resultsArray)) {
            return true;
        }
        else {
            return Validator.getErrorMessage(resultsArray);
        }
    }

    _validateGroupDeleteData(data) {
        let dataValid = Validator.validateType(data, Object);

        let typesValid = Validator.validateTypes(data, {
            name: String
        });

        let resultsArray = [dataValid, typesValid];

        if (Validator.allValid(resultsArray)) {
            return true;
        }
        else {
            return Validator.getErrorMessage(resultsArray);
        }
    }

    // Checks for duplicates across two arrays, where they must also be in inclusionList.
    _checkForDuplicates(arr, inclusionList, exclusionList) {
        let returnMessage = null;

        arr.forEach(element => {
            if (returnMessage) {
                return;
            }

            // Check for inclusion/exclusion.
            if (exclusionList && exclusionList.indexOf(element) !== -1) {
                returnMessage = "You cannot have the same fields in optional and invalid.";
                return;
            }
            else if (inclusionList && inclusionList.indexOf(element) === -1) {
                returnMessage = "You have given an invalid field name.";
                return;
            }

            // Count the number of instances of the element.
            let instances = 0;
            for (let i = 0; i < arr.length; i++) {
                if (element === arr[i]) {
                    instances++;
                }
            }

            // More than one instance = duplicate.
            if (instances > 1) {
                returnMessage = "You cannot have duplicate fields.";
                return;
            }
        });

        return returnMessage || false; // false = no duplicates found.
    }

    // Validates taxonomic group data.
    _validateGroupData(data) {
        // Check for duplicate / repeated fields.
        const OPTIONAL_FIELDS = ["Gender", "Observers", "Number", "Comment", "Status", "Age"];
        const INVALID_FIELDS = ["Gender", "Number", "Observers", "Age"];

        let optionalFields = data.optionalFields;
        let invalidFields = data.invalidFields;
        let statuses = data.statuses;

        let optionalDuplicates = this._checkForDuplicates(optionalFields, OPTIONAL_FIELDS, invalidFields);
        let invalidDuplicates = this._checkForDuplicates(invalidFields, INVALID_FIELDS); // No need to check for repeated fields again.

        if (optionalDuplicates) {
            return optionalDuplicates;
        }
        else if (invalidDuplicates) {
            return invalidDuplicates;
        }

        // Validate the data.
        let nameTypeValid = Validator.validateType(data.name, String, "Group Name");
        let nameLengthValid = Validator.validateLength(data.name, 3, 30, "Group Name");

        let optionalTypesValid = Validator.validateArrayTypes(optionalFields, String, "Optional Field");
        let invalidTypesValid = Validator.validateArrayTypes(invalidFields, String, "Optional Field");

        let statusTypesValid = Validator.validateArrayTypes(statuses, String, "Status");
        let statusLengthsValid = Validator.validateArrayLengths(statuses, 3, 30, "Status");

        let resultsArray = [nameTypeValid, nameLengthValid, optionalTypesValid, invalidTypesValid, statusTypesValid, statusLengthsValid];

        if (Validator.allValid(resultsArray)) {
            return true;
        }
        else {
            return Validator.getErrorMessage(resultsArray);
        }
    }

}
// Export the class.
export default AdminRouter;
