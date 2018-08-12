// Matthew Lester NEA Project - data-review.js (Date Review Routes)

// Imports
import BaseRouter from "./base-router";
import logger from "coloured-logger";
import Middleware from "../lib/middleware";
import User from "../models/user";
import CustomError from "../lib/custom-error";
import Species from "../models/species";
import DataUpload from "../models/data-upload";
import Validator from "../lib/validator";

// Log
let log = logger({ logName: "Routes/DataReview" });

// DataReview Class
class DataReviewRouter extends BaseRouter {

    constructor() {
        super();

        // Models
        let uModel = new User();
        let sModel = new Species();

        // Redirect non-logged-in users to the login page.
        this._router.use(Middleware.redirectTo("/login").ifNotLoggedIn);

        // Main review selection page.
        this._router.get("/main", async(req, res) => {
            try {
                let locationNames = await uModel.getLocationList();
                let species = await sModel.findAllSpecies(true);

                res.render("data-review/main", { locationNames: locationNames, species: species });
            }
            catch (err) {
                new CustomError(err).printFormattedStack(log);
                res.render("data-review/main", { error: err.message });
            }
        });

        // Show page, where all results are shown.
        this._router.get("/show", async(req, res) => {
            let query = req.query;

            if (!Validator.isEmptyObject(query)) {
                // Parse the query data.
                let queryObject = {
                    siteA: query.siteA,
                    siteB: query.siteB,
                    species: query.species ? query.species.split(",").map(s => s.toLowerCase()) : undefined,
                    fromDate: query.fromDate,
                    toDate: query.toDate
                };

                // Get date objects.
                let fromDateObj = new Date(queryObject.fromDate);
                let toDateObj = new Date(queryObject.toDate);

                // Validate the number of species.
                if (!queryObject.species || queryObject.species.length === 0 || queryObject.species.length > 5) {
                    res.status(400).end("400 - Bad Request (invalid species)");
                }
                // Validate the dates.
                else if (fromDateObj == "Invalid Date" || toDateObj == "Invalid Date") {
                    res.status(400).end("400 - Bad Request (invalid dates)");
                }
                else {
                    try {
                        // Generate the data to render on the page.
                        let reviewData = await this._generateReviewData(queryObject);

                        // Render the page with the review data.
                        res.render("data-review/show", { reviewData: reviewData });
                    }
                    catch (err) {
                        // Render the error message.
                        if (err.message === "NS") {
                            res.status(400).end("400 - Bad Request (non-existant species given)");
                        }
                        else {
                            res.render("data-review/show", { error: err.message });
                        }
                    }
                }
            }
            else {
                res.status(400).end("400 - Bad Request (no query received)");
            }
        });

        // No index route, redirect to main.
        this._router.get("/", (req, res) => {
            res.redirect("/review/main");
        });
    }

    _generateReviewData(query) {
        return async function() {
            let returnObject;
            let reviewType = (query.siteA && query.siteB) ? "comparison" : query.siteA ? "single-site" : "overall";

            // Placeholder dates, until I make the actual system.
            let fromDate = new Date(query.fromDate);
            let toDate = new Date(query.toDate);

            if (reviewType === "overall" || reviewType === "single-site") {
                try {
                    // Get the data for the species.
                    let dateCounts = await this._getOverallOrSiteSpeciesData(query.species, fromDate, toDate, query.siteA);

                    returnObject = {
                        reviewType,
                        dateCounts: JSON.stringify(dateCounts),
                        siteA: query.siteA
                    };
                }
                catch (err) {
                    // Throw the error down the stack.
                    throw err;
                }
            }
            else {
                try {
                    // Get the data for both sites.
                    let data = await this._getSiteComparisonSpeciesData(query.species, fromDate, toDate, query.siteA, query.siteB);

                    returnObject = {
                        reviewType,
                        data: {
                            siteAData: JSON.stringify(data.siteAData),
                            siteBData: JSON.stringify(data.siteBData)
                        },
                        siteA: query.siteA,
                        siteB: query.siteB
                    };
                }
                catch (err) {
                    throw err;
                }
            }

            returnObject.fromDate = fromDate.toDateString();
            returnObject.toDate = toDate.toDateString();
            returnObject.species = query.species;
            return returnObject;
        }.bind(this)();
    }

    _getOverallOrSiteSpeciesData(species, fromDate, toDate, locationName) {
        return async function() {
            let dateCounts = {};

            for (let sp of species) {
                try {
                    // Find the species document and the uploads for it.
                    let sDoc = await new Species().findSpeciesByName(sp);
                    // Check that the species actually exists.
                    if (!sDoc) {
                        throw new Error("NS");
                    }
                    
                    dateCounts[sp] = {};
                    let relatedUploads = await new DataUpload().findUploadsForSpeciesInDateRange(sDoc._id, fromDate, toDate, locationName);

                    // Nested loops that count the number of each species found by date.
                    relatedUploads.forEach(upload => {
                        let uploadSpecies = upload.species;

                        uploadSpecies.forEach(us => {
                            // Check if the ids are equal.
                            if (sDoc._id.equals(us.species)) {
                                let count = us.number;
                                let dateString = us.date.toDateString();

                                if (dateCounts[sp][dateString]) {
                                    dateCounts[sp][dateString] += count;
                                }
                                else {
                                    dateCounts[sp][dateString] = count;
                                }
                            }
                        });

                    });
                }
                catch (err) {
                    // Print the stack and throw the error (if it is not a 'NS' error).
                    if (err.message !== "NS") {
                        new CustomError(err).printFormattedStack(log);
                    }
                    throw err;
                }
            }

            return dateCounts;
        }.bind(this)();
    }

    _getSiteComparisonSpeciesData(species, fromDate, toDate, siteA, siteB) {
        return async function() {
            try {
                let siteAData = await this._getOverallOrSiteSpeciesData(species, fromDate, toDate, siteA);
                let siteBData = await this._getOverallOrSiteSpeciesData(species, fromDate, toDate, siteB);

                return {
                    siteAData,
                    siteBData
                };
            }
            catch (err) {
                throw err;
            }
        }.bind(this)();
    }
}

// Export the class.
export default DataReviewRouter;
