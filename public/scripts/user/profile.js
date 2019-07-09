(() => {

    //
    // PASSWORD-CHANGING FUNCTIONALITY
    //

    // Elements
    let changePasswordButton = document.getElementById("change-password-button");
    let changePasswordModal = document.getElementById("change-password-modal");
    let changePasswordForm = document.getElementById("change-password-form");
    let oldPasswordInput = document.getElementById("old-password-input");
    let newPasswordInput = document.getElementById("new-password-input");
    let changePasswordSubmitButton = document.getElementById("change-password-submit-button");

    // Add click listeners for opening and closing the change password modal.
    changePasswordButton.addEventListener("click", () => {
        changePasswordModal.style.display = "block";
    });

    changePasswordModal.querySelector(".close").addEventListener("click", () => {
        changePasswordModal.style.display = "none";
        
        // Clear the form inputs.
        oldPasswordInput.value = "";
        newPasswordInput.value = "";
    });

    // Change password listener.
    let isBusy = false;
    changePasswordSubmitButton.addEventListener("click", () => {
        // Fetch password data.
        let oldPassword = oldPasswordInput.value;
        let newPassword = newPasswordInput.value;

        // Do some validation.
        if (oldPassword == "" || newPassword == "") {
            displayFormError(changePasswordForm, "Please fill in the required inputs.");
            return;
        }
        else if (newPassword.length < 8 || newPassword.length > 200) {
            displayFormError(changePasswordForm, "The new password must be at least 8 characters in length, and no more than 200.");
            return;
        }
        else if (isBusy) {
            displayFormError(changePasswordForm, "Please wait, a request has already been sent.");
            return;
        }

        // Send the request to change the password.
        let body = {
            oldPassword,
            newPassword
        };

        JSONRequest("/user/profile", body)
            .then(response => {
                if (response.error) {
                    displayFormError(changePasswordForm, response.error);
                }
                else {
                    displayFormSuccess(changePasswordForm, "Successfully changed your password.");
                }
            })
            .catch(err => {
                displayFormError(changePasswordForm, "Error sending request: " + err.message);
            });
    });

    //
    // DATA UPLOADS VIEWING / EDITING / DELETING FUNCTIONALITY
    //

    // Elements
    let uploadsContainer = document.getElementById("uploads-container");
    let loadingImage = document.getElementById("loading-image");
    let innerContainer = document.getElementById("inner-container");
    let dataUploadModal = document.getElementById("data-upload-modal");
    let uploadInformationTable = document.getElementById("upload-information-table");
    let speciesInformationTable = document.getElementById("species-information-table");
    let uploadInformationHeader = document.getElementById("upload-information-header");
    let speciesInformationHeader = document.getElementById("species-information-header");
    let uploadInformationTableContainer = document.getElementById("upload-information-table-container");
    let speciesInformationTableContainer = document.getElementById("species-information-table-container");

    // Data upload related data.
    let uploads = null;
    let currentUpload = null;
    let currentUploadElement = null;

    // Fetches the user's data uploads from the server.
    (async () => {
        let response;

        try {
            response = await JSONRequest("/user/data-uploads", {});

            if (response.error) {
                displayFormError(uploadsContainer, response.error);
                return;
            }
        }
        catch (err) {
            displayFormError(uploadsContainer, "Failed to fetch your uploads from the server, please try again later.");
            return;
        }

        // Set the uploads.
        uploads = response.uploads;

        // Create a new div to display each shortened upload data.
        for (let upload of uploads) {
            // Pads a number to two characters in length.
            let padToTwo = function(num) {
                num = num + "";
                
                while (num.length < 2) {
                    num = "0" + num;
                }

                return num;
            }

            let container = document.createElement("div");
            container.className = "data-upload";

            let dateParagraph = document.createElement("p");
            let speciesParagraph = document.createElement("p");
            let expandSpan = document.createElement("span");

            let date = new Date(upload.date);
            let dateString = `<span class="highlight">${padToTwo(date.getDate() + 1)}/${padToTwo(date.getMonth() + 1)}/${date.getFullYear()}</span>`;

            dateParagraph.innerHTML = "Uploaded on " + dateString;
            speciesParagraph.innerHTML = "(Contains <span class=\"highlight\">" + upload.species.length + "</span> Species)";
            expandSpan.textContent = "Click to Expand";

            dateParagraph.className = "upload-paragraph";
            speciesParagraph.className = "upload-paragraph";
            expandSpan.className = "upload-expand-button";

            container.appendChild(dateParagraph);
            container.appendChild(speciesParagraph);
            container.appendChild(expandSpan);

            // Add a click listener for loading the upload into the modal.
            expandSpan.addEventListener("click", () => { loadUploadIntoModal(upload, container); });

            // Show the uploads.
            hideLoadingImageAndShowContent(container, innerContainer);
        }
    })();

    // Hides the loading image.
    function hideLoadingImageAndShowContent(elementToShow, parentElement) {
        // Get the loading icon, make it disappear :o
        loadingImage.style.opacity = 0;

        setTimeout(() => {
            loadingImage.style.display = "none";
            parentElement.style.display = "";
            parentElement.appendChild(elementToShow);
        }, 750);
    }

    // Click listener to close the modal.
    dataUploadModal.querySelector(".close").addEventListener("click", () => {
        dataUploadModal.style.display = "none";
    });

    // Loads an upload into the upload viewing/editing/deleting modal.
    function loadUploadIntoModal(upload, container) {
        currentUpload = upload;
        currentUploadElement = container;

        // Show all the elements.
        uploadInformationTableContainer.style.display = "";
        speciesInformationTableContainer.style.display = "";
        uploadInformationHeader.style.display = "";
        speciesInformationHeader.style.display = "";

        let uploadInformationBody = uploadInformationTable.querySelector("tbody");
        let speciesInformationBody = speciesInformationTable.querySelector("tbody");

        // Remove any existing upload information.
        let uploadInformationChildren = uploadInformationBody.querySelectorAll("tr");
        for (let i = 0; i < uploadInformationChildren.length; i++) {
            uploadInformationChildren[i].remove();
        }

        let speciesInformationChildren = speciesInformationBody.querySelectorAll("tr");
        for (let i = 0; i < speciesInformationChildren.length; i++) {
            speciesInformationChildren[i].remove();
        }

        // First, create the upload information table rows.
        let taxonomicGroup = upload.taxonomicGroup.groupName;
        let location = upload.location.locationName;
        let methodology = upload.methodology ? upload.methodology.methodologyName : "No Methodology";
        let observers = upload.observers;

        let taxonomicGroupRow = getUploadInformationRow("<b>Taxonomic Group:</b>", taxonomicGroup);
        let locationRow = getUploadInformationRow("<b>Recorded At:</b>", location);
        let methodologyRow = getUploadInformationRow("<b>Methodology Used:</b>", methodology);
        let observersRow = getUploadInformationRow("<b>Seen By:</b>", observers);

        uploadInformationBody.appendChild(taxonomicGroupRow);
        uploadInformationBody.appendChild(locationRow);
        uploadInformationBody.appendChild(methodologyRow);
        uploadInformationBody.appendChild(observersRow);

        // Then, create the species information table rows.
        let index = 0;
        for (let speciesInfo of upload.species) {
            speciesInformationBody.appendChild(getSpeciesInformationRow(speciesInfo, index));
            index++;
        }

        // Cancel any existing close timeout, and open the modal.
        if (closeTimeoutID) {
            clearTimeout(closeTimeoutID);
            closeTimeoutID = null;
        }

        dataUploadModal.style.display = "block";
    }

    // Returns an upload information table row with the given name and data.
    function getUploadInformationRow(name, data) {
        let tableRow = document.createElement("tr");

        let nameData = document.createElement("td");
        let dataData = document.createElement("td");

        nameData.innerHTML = name;
        dataData.innerHTML = data;

        tableRow.appendChild(nameData);
        tableRow.appendChild(dataData);

        return tableRow;
    }

    // Returns a species information table row for the given species.
    function getSpeciesInformationRow(species, rowIndex) {
        let tableRow = document.createElement("tr");

        let latinNameData = document.createElement("td");
        let commonNameData = document.createElement("td");
        let countData = document.createElement("td");
        let gridReferenceData = document.createElement("td");
        let commentsData = document.createElement("td");
        let dateData = document.createElement("td");
        let actionsData = document.createElement("td");

        latinNameData.textContent = species.latinName;
        commonNameData.textContent = species.commonName;
        countData.textContent = species.count;
        gridReferenceData.textContent = species.gridReference;
        commentsData.textContent = species.comments;
        dateData.textContent = new Date(species.date).toDateString();
        actionsData.innerHTML = "<a href=\"#\" class=\"edit-button\">Edit</a> <a href=\"#\" class=\"remove-button\">Remove</a>"

        tableRow.appendChild(latinNameData);
        tableRow.appendChild(commonNameData);
        tableRow.appendChild(countData);
        tableRow.appendChild(gridReferenceData);
        tableRow.appendChild(commentsData);
        tableRow.appendChild(dateData);
        tableRow.appendChild(actionsData);

        // Add click event listeners to the edit/delete buttons to add the functionality.
        tableRow.querySelector(".edit-button").addEventListener("click", () => {
            loadSpeciesIntoModal(rowIndex);
        });

        tableRow.querySelector(".remove-button").addEventListener("click", () => {
            deleteSpeciesFromUpload(tableRow);
        });
        
        return tableRow;
    }

    //
    // DELETING UPLOAD FUNCTIONALITY
    //

    // Upload delete button.
    let uploadDeleteButton = document.getElementById("upload-delete-button");

    // Timeout ID for closing the window.
    let closeTimeoutID = null;

    // Add a click event listener to it, with a function that sends a request to delete the upload.
    uploadDeleteButton.addEventListener("click", deleteUpload);

    // Deletes an upload.
    async function deleteUpload() {
        let uploadID = currentUpload._id;
        let response;

        let body = {
            uploadID
        };

        try {
            response = await JSONRequest("/user/data-uploads", body, "DELETE");
        }
        catch (err) {
            displayFormError(dataUploadModal, "There was an error deleting the upload. Please try again later.");
            return;
        }

        if (response.error) {
            displayFormError(dataUploadModal, "There was an error deleting the upload. Please try again later.");
        }
        else {
            displayFormSuccess(dataUploadModal, "The upload has been successfully deleted. This window will now close.");

            // Hide the rest of the elements.
            uploadInformationTableContainer.style.display = "none";
            speciesInformationTableContainer.style.display = "none";
            uploadInformationHeader.style.display = "none";
            speciesInformationHeader.style.display = "none";

            // Remove the upload entry.
            currentUploadElement.remove();

            // Set a timeout to close the window.
            closeTimeoutID = setTimeout(() => {
                dataUploadModal.style.display = "none";
                closeTimeoutID = null;
            }, 5000);
        }
    }

    //
    // UPDATING UPLOAD FUNCTIONALITY
    //

    // Update upload button.
    let uploadUpdateButton = document.getElementById("upload-update-button");

    // Add a click listener with the function to send the request to update the upload.
    uploadUpdateButton.addEventListener("click", async() => {
        let response;
        let body = {
            uploadID: currentUpload._id,
            species: currentUpload.species
        };

        try {
            response = await JSONRequest("/user/data-uploads", body, "PUT");
        }
        catch (err) {
            displayFormError(dataUploadModal, "There was an error updating the upload. Please try again later.");
            return;
        }

        if (response.error) {
            displayFormError(dataUploadModal, "There was an error updating the upload. Please try again later.");
        }
        else {
            displayFormSuccess(dataUploadModal, "The upload has been successfully updated.");
        }

        // No need to update any elements, as it's already been done by editSpecies().
    });

    //
    // SPECIES DELETING FUNCTIONALITY
    //

    function deleteSpeciesFromUpload(speciesTableRow) {
        let latinName = speciesTableRow.querySelector("td").textContent;

        // If there is only one species in the upload, delete the upload.
        if (currentUpload.species.length === 1) {
            deleteUpload();
            return;
        }

        // Find the species in the current upload, remove it.
        for (let i = 0; i < currentUpload.species.length; i++) {
            let species = currentUpload.species[i];

            if (species.latinName === latinName) {
                currentUpload.species.splice(i, 1);
                break;
            }
        }

        // Remove the table row, display success message.
        speciesTableRow.remove();
        displayFormSuccess(dataUploadModal, "The species was removed from the upload. Please click 'Update Upload' to update the upload.");
    }

    //
    // SPECIES EDITING FUNCTIONALITY
    //

    // Current species index.
    let currentSpeciesIndex = null;

    // Elements
    let editSpeciesModal = document.getElementById("edit-species-modal");
    let editSpeciesForm = document.getElementById("edit-species-form");
    let editSpeciesSubmitButton = document.getElementById("edit-species-submit-button");
    
    // Form Inputs
    let dateInput = document.getElementById("date-input");
    let latinNameInput = document.getElementById("latin-name-input");
    let commonNameInput = document.getElementById("common-name-input");
    let countInput = document.getElementById("count-input");
    let gridReferenceInput = document.getElementById("grid-reference-input");
    let commentsInput = document.getElementById("comments-input");

    // Click listener to hide the modal, re-showing the data upload modal.
    editSpeciesModal.querySelector(".close").addEventListener("click", () => {
        dataUploadModal.style.display = "block";
        editSpeciesModal.style.display = "none";
    });

    // Loads a species into the editing modal.
    function loadSpeciesIntoModal(speciesIndex) {
        // Hide the data upload modal.
        dataUploadModal.style.display = "none";

        currentSpeciesIndex = speciesIndex;
        let species = currentUpload.species[speciesIndex];

        dateInput.valueAsDate = new Date(species.date);
        latinNameInput.value = species.latinName;
        commonNameInput.value = species.commonName;
        countInput.value = species.count;
        gridReferenceInput.value = species.gridReference;
        commentsInput.value = species.comments;

        // Show the modal.
        editSpeciesModal.style.display = "block";
    }

    // Add a click listener to the submit button to edit the species.
    editSpeciesSubmitButton.addEventListener("click", editSpecies);

    // Capitalises the first letter of a string.
    function capitaliseFirst(string) {
        return string.substring(0, 1).toUpperCase() + string.substring(1);
    }

    // Edits a species in an upload, updating the HTML too.
    function editSpecies() {
        // Validate the editing form.
        if (countInput.value === "" || dateInput.value === "" || latinNameInput.value === "") {
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

        // Make sure the species is not already in the upload.
        for (let i = 0; i < currentUpload.species.length; i++) {
            let species = currentUpload.species[i];

            if (species.latinName === speciesData.latinName && i !== currentSpeciesIndex) {
                displayFormError(editSpeciesForm, "Please do not add duplicate species, edit them instead.");
                return;
            }
        }

        // Update the species.
        currentUpload.species[currentSpeciesIndex] = speciesData;

        // Update the HTML, too.
        let tableRow = speciesInformationTable.querySelector("tbody").querySelectorAll("tr")[currentSpeciesIndex];

        let latinNameData = tableRow.querySelectorAll("td")[0];
        let commonNameData = tableRow.querySelectorAll("td")[1];
        let countData = tableRow.querySelectorAll("td")[2];
        let gridReferenceData = tableRow.querySelectorAll("td")[3];
        let commentsData = tableRow.querySelectorAll("td")[4];
        let dateData = tableRow.querySelectorAll("td")[5];

        latinNameData.textContent = speciesData.latinName;
        commonNameData.textContent = speciesData.commonName;
        countData.textContent = speciesData.count + "";
        gridReferenceData.textContent = speciesData.gridReference;
        commentsData.textContent = speciesData.comments;
        dateData.textContent = new Date(speciesData.date).toDateString();

        // Open the upload information modal, hide the edit species, show success message.
        dataUploadModal.style.display = "block";
        editSpeciesModal.style.display = "none";

        displayFormSuccess(dataUploadModal, "The species has been edited. Please click 'Update Upload' to update the upload.");
    }

})();