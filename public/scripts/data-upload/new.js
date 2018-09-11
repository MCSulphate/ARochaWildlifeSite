// Matthew Lester NEA Project - new.js (Data Upload New Page Script)

// ESLint Warning Hiders
/* global message */
/* global changeVisibility */
/* global JSONRequest */
/* global displayFormError */
/* global displayFormSuccess */

(() => {

    // Modals
    let locationModal = document.getElementById("new-location-modal");
    let tGroupModal = document.getElementById("new-taxonomic-group-modal");

    // Error Message
    let errorMessage = document.getElementById("error-message");
    let showMessage = message.bind(errorMessage);

    // Causes the modals to pop up.
    document.getElementById("location-popup-link").addEventListener("click", event => {
        locationModal.style.display = "block";
    });
    document.getElementById("taxonomic-group-popup-link").addEventListener("click", () => {
        tGroupModal.style.display = "block";
    });

    // Closes the modals.
    locationModal.querySelector(".close").addEventListener("click", event => {
        locationModal.style.display = "none";
    });
    tGroupModal.querySelector(".close").addEventListener("click", event => {
        tGroupModal.style.display = "none";
    });

    // Sends a POST request to create a new location.
    document.getElementById("location-submit-button").addEventListener("click", async event => {
        let newLocationField = document.getElementById("new-location-field");
        let value = newLocationField.value;
        let form = document.getElementById("location-form");
        
        if (!value || value.length < 5 || value.length > 50) {
            displayFormError(form, "Invalid location name. Must be at least 5 characters long, and less than 50.");
        }
        else {
            let data = {
                locationName: value
            };

            try {
                let body = await JSONRequest("/track/location", data);
                
                if (body.error) {
                    displayFormError(form, body.error);
                }
                else {
                    displayFormSuccess(form, "Successfully created the location.");
                    
                    // Create a new option for the select element.
                    let option = document.createElement("option");
                    option.value = value;
                    option.textContent = value;
                    
                    // Find the select element and append the option.
                    let locationSelect = document.getElementById("location-select");
                    locationSelect.appendChild(option);
                }
            }
            catch (err) {
                displayFormError(form, err.message);
            }
        }
    });

    // Sends a POST request to create a new taxonomic group.
    document.getElementById("taxonomic-group-submit-button").addEventListener("click", async () => {
        let newGroupField = document.getElementById("new-taxonomic-group-field");
        let value = newGroupField.value;
        let form = document.getElementById("taxonomic-group-form");
        
        if (!value || value.length < 5 || value.length > 50) {
            displayFormError(form, "Invalid group name. Must be at least 5 characters long, and less than 50.");
        }
        else {
            let data = {
                groupName: value
            };

            try {
                let body = await JSONRequest("/track/taxonomic-group", data);
                
                if (body.error) {
                    displayFormError(form, body.error);
                }
                else {
                    displayFormSuccess(form, "Successfully created the group.");
                    
                    // Create a new option for the select element.
                    let option = document.createElement("option");
                    option.value = value;
                    option.textContent = value;
                    
                    // Find the select element and append the option.
                    let groupSelect = document.getElementById("taxonomic-group-select");
                    groupSelect.appendChild(option);
                }
            }
            catch (err) {
                displayFormError(form, err.message);
            }
        }
    });

    // Form Elements
    let speciesForm = document.getElementById("species-form");
    let latinNameInput = document.getElementById("latin-name-input");
    let commonNameInput = document.getElementById("common-name-input");
    let frequencyInput = document.getElementById("frequency-input");
    let gridReferenceInput = document.getElementById("grid-reference-input");
    let commentsInput = document.getElementById("comments-input");

    // Status Controls Elements
    let statusControlsContainer = document.getElementById("status-controls-container");

    // Array containing the species data.
    let speciesDataContainer = [];

    // Handles clicks on the 'Add Species' button.
    document.getElementById("add-species-button").addEventListener("click", () => {
        if (latinNameInput.value === "" || frequencyInput.value === "") {
            displayFormError(speciesForm, "Please fill in the required fields.");
            return;
        }

        let speciesData = {
            latinName: latinNameInput.value,
            commonName: commonNameInput.value || "Not Given",
            frequency: frequencyInput.value,
            gridReference: gridReferenceInput.value || "Not Given",
            comments: commentsInput.value || "Not Given"
        };

        speciesDataContainer.push(speciesData);

        // Create a new status control and add it to the container.
        let statusControl = document.createElement("div");
        statusControl.className = "upload-status-control";

        let latinName = document.createElement("span");
        latinName.className = "latin-name";
        latinName.textContent = speciesData.latinName;
        let commonName = document.createElement("span");
        commonName.className = "common-name";
        commonName.textContent = "(" + speciesData.commonName + ")";

        let editButton = document.createElement("a");
        editButton.className = "edit-button";
        editButton.href = "#";
        editButton.textContent = "Edit";

        let removeButton = document.createElement("a");
        removeButton.className = "remove-button";
        removeButton.href = "#";
        removeButton.textContent = "Remove";

        // Add click listeners to the buttons.
        // TODO

        statusControl.appendChild(latinName);
        statusControl.appendChild(commonName);
        statusControl.appendChild(editButton);
        statusControl.appendChild(removeButton);

        statusControlsContainer.appendChild(statusControl);

        // Clear the inputs.
        latinNameInput.value = "";
        commonNameInput.value = "";
        frequencyInput.value = "";
        gridReferenceInput.value = "";
        commentsInput.value = "";
    });

    // Add click listener to hide error message.
    errorMessage.addEventListener("click", () => changeVisibility(errorMessage, false));

})();
