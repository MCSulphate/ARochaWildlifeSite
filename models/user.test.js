// Matthew Lester NEA Project - user.test.js (User Model Tests)

// File Being Tested
import User from './user';
let user = new User();

// Other Imports
import mongoose from 'mongoose';

// Tests

// Connect to the database before testing.
beforeAll(async() => {
    mongoose.Promise = global.Promise;
    await mongoose.connect('mongodb://localhost/nea_project_tests', { useMongoClient: true });
});

// Disconnect from the database after testing.
afterAll(async() => {
    await mongoose.disconnect();
});

test('wait for model indexing', async() => {
    expect.assertions(1);
    await expect(user.waitForIndex()).resolves.toBeUndefined();
});

test('random hex string of length 9 has a length of 9', () => {
    expect(user._generateRandomHexString(9).length).toBe(9);
});

let correctHash = "1c8e432462648d825ade4983da4b1c9cc231180d3dd0e77b0cfe0b28c5e2f2b39aa3adabfcd5e1fe968b9e815005cf67499c30177f4c0199e39064ceaa5adefa";

test('hash of password \'password\' with salt \'salt\' equals the correct hash starting with 1c8e432462648d825ade', () => {
    let passwordHash = user._hashPassword('password', 'salt');
    expect(passwordHash).toBe(correctHash);
});

test('verification of the password \'password\' and the salt \'salt\' with the correct hash returns true', () => {
    expect(user._verifyPassword('password', 'salt', correctHash)).toBe(true);
});

test('verification of the password \'wrong_password\' and the salt \'salt\' with the hash for \'password\' returns false', () => {
    expect(user._verifyPassword('wrong_password', 'salt', correctHash)).toBe(false);
});

let correctUser;
const objectContainingUser = expect.objectContaining({
    __v: expect.any(Number),
    _id: expect.any(Object),
    username: "Some User",
    locationName: "Some Location",
        
    hash: expect.any(String),
    salt: expect.any(String)
});

test('registering a user returns a correct created user', async () => {
    expect.assertions(1);
    let exampleUser = {
        username: "Some User",
        password: "password",
        locationName: "Some Location"
    };
    
    correctUser = await user.registerUser(exampleUser);
    expect(correctUser).toEqual(objectContainingUser);
});

test('finding a user by username returns the correct user object', async () => {
    expect.assertions(1);
    await expect(user.findUserByUsername("Some User")).resolves.toEqual(objectContainingUser);
});

test('finding a user by id returns the correct user object', async () => {
    expect.assertions(1);
    await expect(user.findUserById(correctUser._id)).resolves.toEqual(objectContainingUser);
});

test('serialising a user returns just the username', () => {
    let callback = jest.fn();
    user.serialiseUser(correctUser, callback);
    expect(callback).toHaveBeenCalledWith(null, correctUser.username);
});

test('deserialising a user returns the correct user object', done => {
    expect.assertions(1);
    let callback = (err, user) => {
        if (err) throw err;
        expect(user).toEqual(objectContainingUser);
        done();
    };
    user.deserialiseUser(correctUser.username, callback);
});

test('authenticating a user with the correct password returns true', done => {
    expect.assertions(1);
    let callback = (err, authenticated) => {
        if (err) throw err;
        expect(authenticated).toEqual(objectContainingUser);
        done();
    };
    user.authenticateUser("Some User", "password", callback);
});

test('removing a user by username returns undefined', async () => {
    expect.assertions(1);
    await expect(user.removeUserByUsername("Some User")).resolves.toBe(undefined);
});

test('removing all users returns undefined', async() => {
    expect.assertions(1);
    await expect(user.removeAllUsers()).resolves.toBe(undefined);
});
