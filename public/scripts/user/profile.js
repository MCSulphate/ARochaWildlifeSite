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

    // Data Uploads
    let uploads;

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
            expandSpan.addEventListener("click", () => { loadUploadIntoModal(upload); });

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
    function loadUploadIntoModal(upload) {
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
        let methodology = upload.methodology.methodologyName;
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
        for (let speciesInfo of upload.species) {
            speciesInformationBody.appendChild(getSpeciesInformationRow(speciesInfo));
        }

        // Show the modal.
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
    function getSpeciesInformationRow(species) {
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
        actionsData.innerHTML = "<a href=\"#\" class=\"edit-button\">Edit</a> <a href=\"#\" class=\"delete-button\">Delete</a>"

        tableRow.appendChild(latinNameData);
        tableRow.appendChild(commonNameData);
        tableRow.appendChild(countData);
        tableRow.appendChild(gridReferenceData);
        tableRow.appendChild(commentsData);
        tableRow.appendChild(dateData);
        tableRow.appendChild(actionsData);
        
        return tableRow;
    }

})();