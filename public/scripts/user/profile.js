// Matthew Lester NEA Project - profile.js (User Profile Page Script)

// ESLint Warning Hiders
/* global JSONRequest */
/* global message */
/* global changeVisibility */
/* global validateTypes */
/* global validateLengths */
/* global allValid */
/* global getErrorMessage */

// Run the script inside an anonymous function - this stops any variables leaking
// to other files - keeping it out of the global scope.
(() => {
    
    // Variables
    let changePasswordFormShowing = false;
    
    // Form-Related Elements
    let changePasswordForm = document.getElementById("change-password-form");
    let oldPasswordField = document.getElementById("old-password-field");
    let newPasswordField = document.getElementById("new-password-field");
    
    // Form Toggle Button
    let formToggleButton = document.getElementById("form-toggle-button");
    
    // Username Element
    let usernameElement = document.getElementById("username");
    
    // Error Message
    let errorMessage = document.getElementById("error-message");
    let showMessage = message.bind(errorMessage);
    
    // Clears the change password form.
    function clearForm() {
        oldPasswordField.value = "";
        newPasswordField.value = "";
    }
    
    // Toggles the change password form.
    function togglePasswordForm() {
        if (changePasswordFormShowing) {
            formToggleButton.textContent = "Change your password";
            changeVisibility(changePasswordForm, false);
            changePasswordFormShowing = false;
            clearForm();
        }
        else {
            // Focus the old password field.
            oldPasswordField.focus();
            formToggleButton.textContent = "Close Form";
            changeVisibility(changePasswordForm, true);
            changePasswordFormShowing = true;
        }
    }
    
    // Validates the form data.
    function validateFormData(data) {
        // Local names.
        let localNames = {
            username: "Username",
            oldPassword: "Old Password",
            newPassword: "New Password"
        };
        
        let typesValid = validateTypes(data, {
            username: String,
            oldPassword: String,
            newPassword: String
        }, localNames);
        
        let lengthsValid = validateLengths(data, {
            username: [3, 20],
            oldPassword: [8, 200],
            newPassword: [8, 200]
        }, localNames);
        
        let resultsArray = [typesValid, lengthsValid];
        
        if (allValid(resultsArray)) {
            return true;
        }
        else {
            showMessage(getErrorMessage(resultsArray));
            return false;
        }
    }
    
    // Sends a request to the server to change the user's password.
    async function changePassword(event) {
        // Prevent form submission.
        event.preventDefault();
        
        // Get the data.
        let oldPassword = oldPasswordField.value;
        let newPassword = newPasswordField.value;
        let username = usernameElement.textContent.substring(10);
        
        let dataToSend = {
            username: username,
            oldPassword: oldPassword,
            newPassword: newPassword
        };
        
        if (!validateFormData(dataToSend)) {
            return;
        }
        
        // Send the request.
        try {
            let body = await JSONRequest(document.URL, dataToSend);
            if (body.error) {
                showMessage(body.error);
            }
            else {
                clearForm();
                showMessage("Successfully changed your password.");
            }
        }
        catch (err) {
            showMessage(err.message, err);
        }
        
    }
    
    // Event Listeners
    // Add a click listener to the toggle button to toggle the form.
    formToggleButton.addEventListener("click", togglePasswordForm);
    
    // Add a submit listener to the form.
    changePasswordForm.addEventListener("submit", changePassword);
    
    // Add a click listener to the error message to hide it.
    errorMessage.addEventListener("click", () => changeVisibility(errorMessage, false));
    
})();