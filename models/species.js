// Matthew Lester NEA Project - species.js (Species Model)

// Imports
import logger from "coloured-logger";
import mongoose from "mongoose";
import TaxonomicGroup from "./taxonomic-group";
import User from "./user";
import CustomError from "../lib/custom-error";

// Log
const log = logger({ logName: "Models/Species" });

// Require the BaseModel class.
import BaseModel from "./base-model";

// Species Schema
const SpeciesSchema = {
    name: { required: true, type: String, unique: true },
    taxonomicGroup: { 
        required: true, 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "TaxonomicGroup"
    },
    count: { required: true, type: Number },
    seenBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    firstSeen: { required: true, type: Date },
    lastSeen: { required: true, type: Date }
};

// Class instance (we only need one) - this makes it a singleton class.
let instance = null;

// Species Class (contains Species methods)
class Species extends BaseModel {
    
    constructor() {
        // Only call the super method if class instance doesn't exist.
        if (!instance) {
            super("Species", SpeciesSchema);
            instance = this;
        } else {
            super("Species", SpeciesSchema, true);
            return instance;
        }
    }
    
    findAllSpecies(shouldPopulate) {
        return async function() {
            let foundSpecies;
            
            if (shouldPopulate) {
                foundSpecies = this._model.find({}).populate("taxonomicGroup").populate("seenBy").exec();
            }
            else {
                foundSpecies = this._model.find({});
            }
            
            return foundSpecies;
        }.bind(this)();
    }
    
    findSpeciesByID(id) {
        return async function() {
            let foundSpecies = await this._model.findById(id);
            return foundSpecies;
        }.bind(this)();
    }
    
    findSpeciesByName(name) {
        return async function() {
            let foundSpecies = await this._model.findOne({ name });
            return foundSpecies;
        }.bind(this)();
    }
    
    createSpecies(data) {
        return async function() {
            let createdSpecies = await this._model.create(data);
            return createdSpecies;
        }.bind(this)();
    }
    
    updateSpecies(data) {
        return async function() {
            let updatedSpecies = await this._model.findOneAndUpdate({ name: data.name }, data, { new: true });
            return updatedSpecies;
        }.bind(this)();
    }
    
    removeSpeciesByID(id) {
        return async function() {
            await this._model.remove({ _id: id });
            return true;
        }.bind(this)();
    }
    
}

// Export the class.
export default Species;