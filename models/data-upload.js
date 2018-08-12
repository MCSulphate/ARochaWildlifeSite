// Matthew Lester NEA Project - data-upload.js (DataUpload Model)

// Imports
import logger from "coloured-logger";
import mongoose from "mongoose";

// Log
const log = logger({ logName: "Models/DataUpload" });

// Require the BaseModel class.
import BaseModel from "./base-model";

// DataUpload Schema
const DataUploadSchema = {
    species: {
        required: true,
        type: [{
            species: {
                required: true,
                type: mongoose.Schema.Types.ObjectId,
                ref: "Species"
            },
            number: { required: true, type: Number },
            gender: { type: String, default: null },
            age: { type: String, default: null },
            status: { type: String, default: null },
            date: { required: true, type: Date },
            observers: { type: [String], default: [] },
            comment: { type: String, default: null }
        }]
    },
    taxonomicGroup: {
        required: true,
        type: mongoose.Schema.Types.ObjectId,
        ref: "TaxonomicGroup"
    },
    location: { required: true, type: String },
    owner: {
        required: true,
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    date: { required: true, type: Date }
};

// Class instance (we only need one) - this makes it a singleton class.
let instance = null;

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

    findAllUploads() {
        return async function() {
            let foundUploads = await this._model.find({}).sort("-date").exec();
            return foundUploads;
        }.bind(this)();
    }

    findAndPopulateAllUploads() {
        return async function() {
            let foundUploads = await this._model.find({})
                .sort("-date")
                .populate("taxonomicGroup")
                .populate("owner")
                // Populate the nested array of species data.
                .populate("species.species")
                .exec();
            return foundUploads;
        }.bind(this)();
    }

    createUpload(data) {
        return async function() {
            let createdUpload = await this._model.create(data);
            return createdUpload;
        }.bind(this)();
    }

    findUploadsForSpeciesInDateRange(id, fromDate, toDate, locationName) {
        return async function() {
            let foundUploads;

            if (locationName) {
                foundUploads = await this._model.find({ "species.species": { $eq: id }, "species.date": { $gte: fromDate, $lte: toDate }, location: locationName });
            }
            else {
                foundUploads = await this._model.find({ "species.species": { $eq: id }, "species.date": { $gte: fromDate, $lte: toDate } });
            }

            return foundUploads;
        }.bind(this)();
    }

    findDateOrderedUploadsForSpecies(id) {
        return async function() {
            let foundUploads = await this._model.find({ "species.species": { $eq: id } }).sort("-date").exec();
            return foundUploads;
        }.bind(this)();
    }

    // These two functions are slightly different than expected - used to find the NEXT first seen/last seen.
    // This is because it is used when an upload is being deleted - but still exists, and will show up if queried.
    findWhenSpeciesFirstSeen(id) {
        return async function() {
            let uploads = await this.findDateOrderedUploadsForSpecies(id);

            // Ensure that there are actually more uploads for this species.
            if (uploads.length > 1) {
                return uploads[1].date;
            }
            else {
                return {};
            }
        }.bind(this)();
    }

    findWhenSpeciesLastSeen(id) {
        return async function() {
            let uploads = await this.findDateOrderedUploadsForSpecies(id);

            if (uploads.length > 1) {
                return uploads[uploads.length - 2].date;
            }
            else {
                return {};
            }
        }.bind(this)();
    }

    removeUploadByID(id) {
        return async function() {
            await this._model.remove({ _id: id });
            return true;
        }.bind(this)();
    }

}

// Export the class.
export default DataUpload;
