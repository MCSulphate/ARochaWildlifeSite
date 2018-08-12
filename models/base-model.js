// Matthew Lester NEA Project - base-model.js (Base Model Class)

// Imports
import logger from "coloured-logger";
import mongoose from "mongoose";
import CustomError from "../lib/custom-error";

// Important Note:
// BaseModel should NOT be a singleton class, as multiple instances are needed (1 for each model).

// BaseModel Class
class BaseModel {

    // Constructor, creates the schema from a given object.
    constructor(modelName, schema, shouldNotModel) {
        // Log
        const log = logger({ logName: "Models/BaseModel" });
        
        if (!schema) {
            throw new CustomError("No schema was defined in the constructor.", null, "Model/BaseModel");
        }
        else if (!modelName) {
            throw new CustomError("No model name was defined in the constructor.", null, "Model/BaseModel");
        }

        this._modelName = modelName;
        this._schema = new mongoose.Schema(schema);

        if (!shouldNotModel) {
            // Load the model.
            this._loadModel();
            this.isIndexed = false;

            // Wait for the model to be indexed.
            this._model.once("index", (err) => {

                if (err) {
                    // This is internal to the constructor, so no ModelError object is needed.
                    log.error("Error indexing model " + this._modelName + ": " + err.message);
                }
                else {
                    this.isIndexed = true;
                }

            });
        }
    }

    // Pseudo-private function that models the schema given in the constructor.
    _loadModel() {
        if (this._model) {
            return; // Don't model again if already modelled.
        }
        else {
            // Try to model it...
            try {
                this._model = mongoose.model(this._modelName, this._schema);
            }
            catch (err) {
                // If there is an error, then it has already been modelled.
                this._model = mongoose.model(this._modelName);
            }
        }
    }

    // Returns a Promise that waits for the model to be indexed.
    waitForIndex() {
        return new Promise((resolve, reject) => {
            if (this.isIndexed) {
                resolve();
            }
            else {
                this._model.on("index", (err) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve();
                    }
                });
            }
        });
    }

    // Runs a function when the model has been indexed, and returns the result.
    runOnIndex(func, args) {
        return async function() {
            await this.waitForIndex();
            return await func.apply(null, args);
        }.bind(this)();
    }
    
    //
    // UTILITY METHODS
    //
    
    // Removes all of this model.
    removeAll() {
        return async function() {
            await this._model.remove({});
            return;
        }.bind(this)();
    }

}

// Export the class.
export default BaseModel;
