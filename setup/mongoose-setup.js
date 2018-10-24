// Matthew Lester NEA Project - mongoose-setup.js (Mongoose Setup)

// Imports
import mongoose from "mongoose";
import User from "../models/user";
import TaxonomicGroup from "../models/taxonomic-group";
import Species from "../models/species";

// MongooseSetup Class
class MongooseSetup {

    setup() {
        return async function() {

            // The mongoose Promise is deprecated, so use the normal one.
            mongoose.Promise = global.Promise;

            try {
                // Connect to the database.
                await mongoose.connect("mongodb://localhost/wildlife_website_db", { useNewUrlParser: true });
                
                // Wait for necessary models to index.
                await new User().waitForIndex();
                await new TaxonomicGroup().waitForIndex();
                await new Species().waitForIndex();
            }
            catch (err) {
                throw err;
            }
        }();
    }

}

// Export the class.
export default MongooseSetup;
