// Matthew Lester NEA Project - utils.js (General Frontend Utility Functions)

// ESLint Warning Hiders
/* global fetch */

// Sends a JSON request to the server and returns the response.
async function JSONRequest(url, body, method, shouldGetBody) {

    let response = await fetch(url, {
        method: method || "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        throw new Error("Response failed with status code " + response.status);
    }
    else {
        if (shouldGetBody || shouldGetBody === undefined) {
            let body = await response.json();
            return body;
        }
        else {
            return "Request successful.";
        }
    }

}

// Displays a form error.
let errorIDs = [];
function displayFormError(formElement, errorMessage) {
    let errorElement = formElement.querySelector(".form-error");
    
    // Clear the timeouts, if there are any.
    if (errorIDs[0]) clearTimeout(errorIDs[0]);
    if (errorIDs[1]) clearTimeout(errorIDs[1]);

    if (errorElement) {
        displayMessage(errorElement, errorMessage, errorIDs);
    }
    else {
        throw new Error("Could not display error message: No error element found in given form.");
    }
}

// Displays a form success message.
let successIDs = [];
function displayFormSuccess(formElement, successMessage) {
    let successElement = formElement.querySelector(".form-success");
    
    // Clear the timeouts, if there are any.
    if (successIDs[0]) clearTimeout(successIDs[0]);
    if (successIDs[1]) clearTimeout(successIDs[1]);
    
    if (successElement) {
        displayMessage(successElement, successMessage, successIDs);
    }
    else {
        throw new Error("Could not display success message: No success element found in given form.");
    }
}

// Displays a message using textContent. Sets timeout IDs so that they can be cancelled if needed.
function displayMessage(element, message, timeoutIDs) {
    // Show the message.
    element.textContent = message;
    element.style.opacity = 1;

    // Hide the message after 10 seconds (10.4 to hide the text).
    timeoutIDs[0] = setTimeout(() => {
        element.style.opacity = 0;
        timeoutIDs[0] = null;
    }, 6000);
    timeoutIDs[1] = setTimeout(() => {
        element.textContent = "";
        timeoutIDs[1] = null;
    }, 6400);
}

// Clears error messages.
function clearFormErrors(formElement) {
    let errorElement = formElement.querySelector(".form-error");
    
    // Clear the timeouts, if there are any.
    if (errorIDs[0]) clearTimeout(errorIDs[0]);
    if (errorIDs[1]) clearTimeout(errorIDs[1]);

    // Set opacity to 0 immediately, set timeout for hiding.
    try {
        errorElement.style.opacity = 0;
        errorIDs[1] = setTimeout(() => {
            errorElement.textContent = "";
            errorIDs[1] = null;
        }, 400);
    }
    catch (err) {
        console.log(err.message);
        throw new Error("Could not clear form error messages, no error element found in given form.");
    }
}

// Clears success messages.
function clearFormSuccesses(formElement) {
    let successElement = formElement.querySelector(".form-success");
    
    // Clear the timeouts, if there are any.
    if (successIDs[0]) clearTimeout(successIDs[0]);
    if (successIDs[1]) clearTimeout(successIDs[1]);

    // Set opacity to 0 immediately, set timeout for hiding.
    try {
        successElement.style.opacity = 0;
        successIDs[1] = setTimeout(() => {
            successElement.textContent = "";
            successIDs[1] = null;
        }, 400);
    }
    catch (err) {
        throw new Error("Could not clear form success messages, no success element found in given form.");
    }
}

// Shows a message using an element bound to the function, and logs errors to the console.
function message(message, error) {
    if (this === window || !this) {
        return;
    }

    if (error) {
        console.log(error);
    }

    this.textContent = message + " (click to close)";
    this.style.display = "block";
}

// Changes the visibility of an element.
function changeVisibility(element, visible, display) {
    if (visible) {
        element.style.display = display || "block";
    }
    else {
        element.style.display = "none";
    }
}

// Toggles the visibility of an element.
function toggleVisibility(element, display) {
    let isInvisible = element.style.display === "none";
    element.style.display = isInvisible ? (display || "block") : "none";
}

// Small utility function to add event listeners to every element in an element list.
function addListenersToAll(list, event, listener) {
    for (let i = 0; i < list.length; i++) {
        list[i].addEventListener(event, listener);
    }
}

// Adds an 'enter' listener to forms to press the button at the end.
for (let form of document.querySelectorAll(".form")) {
    // Check if the form has a button, and get the last one.
    let buttons = form.querySelectorAll(".button");
    if (buttons.length !== 0) {
        let lastButton = buttons[buttons.length - 1];

        form.addEventListener("keypress", event => {
            if (event.key === "Enter") {
                // Trigger a click event on the button.
                let clickEvent = new MouseEvent("click", {
                    view: window,
                    bubbles: true,
                    cancelable: true
                });

                lastButton.dispatchEvent(clickEvent);
            }
        });
    }
}