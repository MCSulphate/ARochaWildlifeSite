// Imports
import logger from "coloured-logger";
import mongoose from "mongoose";

// Log
const log = logger({ logName: "Models/Location" });

// Require the BaseModel class.
import BaseModel from "./base-model";

// Location Schema
const LocationSchema = {
    locationName: { required: true, type: String, unique: true }
};

// Class instance (we only need one) - this makes it a singleton class.
let instance = null;

// Location Class
class Location extends BaseModel {

    constructor() {
        // Only call the super method if class instance doesn't exist.
        if (!instance) {
            super("Location", LocationSchema);
            instance = this;
        }
        else {
            super("Location", LocationSchema, true);
            return instance;
        }
    }

    findAllLocations() {
        return async function() {
            let locations = [];
            let dbData = await this._model.find({});
            
            for (let location of dbData) {
                if (location.locationName) {
                    locations.push(location.locationName);
                }
            }
            
            return locations;
        }.bind(this)();
    }

    addNewLocation(data) {
        return async function() {
            try {
                let createdLocation = await this._model.create(data);
                log.info(`Created a new location: ${data.locationName}`);
                return createdLocation;
            }
            catch (err) {
                log.error(`Failed to create a new location: ${err.message}`);
                return false;
            }
        }.bind(this)();
    }

}

// Export the class.
export default Location;
