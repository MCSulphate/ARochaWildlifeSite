// Matthew Lester NEA Project - utils.js (General Utility Functions)

// Imports
import logger from "coloured-logger";
// Log
let log = logger({ fileName: "Lib/Utils" });

// Utils Class
class Utils {

    // Prints a blank line to the console.
    static newLine(lines) {
        lines = lines ? lines - 1 : 0;
        let toPrint = "";

        for (let i = 0; i < lines; i++) {
            toPrint = toPrint + "\n";
        }

        console.log(toPrint);
    }

    // Sends a JSON response to a request.
    static sendJSONResponse(response, data) {
        // If data is a string, it is an error message.
        if (Object(data) instanceof String) {
            data = {
                error: data,
                success: false
            };
        }
        // If there is no data, return a generic error message.
        else if (!data) {
            data = {
                error: "There was an error processing your request, please try again later.",
                success: false
            };
        }
        else {
            data.error = null;
            data.success = true;
        }

        response.setHeader("Content-Type", "application/json");
        response.send(JSON.stringify(data));
    }

}

// Export the class.
export default Utils;
