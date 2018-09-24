// Matthew Lester NEA Project - new.js (Data Upload New Page Script)

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

    //
    // Modal Handling
    //

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

    //
    // Upload Form Handling
    //

    // Form Elements
    let speciesForm = document.getElementById("species-form");
    let latinNameInput = document.getElementById("latin-name-input");
    let commonNameInput = document.getElementById("common-name-input");
    let countInput = document.getElementById("count-input");
    let dateInput = document.getElementById("date-input");
    let gridReferenceInput = document.getElementById("grid-reference-input");
    let commentsInput = document.getElementById("comments-input");

    // Status Controls Elements
    let statusControlsContainer = document.getElementById("status-controls-container");

    // Array containing the species data.
    let speciesDataContainer = [];

    // Capitalises the first letter of a string.
    function capitaliseFirst(string) {
        return string.substring(0, 1).toUpperCase() + string.substring(1);
    }

    // Handles clicks on the 'Add Species' button.
    document.getElementById("add-species-button").addEventListener("click", () => {
        if (latinNameInput.value === "" || countInput.value === "" || dateInput.value === "") {
            displayFormError(speciesForm, "Please fill in the required fields.");
            return;
        }

        let speciesData = {
            latinName: capitaliseFirst(latinNameInput.value.toLowerCase()),
            commonName: commonNameInput.value ? capitaliseFirst(commonNameInput.value.toLowerCase()) : "Not Given",
            count: countInput.value,
            date: dateInput.value,
            gridReference: gridReferenceInput.value || "Not Given",
            comments: commentsInput.value || "Not Given"
        };

        // Check if the species is in the upload already.
        if (checkIfInUpload(speciesData.latinName)) {
            displayFormError(speciesForm, "Please do not add duplicate species in an upload, edit them instead.");
            return;
        }

        speciesDataContainer.push(speciesData);

        // If this is the first species being added, remove the 'No species in upload' message.
        if (speciesDataContainer.length === 1) {
            statusControlsContainer.querySelector("p").remove();
        }

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
        editButton.addEventListener("click", () => { editSpeciesEntry(speciesData.latinName); });
        removeButton.addEventListener("click", () => { removeSpeciesEntry(speciesData.latinName); });

        statusControl.appendChild(latinName);
        statusControl.appendChild(commonName);
        statusControl.appendChild(editButton);
        statusControl.appendChild(removeButton);

        statusControlsContainer.appendChild(statusControl);

        // Clear the inputs.
        latinNameInput.value = "";
        commonNameInput.value = "";
        countInput.value = "";
        dateInput.value = "";
        gridReferenceInput.value = "";
        commentsInput.value = "";

        // Hide errors, show success.
        clearFormErrors(speciesForm);
        displayFormSuccess(speciesForm, "Species added to upload.");
    });

    // Checks if a species is already in the upload.
    function checkIfInUpload(latinName) {
        for (let species of speciesDataContainer) {
            if (species.latinName === latinName) return true;
        }

        return false;
    }

    // Loads data for editing a species entry.
    function editSpeciesEntry(latinName) {
        // Get the species data, replace all filler data.
        let speciesData = findSpeciesData(latinName);
        replaceFillerData(speciesData);

        // Set the input values.
        latinNameInput.value = speciesData.latinName;
        commonNameInput.value = speciesData.commonName;
        countInput.value = speciesData.count;
        dateInput.value = speciesData.date;
        gridReferenceInput.value = speciesData.gridReference;
        commentsInput.value = speciesData.comments;

        // Remove the species entry.
        removeSpeciesEntry(latinName);
    }

    // Removes a species entry.
    function removeSpeciesEntry(latinName) {
        // Get the index of the data.
        let index = findSpeciesData(latinName, true);

        // Remove the data from the object.
        speciesDataContainer.splice(index, 1);
        console.log(speciesDataContainer);

        // Find and remove the element.
        statusControlsContainer.querySelectorAll(".upload-status-control")[index].remove();

        // If there are now no species, re-add the 'No species in upload' message.
        if (speciesDataContainer.length === 0) {
            let message = document.createElement("p");
            message.textContent = "No species currently in the upload.";
            statusControlsContainer.appendChild(message);
        }
    }

    // Finds species data by latin name.
    function findSpeciesData(latinName, getIndex) {
        if (getIndex) {
            for (let i = 0; i < speciesDataContainer.length; i++) {
                let data = speciesDataContainer[i];
                if (data.latinName === latinName) return i;
            }

            return -1;
        }
        else {
            for (let data of speciesDataContainer) {
                if (data.latinName === latinName) return data;
            }

            return null;
        }
    }

    // Replaces filler data with empty strings.
    function replaceFillerData(speciesData) {
        for (let key of Object.keys(speciesData)) {
            if (speciesData[key] === "Not Given") speciesData[key] = "";
        }
    }

    // Handles finalising the upload.
    let uploadStatusForm = document.getElementById("upload-status-container");
    let submitButton = document.getElementById("submit-upload-button");
    let submitButtonEnabled = true;
    submitButton.addEventListener("click", uploadData);

    let taxonomicGroupSelect = document.getElementById("taxonomic-group-select");
    let locationSelect = document.getElementById("location-select");
    let observersInput = document.getElementById("observers-input");

    async function uploadData() {
        // Check that they have some species in the upload.
        if (speciesDataContainer.length === 0) {
            displayFormError(uploadStatusForm, "Please add at least 1 species to the upload.");
            return;
        }

        // Check that both the taxonomic group and location have been set.
        if (taxonomicGroupSelect.value === "" || locationSelect.value === "") {
            displayFormError(uploadStatusForm, "Please fill out the Taxonomic Group and Location form.");
            return;
        }

        if (!submitButtonEnabled) return;
        else submitButtonEnabled = false;

        // Create a data object containing upload data, send it to the server.
        let data = {
            species: speciesDataContainer, // Array containing data to be uploaded.
            taxonomicGroup: taxonomicGroupSelect.value,
            location: locationSelect.value,
            observers: observersInput.value || "Not Given"
        };

        let response = await JSONRequest("/track/new", data);
        if (response.error) {
            displayFormError(uploadStatusForm, response.error);
            submitButtonEnabled = true;
        }
        else {
            displayFormSuccess(uploadStatusForm, "Data successfully uploaded! Redirecting you in a few seconds.");
            setTimeout(() => {
                window.location = "/review/main";
            }, 3500);
        }
    }

})();
