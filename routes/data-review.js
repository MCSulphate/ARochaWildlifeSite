// Matthew Lester NEA Project - data-review.js (Date Review Routes)

// Imports
import BaseRouter from "./base-router";
import logger from "coloured-logger";
import Middleware from "../lib/middleware";
import DataUpload from "../models/data-upload";
import TaxonomicGroup from "../models/taxonomic-group";
import Location from "../models/location";
import Utils from "../lib/utils";

// Log
let log = logger({ logName: "Routes/DataReview" });

// DataReview Class
class DataReviewRouter extends BaseRouter {

    constructor() {
        super();

        // Models
        let dUpload = new DataUpload();
        let tGroup = new TaxonomicGroup();
        let lModel = new Location();

        // Redirect non-logged-in users to the login page.
        this._router.use(Middleware.redirectTo("/login").ifNotLoggedIn);

        // Main review selection page.
        this._router.get("/main", async(req, res) => {
            res.render("data-review/main");
        });

        // Finds and returns location data.
        this._router.post("/locations-data", async(req, res) => {
            try {
                // Get the locations.
                let locations = await lModel.findAllLocations();

                // Send them down the pipe!
                Utils.sendJSONResponse(res, { locations });
            }
            catch (err) {
                log.error(`Failed to find locations: ${err.message}`);
                Utils.sendJSONResponse(res);
            }
        });

        // Finds and returns species data.
        this._router.post("/species-data", async(req, res) => {
            // Get all the data uploads.
            let uploads = await dUpload.findAllUploads();

            // Object to store parsed species data in.
            let parsedSpeciesData = {};

            // Loop through the uploads, taking each species, lower-casing, and adding count values.
            try {
                for (let upload of uploads) {
                    let taxonomicGroup = await tGroup.findGroupByID(upload.taxonomicGroup);
                    let location = await lModel.findLocationByID(upload.location);
                    let observers = upload.observers;
                    let uploadSpecies = upload.species;

                    for (let species of uploadSpecies) {
                        let latinName = species.latinName;
                        let commonName = species.commonName;
                        let count = species.count;
                        let gridReference = species.gridReference;
                        let comments = species.comments;

                        // Check if the species has been added to the intermediate yet.
                        if (!parsedSpeciesData[latinName]) {
                            // Add it, setting all the different values.
                            let data = parsedSpeciesData[latinName] = {};
                            data.taxonomicGroup = taxonomicGroup.groupName;
                            data.latinName = latinName;
                            data.commonName = commonName;
                            data.count = count;
                            data.gridReferences = [gridReference];
                            data.comments = [comments];
                            data.observers = [observers];
                            data.locations = [location.locationName];
                        }
                        else {
                            // Otherwise update the current one.
                            let data = parsedSpeciesData[latinName];
                            
                            // If no valid common name has been found yet, update it.
                            if (data.commonName === "Not Given") {
                                data.commonName = commonName;
                            }

                            data.count += count;
                            
                            // Avoid duplicates.
                            if (data.gridReferences.indexOf(gridReference) === -1) {
                                data.gridReferences.push(gridReference);
                            }
                            if (data.comments.indexOf(comments) === -1) {
                                data.comments.push(comments);
                            }
                            if (data.observers.indexOf(observers) === -1) {
                                data.observers.push(observers);
                            }
                            if (data.locations.indexOf(location.locationName) === -1) {
                                data.locations.push(location.locationName);
                            }
                        }
                    }
                }
            }
            catch (err) {
                log.error(`Failed to construct species data: ${err.message}`);
                Utils.sendJSONResponse(res);
                return;
            }

            let data = {
                species: parsedSpeciesData
            };

            Utils.sendJSONResponse(res, data);
        });

        // Finds and returns detailed species data for chart creation.
        this._router.post("/detailed-species-data", async(req, res) => {
            let body = req.body;
            // Time at the start of today.
            let currentTime = new Date(new Date().toDateString()).getTime();

            let latinNames = body.latinNames;
            let locationNames = body.locationNames;
            // If there is no from date, set it to a year ago.
            let fromDate = body.fromDate ? new Date(body.fromDate) : new Date(currentTime - (1000 * 60 * 60 * 24 * 365));
            // If there is no to date, set it to today.
            let toDate = body.toDate ? new Date(body.toDate) : new Date();

            // Loop through locations, then species.
            let queryError = false;
            let speciesData = {};
            if (locationNames.length > 0) {
                for (let location of locationNames) {
                    speciesData[location] = {};

                    for (let latinName of latinNames) {

                        let results = await dUpload.findUploadsForSpeciesInDateRange(latinName, fromDate, toDate, location);
                        if (!results) {
                            log.error(`Failed to find location ${locationName}.`);
                        }
                        else {
                            if (!speciesData[location][latinName]) speciesData[location][latinName] = {};
                            if (results.length === 0) continue;
                            
                            for (let upload of results) {
                                let species = upload.species;
                                let singleData;

                                // Find the species' data within the upload.
                                for (let speciesItem of species) {
                                    if (speciesItem.latinName === latinName) singleData = speciesItem;
                                }

                                // Grab the count and date of the recording.
                                let count = singleData.count;
                                let date = singleData.date.toDateString();

                                // Update the count at that date for this species and location.
                                if (!speciesData[location][latinName][date]) {
                                    speciesData[location][latinName][date] = count;
                                }
                                else {
                                    speciesData[location][latinName][date] += count;
                                }
                            }
                        }
                    }
                }
            }
            else {
                for (let latinName of latinNames) {

                    let results = await dUpload.findUploadsForSpeciesInDateRange(latinName, fromDate, toDate);
                        
                    if (!speciesData[latinName]) speciesData[latinName] = {};
                    if (results.length === 0) continue;
                        
                    for (let upload of results) {
                        let species = upload.species;
                        let singleData;

                        // Find the species' data within the upload.
                        for (let speciesItem of species) {
                            if (speciesItem.latinName === latinName) singleData = speciesItem;
                        }

                        // Grab the count and date of the recording.
                        let count = singleData.count;
                        let date = singleData.date.toDateString();

                        // Update the count at that date for this species and location.
                        if (!speciesData[latinName][date]) {
                            speciesData[latinName][date] = count;
                        }
                        else {
                            speciesData[latinName][date] += count;
                        }
                    }
                }
            }

            Utils.sendJSONResponse(res, { speciesData });
        });

        // No index route, redirect to main.
        this._router.get("/", (req, res) => {
            res.redirect("/review/main");
        });
    }
}

// Export the class.
export default DataReviewRouter;
