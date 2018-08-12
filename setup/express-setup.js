// Matthew Lester NEA Project - express-setup.js (Express.js Setup)

// Imports
import express from "express";
import session from "express-session";
import passport from "passport";
import path from "path";
import Middleware from "../lib/middleware";

// ExpressSetup Class
class ExpressSetup {
    
    setup() {
        
        const app = express();
        
        // Set the view engine, this renders templates for viewing.
        app.set("view engine", "ejs");
        
        // body-parser parses JSON/URL-Encoded Data into usable JavaScript objects.
        app.use(express.json());
        app.use(express.urlencoded({ extended: false }));
        
        // Setup sessions with express-session.
        app.use(session({
            secret: "nJzA{^JPgt1LJ[[Dz#0K:@$arBR$WC,jzYH5/_c8-|L4ikx>H-rC,!sfeQf~#o",
            resave: false,
            saveUninitialized: false
        }));
        
        // Set up passport Middleware.
        app.use(passport.initialize());
        app.use(passport.session());
        
        // Internal Middleware.
        app.use(Middleware.locals);
        app.use(Middleware.restrictAdminAccess);
        
        // Serve the /public/ directory as static content.
        app.use(express.static(path.join(__dirname, "..", "public")));
        
        // Return the express instance for use in other setup methods.
        return app;
        
    }
    
}

// Export the class.
export default ExpressSetup;