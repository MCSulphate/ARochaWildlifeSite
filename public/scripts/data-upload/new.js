// Matthew Lester NEA Project - new.js (Data Upload New Page Script)

// ESLint Warning Hiders
/* global message */
/* global changeVisibility */
/* global JSONRequest */
/* global displayFormError */
/* global displayFormSuccess */

(() => {

    // Miscellaneous Elements
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

    // Add click listener to hide error message.
    errorMessage.addEventListener("click", () => changeVisibility(errorMessage, false));

})();
