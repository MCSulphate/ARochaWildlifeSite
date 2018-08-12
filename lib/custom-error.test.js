// Matthew Lester NEA Project - custom-error.test.js (Custom Error Tests)

// Imports
import logger from "coloured-logger";

// Log
let log = logger({ logName: "Lib/CustomErrorTests" });

// File Being Tested
import CustomError from "./custom-error";

test("can successfully throw a CustomError", () => {
    let throwError = () => { throw new CustomError(); };
    expect(throwError).toThrow(CustomError);
});

test("can print a formatted stack trace", () => {
    let error = new CustomError("Test Error!");
    expect(error.printFormattedStack(log)).toBe(true);
});

test("can print a formatted stack trace with a sourceFile", () => {
    let error = new CustomError("Test Error Mk.2!", null, "someFile.js");
    expect(error.printFormattedStack(log)).toBe(true);
});