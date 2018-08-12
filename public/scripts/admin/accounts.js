// Matthew Lester NEA Project - accounts.js (Account Management Page Script)

// ESLint Warning Hiders
/* global JSONRequest */
/* global validateTypes */
/* global validateLengths */
/* global validateKeyCount */
/* global allValid */
/* global getErrorMessage */
/* global message */
/* global changeVisibility */
/* global addListenersToAll */

// Run the script inside an anonymous function - this stops any variables leaking
// to other files - keeping it out of the global scope.
(() => {
    // Variables
    let newUserFormShowing = false;

    // Form-Related Elements
    let newUserForm = document.getElementById("new-user-form");
    let usernameField = document.getElementById("username-field");
    let passwordField = document.getElementById("password-field");

    // Form Toggle Button
    let formToggleButton = document.getElementById("form-toggle-button");

    // Error Message
    let errorMessage = document.getElementById("error-message");
    let showMessage = message.bind(errorMessage);

    // Users Table
    let usersTable = document.querySelector("#users-table tbody");

    // Appends a new user to the table.
    function appendNewUser(user) {
        let row = document.createElement("tr");
        let data = document.createElement("td");
        let button = document.createElement("button");

        // Create the needed blank elements.
        let username = data.cloneNode();
        let buttonsData = data.cloneNode();
        let deleteButton = button.cloneNode();

        // Username
        username.textContent = user.username;
        username.className = "table-username";
        
        // Delete Button
        deleteButton.textContent = "Delete";
        deleteButton.className = "delete-user-button";

        // Add a click listeners to the buttons.
        deleteButton.addEventListener("click", removeUser);

        // Add the delete button to the delete data.
        buttonsData.appendChild(deleteButton);

        // Add the table data to the row.
        row.appendChild(username);
        row.appendChild(buttonsData);

        // Add the row to the table.
        usersTable.appendChild(row);
    }

    // Validates the user form data.
    function validateFormData(data) {

        // Local names.
        let localNames = {
            username: "Username",
            password: "Password"
        };

        // Validate data types.
        let typesValid = validateTypes(data, {
            username: String,
            password: String
        }, localNames);

        // Validate data lengths.
        let lengthsValid = validateLengths(data, {
            username: [3, 20],
            password: [8, 200]
        }, localNames);

        // Validate data keys.
        let keysValid = validateKeyCount(data, 2, "The form");

        // Array of all results.
        let resultsArray = [typesValid, lengthsValid, keysValid];

        if (allValid(resultsArray)) {
            return true;
        }
        else {
            showMessage(getErrorMessage(resultsArray));
            return false;
        }

    }

    // Clears the form fields.
    function clearForm() {
        usernameField.value = "";
        passwordField.value = "";
    }

    // Sends a request to the server to create a new user.
    async function createNewUser(event) {
        // Prevent the default form submission.
        event.preventDefault();

        // Get the username and password from the inputs.
        let userToCreate = {
            username: usernameField.value,
            password: passwordField.value
        };

        if (!validateFormData(userToCreate)) {
            return;
        }

        // Use my JSONRequest method to send the request.
        try {
            let body = await JSONRequest(document.URL, userToCreate);
            if (body.error) {
                showMessage(body.error);
            }
            else {
                clearForm();
                appendNewUser(body);
                showMessage("Successfully created a new user.");
            }
        }
        catch (err) {
            showMessage(err.message, err);
        }
    }

    // Gets elements that are useful for form submission.
    // Cuts down a lot of code repetition.
    function getRelatedElements(event) {
        let clicked = event.target;
        let row = clicked.parentNode.parentNode;
        let deleteButton = row.querySelector(".delete-user-button");
        let usernameData = row.querySelector(".table-username");
        let username = usernameData.textContent;

        return { clicked, row, deleteButton, usernameData, username };
    }

    // Sends a request to the server to delete a user.
    async function removeUser(event) {
        let { row, username } = getRelatedElements(event);

        try {
            let body = await JSONRequest(document.URL, { username: username }, "DELETE");
            if (body.error) {
                showMessage(body.error);
            }
            else {
                row.remove();
                showMessage("Successfully deleted the user.");
            }
        }
        catch (err) {
            showMessage(err.message, err);
        }
    }

    // Toggles the new user form.
    function toggleUserForm() {
        if (newUserFormShowing) {
            // Hide the form and the close button, show the new user button.
            formToggleButton.textContent = "Add a new user account";
            changeVisibility(newUserForm, false);
            newUserFormShowing = false;
            clearForm();
        }
        else {
            // Hide the new user button, show the form and close button.
            formToggleButton.textContent = "Close form";
            changeVisibility(newUserForm, true, "inline-block");
            newUserFormShowing = true;
            
            // Focus the username field.
            usernameField.focus();
        }
    }
    
    // Event Listeners
    // Add a click event listener to the toggle form button.
    formToggleButton.addEventListener("click", toggleUserForm);

    // Add a submit event listener to the form, using createNewUser as the callback.
    newUserForm.addEventListener("submit", createNewUser);

    // Add a click listener to the error message to allow the user to hide it.
    errorMessage.addEventListener("click", () => changeVisibility(errorMessage, false));

    // Add click listeners to the current delete buttons.
    let deleteButtons = document.getElementsByClassName("delete-user-button");
    addListenersToAll(deleteButtons, "click", removeUser);
})();
