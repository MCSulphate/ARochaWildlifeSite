// Matthew Lester NEA Project - seed-database.js (Database Seeding)

// Imports
import logger from "coloured-logger";
import User from "../models/user";
import DataUpload from "../models/data-upload";
import Species from "../models/species";
import TaxonomicGroup from "../models/taxonomic-group";
import Location from "../models/location";

// DatabaseSeeder Class
class DatabaseSeeder {

    constructor() {
        throw new Error("DatabaseSeeder cannot be instantiated.");
    }

    static seedDatabase() {
        return async function() {
            // Create instances of all of the models.
            let user = new User();
            let dUpload = new DataUpload();
            let species = new Species();
            let tGroup = new TaxonomicGroup();
            let location = new Location();
            
            // Remove all of each of the groups.
            await user.removeAll();
            await dUpload.removeAll();
            await species.removeAll();
            await tGroup.removeAll();
            await location.removeAll();
            
            // Register the admin user with a default password.
            await user.registerUser({
                username: "admin",
                password: "password"
            });
            
            return;
        }();
    }

}

// Export the class.
export default DatabaseSeeder;
