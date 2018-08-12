// Matthew Lester NEA Project - app.js (Application Entry Point)

// Require the Babel polyfill (very important).
import "babel-polyfill";

// Import the main setup class, instantiate it and set up the application.
import MainSetup from "./setup/main-setup";
new MainSetup().setup();