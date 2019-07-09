// Matthew Lester NEA Project - data-upload.js (DataUpload Model)

// Imports
import logger from "coloured-logger";
import mongoose from "mongoose";
import Location from "./location";
import User from "./user";

// Log
const log = logger({ logName: "Models/DataUpload" });

// Require the BaseModel class.
import BaseModel from "./base-model";

// DataUpload Schema
const DataUploadSchema = {
    species: {
        required: true,
        type: [{
            _id: false,
            id: false,
            latinName: { required: true, type: String },
            commonName: { required: true, type: String },
            count: { required: true, type: Number },
            date: { required: true, type: Date },
            gridReference: { required: true, type: String },
            comments: { required: true, type: String }
        }]
    },
    taxonomicGroup: {
        required: true,
        type: mongoose.Schema.Types.ObjectId,
        ref: "TaxonomicGroup"
    },
    location: {
        required: true,
        type: mongoose.Schema.Types.ObjectId,
        ref: "Location"
    },
    methodology: {
        required: true,
        type: mongoose.Schema.Types.ObjectId,
        ref: "Methodology"
    },
    observers: {
        required: true,
        type: String
    },
    owner: {
        required: true,
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    date: { required: true, type: Date }
};

// Class instance (we only need one) - this makes it a singleton class.
let instance = null;

// Model instances.
let lModel = new Location();

// DataUpload Class (contains DataUpload methods)
class DataUpload extends BaseModel {

    constructor() {
        // Only call the super method if class instance doesn't exist.
        if (!instance) {
            super("DataUpload", DataUploadSchema);
            instance = this;
        }
        else {
            super("DataUpload", DataUploadSchema, true);
            return instance;
        }
    }

    findUploadByID(id) {
        return async function() {
            let foundUpload = await this._model.findById(id);
            return foundUpload;
        }.bind(this)();
    }

    findAllUploads(sortByDate) {
        return async function() {
            let foundUploads;

            if (sortByDate) {
                foundUploads = await this._model.find({}).sort("-date").exec();
            }
            else {
                foundUploads = await this._model.find({});
            }
            
            return foundUploads;
        }.bind(this)();
    }

    findAndPopulateAllUploads() {
        return async function() {
            let foundUploads = await this._model.find({})
                .sort("-date")
                .populate("taxonomicGroup")
                .populate("owner")
                .populate("location")
                .populate("methodology")
                .exec();

            return foundUploads;
        }.bind(this)();
    }

    findAndPopulateAllUploadsForUser(id) {
        return async function() {
            let foundUploads = await this._model.find({ "owner": { $eq: id } }, "-__v") // We need the ID, so they can delete/edit the upload.
                .sort("-date")
                .populate("taxonomicGroup", "-_id -__v")
                .populate("owner", "-_id -__v -salt -hash")
                .populate("location", "-_id -__v")
                .populate("methodology", "-_id -__v -__v")
                .exec();

            return foundUploads;
        }.bind(this)();
    }

    createUpload(data) {
        return async function() {
            try {
                return await this._model.create(data);
            }
            catch (err) {
                log.error(`Failed to create data upload: ${err.message}`);
                return null;
            }
        }.bind(this)();
    }

    findUploadsForSpeciesInDateRange(latinName, fromDate, toDate, locationName) {
        return async function() {
            let foundUploads;

            if (locationName) {
                // Find the location, get the id.
                let location = await lModel.findLocationByName(locationName);
                if (!location)  {
                    return false;
                }

                foundUploads = await this._model.find({ "species.latinName": { $eq: latinName }, "species.date": { $gte: fromDate, $lte: toDate }, location: { $eq: location.id }});
            }
            else {
                foundUploads = await this._model.find({ "species.latinName": { $eq: latinName }, "species.date": { $gte: fromDate, $lte: toDate } });
            }

            return foundUploads || [];
        }.bind(this)();
    }

    removeUploadByID(id) {
        return async function() {
            await this._model.deleteOne({ _id: id });
            return true;
        }.bind(this)();
    }

}

// Export the class.
export default DataUpload;
