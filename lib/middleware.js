// Matthew Lester NEA Project - middleware.js (Middleware Class)

// Imports
import http from "http";
import CustomError from "./custom-error";
import logger from "coloured-logger";

// Middleware Class
class Middleware {

    constructor() {
        throw new CustomError("Middleware cannot be instantiated.");
    }

    // Sets locals (data that is accessible from all routes).
    static locals(req, res, next) {
        res.locals.user = req.user;
        res.locals.error = null; // Set the error to null, so it doesn't have to be passed to routes with no error.
        next();
    }

    // Redirects to a given path if the user is/isn't logged in.
    static redirectTo(path) {
        function loggedIn(isLoggedIn) {
            return function(req, res, next) {
                if (req.isAuthenticated() === isLoggedIn) {
                    res.redirect(path);
                }
                else {
                    next();
                }
            };
        }

        return {
            ifLoggedIn: loggedIn(true),
            ifNotLoggedIn: loggedIn(false),

            ifNotAdmin: function(req, res, next) {
                if (!req.user || req.user.username !== "admin") {
                    res.redirect(path);
                }
                else {
                    next();
                }
            }
        };
    }

    // Restricts access to /admin/*.* for non-admin users.
    static restrictAdminAccess(req, res, next) {
        // This is a regular expression that checks if the path contains /admin/, and restricts access.
        let result = req.url.match(/.+\/admin\/.+/);
        if (result) {
            if (!req.isAuthenticated() || req.user.username !== "admin") {
                return res.status(403).end("403 - Forbidden (you do not have access to this)");
            }
        }
        next();
    }

}

// Export the class.
export default Middleware;
