// Matthew Lester NEA Project - taxonomic-group.js (Taxonomic Group Model)

// Imports
import mongoose from "mongoose";
import logger from "coloured-logger";
import CustomError from "../lib/custom-error";

// Require the BaseModel class.
import BaseModel from "./base-model";

// Log
const log = logger({ logName: "Models/DataUpload" });

// TaxonomicGroup Schema
const TaxonomicGroupSchema = {
    groupName: { required: true, type: String, unique: true }
};

// Class instance (we only need one) - this makes it a singleton class.
let instance = null;

// TaxonomicGroup Class (contains TaxonomicGroup methods)
class TaxonomicGroup extends BaseModel {

    constructor() {
        // Only call the super method if class instance doesn't exist.
        if (!instance) {
            super("TaxonomicGroup", TaxonomicGroupSchema);
            instance = this;
        }
        else {
            super("TaxonomicGroup", TaxonomicGroupSchema, true);
            return instance;
        }
    }

    findAllGroups() {
        return async function() {
            let foundGroups = this._model.find({});
            return foundGroups;
        }.bind(this)();
    }

    findGroupByName(name) {
        return async function() {
            let foundGroup = await this._model.findOne({ name });
            return foundGroup;
        }.bind(this)();
    }
    
    findGroupByID(id) {
        return async function() {
            let foundGroup = await this._model.findById(id);
            return foundGroup;
        }.bind(this)();
    }

    createGroup(data) {
        return async function() {
            try {
                let createdGroup = await this._model.create(data);
                log.info(`Created a new taxonomic group: ${data.groupName}.`);
                return createdGroup;
            }
            catch (err) {
                log.error(`Failed to create a new taxonomic group: ${err.message}`);
                return false;
            }
        }.bind(this)();
    }

    updateGroup(data) {
        return async function() {
            let updatedGroup = await this._model.findOneAndUpdate({ name: data.name }, data, { new: true });
            return updatedGroup;
        }.bind(this)();
    }

    removeGroupByName(name) {
        return async function() {
            await this._model.remove({ name });
            return;
        }.bind(this)();
    }

}

// Export the class.
export default TaxonomicGroup;
