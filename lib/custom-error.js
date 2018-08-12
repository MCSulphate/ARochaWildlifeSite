// Matthew Lester NEA Project - custom-error.js (Custom Error Class)

// CustomError Class
class CustomError extends Error {

    constructor(message, from, sourceFile) {

        if (message instanceof Error) {
            sourceFile = from;
            from = message;
            message = from.message;
        }

        super(message);

        if (from) {
            this.stack = from.stack;
        }

        // The sourceFile parameter lets me print out where the error originated
        // in my code, if I want to.
        if (sourceFile) {
            this.sourceFile = sourceFile;
        }

    }

    // Custom stack printing.
    printFormattedStack(log) {
        if (!log) {
            return;
        }

        let lines = this.stack.split("\n");
        if (this.sourceFile) {
            lines.splice(1, 0, "Source: " + this.sourceFile);
        }

        lines.forEach(line => log.error(line));
        return true; // This is for testing purposes.
    }

}

// Export the class.
export default CustomError;
