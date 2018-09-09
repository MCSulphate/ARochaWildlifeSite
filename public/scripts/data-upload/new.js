// Matthew Lester NEA Project - new.js (Data Upload New Page Script)

// ESLint Warning Hiders
/* global message */
/* global changeVisibility */
/* global JSONRequest */
/* global displayFormError */
/* global displayFormSuccess */

(() => {

    // Miscellaneous Elements
    let modal = document.querySelector(".modal");

    // Error Message
    let errorMessage = document.getElementById("error-message");
    let showMessage = message.bind(errorMessage);

    // Causes the 'new location' modal to pop up.
    document.getElementById("location-popup-link").addEventListener("click", event => {
        modal.style.display = "block";
    });
    // Closes the modal.
    document.querySelector(".close").addEventListener("click", event => {
        modal.style.display = "none";
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
                let body = await JSONRequest("/track/new-location", data);
                
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

    // Event Listeners

    // Add click listener to hide error message.
    errorMessage.addEventListener("click", () => changeVisibility(errorMessage, false));

})();
