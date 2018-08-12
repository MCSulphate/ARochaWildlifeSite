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
function displayFormError(formElement, errorMessage) {
    let errorElement = formElement.querySelector(".form-error");

    if (errorElement) {
        displayMessage(errorElement, errorMessage);
    }
    else {
        throw new Error("Could not display error message: No error element found in given form.");
    }
}

// Displays a form success message.
function displayFormSuccess(formElement, successMessage) {
    let successElement = formElement.querySelector(".form-success");
    
    if (successElement) {
        displayMessage(successElement, successMessage);
    }
    else {
        throw new Error("Could not display success message: No success element found in given form.");
    }
}

// Displays a message using textContent.
function displayMessage(element, message) {
    // Show the message.
    element.textContent = message;
    element.style.opacity = 1;

    // Hide the message after 10 seconds (10.4 to hide the text).
    setTimeout(() => {
        element.style.opacity = 0;
    }, 10000);
    setTimeout(() => {
        element.textContent = "";
    }, 10400);
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

// Renders a table from a data upload.
function loadUploadTable(uploadData) {
    let FIELD_LIST = ["Species", "Number", "Gender", "Age", "Status", "Date", "Observers", "Comment"];

    let tGroup = uploadData.taxonomicGroup;
    let optionalFields = tGroup.optionalFields;
    let invalidFields = tGroup.invalidFields;
    let lcFieldList = [];

    let table = document.createElement("table");
    let thead = document.createElement("thead");
    let tbody = document.createElement("tbody");
    let headrow = document.createElement("tr");

    // Create the table headers, including 'required stars'.
    for (let field of FIELD_LIST) {
        if (invalidFields.indexOf(field) === -1) {
            let header = document.createElement("th");
            let headerText = document.createTextNode(field);
            header.appendChild(headerText);

            // Check if it is required (i.e. not in optional list).
            if (optionalFields.indexOf(field) === -1) {
                let requiredSpan = document.createElement("span");
                requiredSpan.className = "required";
                requiredSpan.textContent = "*";

                header.appendChild(requiredSpan);
            }

            lcFieldList.push(field.toLowerCase());
            headrow.appendChild(header);
        }
    }
    // Add the header-row and the table head to the table.
    thead.appendChild(headrow);
    table.appendChild(thead);

    // Create a row for each species uploaded.
    for (let species of uploadData.species) {
        let tr = document.createElement("tr");

        // Set the 'species' field to be the actual name, not the document itself.
        species.species = species.species.name;

        // Loop through each field, stored in the lower-case field list.
        for (let field of lcFieldList) {
            let data = species[field];
            let td = document.createElement("td");
            let text;

            // Get the text equivalent of the data.
            if (data) {
                if (field === "date") {
                    text = document.createTextNode(new Date(data).toDateString());
                }
                else if (data instanceof Array) {
                    if (data.length > 0) {
                        text = document.createTextNode(data.join(", "));
                    }
                    else {
                        text = document.createTextNode("No Data Given");
                    }
                }
                else {
                    text = document.createTextNode(data);
                }
            }
            else {
                text = document.createTextNode("No Data Given");
            }

            // Append to the row.
            td.appendChild(text);
            tr.appendChild(td);
        }

        // Append the row to the table.
        tbody.append(tr);
    }
    // Append the table body to the table.
    table.appendChild(tbody);

    // Return the created table.
    return table;
}