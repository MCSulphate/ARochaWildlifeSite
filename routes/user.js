// Matthew Lester NEA Project - user.js (User Router)

// Imports
import BaseRouter from "./base-router";
import Middleware from "../lib/middleware";
import Utils from "../lib/utils";
import Validator from "../lib/validator";
import CustomError from "../lib/custom-error";
import User from "../models/user";
import DataUpload from "../models/data-upload";
import logger from "coloured-logger";

// UserRouter Class
class UserRouter extends BaseRouter {

    constructor() {
        super();

        // Log
        let log = logger({ logName: "Routes/User" });

        // Profile Page
        this._router.get("/profile", Middleware.redirectTo("/login").ifNotLoggedIn, (req, res) => {
            res.render("user/profile");
        });

        // Handles password changing.
        this._router.post("/profile", Middleware.redirectTo("/login").ifNotLoggedIn, async(req, res) => {
            // Data
            let userToUpdate = req.body;
            userToUpdate.username = req.user.username;
            
            try {
                let user = new User();
                let oldPasswordValid = await user.changeUserPassword(userToUpdate, false);
                    
                if (!oldPasswordValid) {
                    return Utils.sendJSONResponse(res, "Invalid password, please try again.");
                }
                    
                // Send a success response.
                log.info("Changed a user's password: " + req.user.username);
                Utils.sendJSONResponse(res, {});
            }
            catch (err) {
                new CustomError(err).printFormattedStack(log);
                Utils.sendJSONResponse(res);
            }
        });

        // Handles fetching of data uploads for a user.
        this._router.post("/data-uploads", Middleware.redirectTo("/login").ifNotLoggedIn, async(req, res) => {
            let id = req.user.id;
            let uploads;

            try {
                uploads = await new DataUpload().findAndPopulateAllUploadsForUser(id);
            }
            catch (err) {
                log.error("Error fetching data uploads for user " + req.user.username + ": " + err.message);
                Utils.sendJSONResponse(res);
                return;
            }

            // Send the uploads back to the client.
            let body = {
                uploads
            };

            Utils.sendJSONResponse(res, body);
        });

        // There is no index route, so redirect to their profile.
        this._router.get("/", (req, res) => res.redirect("/user/profile"));
    }

    _validateFormData(data) {
        // Local names (for better error messages).
        let localNames = {
            username: "Username",
            oldPassword: "Old Password",
            newPassword: "New Password"
        };
        
        let dataValid = Validator.validateType(data, Object, "Uploaded Data");
        
        let typesValid = Validator.validateTypes(data, {
            username: String,
            oldPassword: String,
            newPassword: String
        }, localNames);

        let lengthsValid = Validator.validateLengths(data, {
            username: [3, 20],
            oldPassword: [8, 200],
            newPassword: [8, 200]
        }, localNames);

        let resultsArray = [dataValid, typesValid, lengthsValid];

        if (Validator.allValid(resultsArray)) {
            return true;
        }
        else {
            return Validator.getErrorMessage(resultsArray);
        }
    }

}

// Export the class.
export default UserRouter;
