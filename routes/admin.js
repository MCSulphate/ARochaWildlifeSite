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
