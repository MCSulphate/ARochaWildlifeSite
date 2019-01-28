// Imports
import logger from "coloured-logger";

// Log
const log = logger({ logName: "Models/Methodology" });

// Require the BaseModel class.
import BaseModel from "./base-model";

// Methodology Schema
const MethodologySchema = {
    methodologyName: { required: true, type: String, unique: true }
};

// Class instance (we only need one) - this makes it a singleton class.
let instance = null;

// Methodology Class
class Methodology extends BaseModel {

    constructor() {
        // Only call the super method if class instance doesn't exist.
        if (!instance) {
            super("Methodology", MethodologySchema);
            instance = this;
        }
        else {
            super("Methodology", MethodologySchema, true);
            return instance;
        }
    }

    findAllMethodologies() {
        return async function() {
            let methodologies = [];
            let dbData = await this._model.find({});
            
            for (let methodology of dbData) {
                if (methodology.methodologyName) {
                    methodologies.push(methodology.methodologyName);
                }
            }
            
            return methodologies;
        }.bind(this)();
    }

    findMethodologyID(methodologyName) {
        return async function() {
            let foundMethodology = await this._model.findOne({ methodologyName });

            if (foundMethodology) {
                return foundMethodology._id;
            }
            else {
                throw new Error(`The methodology ${methodologyName} could not be found.`);
            }
        }.bind(this)();
    }

    findMethodologyByID(id) {
        return async function() {
            let foundMethodology = await this._model.findById(id);

            if (foundMethodology) {
                return foundMethodology;
            }
            else {
                log.error("Failed to find methodology by id.");
            }
        }.bind(this)();
    }

    findMethodologyByName(methodologyName) {
        return async function() {
            let foundMethodology = await this._model.findOne({ methodologyName });

            if (foundMethodology) {
                return foundMethodology;
            }
            else {
                log.error("Failed to find a methodology by name.");
                return false;
            }
        }.bind(this)();
    }

    addNewMethodology(data) {
        return async function() {
            try {
                let createdMethodology = await this._model.create(data);
                log.info(`Created a new methodology: ${data.methodologyName}`);
                return createdMethodology;
            }
            catch (err) {
                log.error(`Failed to create a new methodology: ${err.message}`);
                return false;
            }
        }.bind(this)();
    }

}

// Export the class.
export default Methodology;
