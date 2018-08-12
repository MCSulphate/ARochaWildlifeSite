// Matthew Lester NEA Project - main-setup.js (Main Setup)

// Imports
import logger from "coloured-logger";
import DatabaseSeeder from "../lib/database-seeder";
import CustomError from "../lib/custom-error";

// Setup Imports
import MongooseSetup from "./mongoose-setup";
import ExpressSetup from "./express-setup";
import PassportSetup from "./passport-setup";
import RoutesSetup from "./routes-setup";
import ServerSetup from "./server-setup";

// Initialise Setup Imports
const mongooseSetup = new MongooseSetup();
const expressSetup = new ExpressSetup();
const passportSetup = new PassportSetup();
const routesSetup = new RoutesSetup();
const serverSetup = new ServerSetup();

// MainSetup Class
class MainSetup {

    setup() {
        return async function() {

            // Log
            let log = logger({ logName: "Application" });

            // Log warnings to the console.
            process.on("warning", err => {
                new CustomError(err).printFormattedStack(log);
            });

            // Log errors to the console.
            process.on("error", err => {
                new CustomError(err).printFormattedStack(log);
            });

            // Set Up Database
            try {
                await mongooseSetup.setup();
            }
            catch (err) {
                log.error("Error setting up mongoose: " + err.message);
                process.exit(1);
            }

            // If the first command line argument is "true", seed the database.
            if (process.argv[2] === "true") {
                try {
                    await DatabaseSeeder.seedDatabase();
                    log.info("Successfully reset and seeded the database.");
                }
                catch (err) {
                    log.warn("Error seeding database: " + err.message);
                }
            }

            // Set Up Express
            const app = expressSetup.setup();

            // Set Up Passport
            passportSetup.setup();

            // Set Up Routes
            routesSetup.setup(app);

            // Set Up Server
            try {
                await serverSetup.setup(app);
            }
            catch (err) {
                log.error("Error setting up the server: " + err.message);
                process.exit(1);
            }

            // Setup finished!
            log.info("Application setup finished, server has been started.");

        }();
    }

}

// Export the class.
export default MainSetup;
