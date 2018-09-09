// Elements
let usernameField = document.getElementById("username-input");
let passwordField = document.getElementById("password-input");
let loginButton = document.getElementById("login-button");
let errorMessage = document.getElementById("error-message");
let loginForm = document.getElementById("login-form");

// Login handler.
loginButton.addEventListener("click", async () => {
    let username = usernameField.value;
    let password = passwordField.value;

    let data = {
        username,
        password
    };

    let response = await JSONRequest("/login", data);
    if (response.error) {
        // Clear the fields and show the error message.
        usernameField.value = "";
        passwordField.value = "";
        
        displayFormError(loginForm, response.error);
    }
    else {
        document.location = "/";
    }
});