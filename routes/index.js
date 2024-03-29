// Matthew Lester NEA Project - index.js (Index Router)

// Imports
import logger from "coloured-logger";
import BaseRouter from "./base-router";
import Middleware from "../lib/middleware";
import passport from "passport";
import Utils from "../lib/utils";

// IndexRouter Class
class IndexRouter extends BaseRouter {

    constructor() {
        super();

        // Log
        const log = logger({ logName: "Routes/Index" });

        // Landing Page
        this._router.get("/", (req, res) => {
            res.render("index/index");
        });

        // Login Routes
        this._router.get("/login", Middleware.redirectTo("/user/profile").ifLoggedIn, (req, res) => {
            res.render("index/login");
        });

        this._router.post("/login", Middleware.redirectTo("/user/profile").ifLoggedIn, (req, res) => {
            
            passport.authenticate("local", (err, user, info) => {
                if (err) {
                    log.error("Error authenticating a user: " + err.message);
                    Utils.sendJSONResponse(res);
                }
                else if (!user) {
                    // No need to log this, they just had wrong username/password combo.
                    Utils.sendJSONResponse(res, "Incorrect username or password.");
                }
                else {

                    req.logIn(user, err => {
                        if (err) {
                            log.error("Error logging a user in: " + err.message);
                            Utils.sendJSONResponse(res);
                        }
                        else {
                            log.info(`${user.username} has logged in.`);
                            Utils.sendJSONResponse(res, {});
                        }
                    });

                }

            })(req, res);

        });

        // Logout Route
        this._router.get("/logout", Middleware.redirectTo("/").ifNotLoggedIn, (req, res) => {
            req.logout();
            res.redirect("/");
        });

        // Catch-All (404 - Not Found)
        this._router.all("*", (req, res) => {
            res.status(404).end("404 - Not Found (this page or resource could not be found on the server)");
        });

    }

}

// Export the class.
export default IndexRouter;
