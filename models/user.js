// Matthew Lester NEA Project - user.js (User Model)

// Imports
import mongoose from "mongoose";
import crypto from "crypto";
import CustomError from "../lib/custom-error";
import logger from "coloured-logger";

// Require the BaseModel class.
import BaseModel from "./base-model";

// Log
let log = logger({ logName: "Models/User" });

// User Schema
const UserSchema = {
    // Identifiable Data
    username: { required: true, type: String, unique: true },

    // Password-Related Data
    hash: { required: true, type: String },
    salt: { required: true, type: String }
};

// Class instance (we only need one) - this makes it a singleton class.
let instance = null;

// User Class (contains User methods)
class User extends BaseModel {

    constructor() {
        // Only call the super method if class instance doesn't exist.
        if (!instance) {
            super("User", UserSchema);
            instance = this;
        }
        else {
            super("User", UserSchema, true);
            return instance;
        }
    }

    //// Psuedo Private Methods ////
    // Function to generate a random hex string of a given length.
    _generateRandomHexString(length) {
        let halfLength = Math.ceil(length / 2);
        let randomString = crypto.randomBytes(halfLength).toString("hex");

        return randomString.slice(0, length);
    }

    // Function to hash a password with a salt.
    _hashPassword(password, salt) {
        // Create a HMAC with the salt, update it with the password, digest to the hash.
        let hmac = crypto.createHmac("sha512", salt);
        hmac.update(password);
        let hash = hmac.digest("hex");

        // Return the hash.
        return hash;
    }

    // Function to verify a password matches a salted hash.
    _verifyPassword(password, salt, hash) {
        let hashToTest = this._hashPassword(password, salt);
        return (hashToTest === hash);
    }

    //// Utility Methods ////
    // Finds all users.
    findAllUsers() {
        return async function() {
            let foundUsers = await this._model.find({});
            return foundUsers;
        }.bind(this)();
    }
    
    // Gets a list of location names.
    getLocationList() {
        return async function() {
            let locationNames = await this._model.find({}, 'locationName -_id');
            let filteredNames = [];
            
            // Take out duplicate location names, and the N/A one for the admin.
            locationNames.forEach(user => filteredNames.indexOf(user.locationName) === -1 ? filteredNames.push(user.locationName) : undefined);
            //filteredNames.splice(filteredNames.indexOf("N/A"), 1); UNCOMMENT TO REMOVE ADMIN ACCOUNT
            return filteredNames;
        }.bind(this)();
    }

    // Finds a user by username.
    findUserByUsername(username) {
        return async function() {
            let foundUser = await this._model.findOne({ username });
            return foundUser;
        }.bind(this)();
    }

    // Finds a user by id.
    findUserById(id) {
        return async function() {
            let foundUser = await this._model.findOne({ _id: id });
            return foundUser;
        }.bind(this)();
    }
    
    // Finds users by locationName.
    findUsersByLocation(locationName) {
        return async function() {
            let foundUsers = await this._model.find({ locationName });
            return foundUsers;
        }.bind(this)();
    }

    // Updates a user by username.
    updateUser(data) {
        return async function() {
            let updatedUser = await this._model.findOneAndUpdate({ username: data.username }, data, { new: true });
            return updatedUser;
        }.bind(this)();
    }

    // Changes a user's password (verifies it first).
    changeUserPassword(data, force) {
        let username = data.username;
        let oldPassword = data.oldPassword;
        let newPassword = force ? data.password : data.newPassword;

        return async function() {
            // Find the user.
            let user = await this.findUserByUsername(username);
            if (!user) {
                return false;
            }

            // Verify the old password (preventing unauthorised password changing)
            let oldPasswordValid = force || this._verifyPassword(oldPassword, user.salt, user.hash);
            if (!oldPasswordValid) {
                return false;
            }

            // Generate a new salt and hash.
            let newSalt = this._generateRandomHexString(32);
            let newHash = this._hashPassword(newPassword, newSalt);

            let updateObject = {
                username: username,
                salt: newSalt,
                hash: newHash
            };

            // Update the user.
            await this.updateUser(updateObject);
            return true;
        }.bind(this)();
    }

    // Removes a user by username.
    removeUserByUsername(username) {
        return async function() {
            await this._model.remove({ username });
            return;
        }.bind(this)();
    }

    //// Passport.js Related Methods ////
    // Serialises a user down to just an id.
    serialiseUser(user, done) {
        done(null, user.username);
    }

    // Fetches the full user object from a serialised one (i.e. the id).
    deserialiseUser(username, done) {
        this._model.findOne({ username: username }, (err, foundUser) => {
            if (err) {
                done(err);
            }
            else {
                done(null, foundUser);
            }
        });
    }

    // Registers a new user, hashing and salting the password.
    registerUser(user) {
        // Retrieve the password from the data, and remove it.
        let password = user.password;
        delete user.password;

        // Generate a 32-char-long salt, a random string of hex characters.
        let salt = this._generateRandomHexString(32);

        // Generate the hash of the password and salt.
        let hash = this._hashPassword(password, salt);

        // Add the salt and hash to the user object.
        user.salt = salt;
        user.hash = hash;

        // Get the User model and create the new user, calling the callback with the result.
        return async function() {
            let createdUser = await this._model.create(user);
            return createdUser;
        }.bind(this)();
    }

    // Authenticates a user by checking the password against the salt + hash.
    authenticateUser(username, password, done) {
        this._model.findOne({ username: username }, (err, foundUser) => {
            // Return the error if there is one, or false if the user doesn't exist, or the password is not a match.
            if (err) { done(err); }
            else if (!foundUser) { done(null, false); }
            else if (!this._verifyPassword(password, foundUser.salt, foundUser.hash)) { done(null, false); }

            // Otherwise return the user, the password matches.
            else done(null, foundUser);
        });
    }

}

// Export the class.
export default User;
