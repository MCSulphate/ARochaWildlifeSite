// Matthew Lester NEA Project - passport-setup.js (Passport Setup)

// Imports
import User from "../models/user";
import LocalStrategy from "passport-local";
import passport from "passport";

// PassportSetup Class
class PassportSetup {
    
    setup() {
        
        let user = new User();
        passport.use(new LocalStrategy(user.authenticateUser.bind(user)));
        passport.serializeUser(user.serialiseUser);
        passport.deserializeUser(user.deserialiseUser.bind(user));
        
    }
    
}

// Export the class.
export default PassportSetup;