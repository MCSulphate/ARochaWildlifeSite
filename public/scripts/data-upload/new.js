// Matthew Lester NEA Project - new.js (Data Upload New Page Script)

// ESLint Warning Hiders
/* global message */
/* global changeVisibility */
/* global JSONRequest */
/* global validateType */
/* global validateTypes */
/* global validateLength */
/* global validateArrayTypes */
/* global validateArrayLengths */
/* global validateNumberSize */
/* global getErrorMessage */
/* global allValid */
/* global displayFormError */
/* global displayFormSuccess */

(() => {

    // Variables
    let lastGroupData = null;

    // Constants
    const FIELD_LIST = ["Species", "Number", "Gender", "Age", "Status", "Date", "Observers", "Comment"];
    const LOWER_CASE_LIST = ["species", "number", "gender", "age", "status", "date", "observers", "comment"];

    // Taxonomic Group Selection Elements
    let selectionForm = document.getElementById("group-select-form");
    let selectInput = document.getElementById("group-select-input");

    // Upload Form Elements
    let tableContainer = document.getElementById("table-container");
    let uploadForm = document.getElementById("upload-form");
    let newRowButton = document.getElementById("new-row-button");
    let uploadButton = document.getElementById("upload-button");
    let headerRow = uploadForm.querySelector("thead tr");
    let formBody = uploadForm.querySelector("tbody");
    let modal = document.querySelector(".modal");

    // Miscellaneous Elements
    let loadingMessage = document.getElementById("wait-message");
    let formGroupName = document.getElementById("upload-group-name");
    let formHeader = formGroupName.parentNode;

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

    // Validates group name.
    function validateGroupName(data) {
        return validateTypes(data, { name: String }).valid === true;
    }

    // Returns a radio input for gender.
    function getGenderInput(number) {
        let div = document.createElement("div");
        let label = document.createElement("label");
        let radio = document.createElement("input");
        radio.type = "radio";

        // Create the elements.
        let male = radio.cloneNode();
        let maleLabel = label.cloneNode();
        let maleContainer = div.cloneNode();
        let female = radio.cloneNode();
        let femaleLabel = label.cloneNode();
        let femaleContainer = div.cloneNode();

        male.value = "Male";
        maleLabel.textContent = "Male";
        female.value = "Female";
        femaleLabel.textContent = "Female";

        // Give the input a class so it's easier to find.
        div.className = "gender-input";

        // Add a number after the input name, otherwise the inputs won't work for more than one entry.
        male.name = "gender" + number;
        female.name = "gender" + number;

        // Append elements where they need to be.
        maleContainer.appendChild(male);
        maleContainer.appendChild(maleLabel);
        femaleContainer.appendChild(female);
        femaleContainer.appendChild(femaleLabel);

        div.appendChild(maleContainer);
        div.appendChild(femaleContainer);

        return div;
    }

    // Returns a <select> element with the given fields and class.
    function getSelectElement(fields, className) {
        let select = document.createElement("select");
        let option = document.createElement("option");

        // Add a default dummy field, so they can clear their choice.
        let dummyOption = option.cloneNode();
        dummyOption.textContent = "";
        select.appendChild(dummyOption);

        // Add the fields.
        fields.forEach(field => {
            let fieldOption = option.cloneNode();
            fieldOption.textContent = field;
            fieldOption.value = field;
            select.appendChild(fieldOption);
        });

        // Set a class name for easy finding.
        select.className = className;
        return select;
    }

    // Returns an input with the given type, class and attributes.
    function getInput(type, className, attributes) {
        let input = document.createElement("input");
        input.type = type;
        input.className = className;

        // Set the attributes.
        Object.keys(attributes).forEach(key => {
            input[key] = attributes[key];
        });

        return input;
    }

    // Gets a valid date string for today.
    function getDateString() {
        let date = new Date();
        let day = date.getDate();
        let month = date.getMonth();
        let year = date.getFullYear();

        return `${day}/${month}/${year}`;
    }

    // Loads an upload form for a given taxonomic group.
    function loadUploadForm(groupData) {
        let groupName = groupData.name;
        let optionalFields = groupData.optionalFields;
        let invalidFields = groupData.invalidFields;
        let statuses = groupData.statuses;

        // Create a new table row for the inputs.
        let tableRow = document.createElement("tr");

        // Create the headers, and the first row of fields.
        FIELD_LIST.forEach(field => {

            // Check if the field is not invalid.
            if (invalidFields.indexOf(field) === -1) {

                let header = document.createElement("th");
                let headerText = document.createTextNode(field);
                header.appendChild(headerText);

                // Check if it is not optional, if so add a 'required' star.
                if (optionalFields.indexOf(field) === -1) {
                    let requiredSpan = document.createElement("span");
                    requiredSpan.className = "required";
                    requiredSpan.textContent = "*";

                    header.appendChild(requiredSpan);
                }

                // Append the header.
                headerRow.appendChild(header);

                // Get the correct field input.
                let fieldInput;
                switch (field) {
                    case "Species":
                        fieldInput = getInput("text", "species-input", {
                            minlength: "3",
                            maxlength: "50",
                            placeholder: "Species Name"
                        });
                        break;

                    case "Number":
                        fieldInput = getInput("number", "number-input", {
                            min: 1,
                            max: 10000,
                            placeholder: "Number Seen"
                        });
                        break;

                    case "Gender":
                        fieldInput = getGenderInput(1); // Will always be the first.
                        break;

                    case "Age":
                        fieldInput = getSelectElement(["Juvenile / Young", "Mature / Full-Grown"], "age-input");
                        break;

                    case "Status":
                        fieldInput = getSelectElement(statuses, "status-input");
                        break;

                    case "Date":
                        fieldInput = getInput("date", "date-input", {
                            value: getDateString()
                        });
                        break;

                    case "Observers":
                        fieldInput = getInput("text", "observers-input", {
                            minlength: "3",
                            maxlength: "500",
                            placeholder: "Separate with commas."
                        });
                        break;

                    case "Comment":
                        fieldInput = getInput("text", "comment-input", {
                            minlength: "3",
                            maxlength: "500",
                            placeholder: "Grid Reference, etc."
                        });
                        break;

                    default:
                        fieldInput = getInput("text", "failed-input", {
                            disabled: "disabled",
                            placeholder: "FAILED TO CREATE INPUT"
                        });
                }

                // Create a <td> element and append the input.
                let tableData = document.createElement("td");
                tableData.appendChild(fieldInput);

                // Finally, append it to the new row.
                tableRow.appendChild(tableData);

            }

        });

        // Append the row to the table.
        formBody.appendChild(tableRow);

        // Show the correct header.
        formGroupName.textContent = groupName;
        changeVisibility(formHeader, true);

        // Show the upload form.
        changeVisibility(tableContainer, true);

    }

    // Adds a new row to the form.
    function addNewRow() {
        // Get the first row to compare against.
        // We cannot clone it as it messes up radio controls.
        let firstRow = formBody.querySelector("tr");
        let newRow = document.createElement("tr");

        // Calculate the total number of radio inputs.
        let radios = formBody.querySelectorAll("input[type=\"radio\"]").length / 2;

        // Loop through the td elements.
        let tds = firstRow.getElementsByTagName("td");
        for (let i = 0; i < tds.length; i++) {

            let td = tds[i];
            let tdToAdd;

            // If the td has a gender input in it, create a new one.
            if (td.querySelector(".gender-input")) {
                tdToAdd = document.createElement("td");
                tdToAdd.appendChild(getGenderInput(radios + 1));
            }
            else {
                // Else just clone it.
                tdToAdd = td.cloneNode(true);

                // Clear the input or select.
                let input = tdToAdd.querySelector("input");
                if (input) {
                    input.value = "";
                }
                else {
                    tdToAdd.querySelector("select").value = "";
                }
            }

            // Append the td element.
            newRow.appendChild(tdToAdd);

        }

        // Add the new row.
        formBody.appendChild(newRow);
    }

    // Removes the current form.
    function removeCurrentForm() {
        let headers = headerRow.childNodes;
        let bodyContent = formBody.childNodes;

        // Hide table content.
        changeVisibility(tableContainer, false);
        formGroupName.textContent = "";

        // Remove table contents.
        for (let i = headers.length - 1; i > -1; i--) {
            headers[i].remove();
        }
        for (let i = bodyContent.length - 1; i > -1; i--) {
            bodyContent[i].remove();
        }
    }

    // Sends a request to get information about a taxonomic group.
    async function getTaxonomicGroup(event) {
        // Cancel submit.
        event.preventDefault();

        // Remove the current form.
        removeCurrentForm();

        let groupName = selectInput.value;
        let dataToSend = {
            name: groupName
        };

        // Validate the data.
        if (groupName === "") {
            showMessage("Please select a taxonomic group.");
        }
        else if (!validateGroupName(dataToSend)) {
            showMessage("Invalid group name.");
        }
        else {

            // Show the loading message.
            changeVisibility(loadingMessage, true);

            try {
                // Send the request.
                let body = await JSONRequest("/track/taxonomic-group", dataToSend);

                if (body.error) {
                    showMessage(body.error);
                }
                else {
                    // Load the upload form for the returned group.
                    loadUploadForm(body);
                    lastGroupData = body;
                }
            }
            catch (err) {
                showMessage(err.message, err);
            }

            // Hide the loading message.
            changeVisibility(loadingMessage, false);

        }
    }

    // Validates a row of form data.
    function validateRowData(data, rowNumber) {
        // Declare the results array up here, we have to dynamically check the fields.
        let resultsArray = [];

        // Some inputs have a set of values, so let's check that it's within those sets.
        let setError = false;
        let setErrorMessage;

        // Date types must also be validated differently.
        let dateError = false;
        let dateErrorMessage;

        // Sets
        let genderSet = ["Male", "Female"];
        let ageSet = ["Juvenile / Young", "Mature / Full-Grown"];
        let statusSet = lastGroupData.statuses;

        let dataKeys = Object.keys(data);
        dataKeys.forEach(key => {
            // If there is a set or date error, return straight away (because we are only storing one).
            if (setError || dateError) {
                return;
            }

            // If the value is undefined, just skip it (we've already checked if it's allowed to be empty).
            if (!data[key]) {
                return;
            }
            else if (data[key] instanceof Array && data[key].length === 0) {
                return;
            }

            switch (key) {

                case "species":
                    // Push validation results straight into the results array.
                    resultsArray.push(validateType(data[key], String, "Species"));
                    resultsArray.push(validateLength(data[key], 3, 50, "Species"));
                    break;

                case "number":
                    resultsArray.push(validateType(data[key], Number, "Number"));
                    resultsArray.push(validateNumberSize(data[key], 1, 10000, "Number"));
                    break;

                case "gender":
                    resultsArray.push(validateType(data[key], String, "Gender"));
                    if (genderSet.indexOf(data[key]) === -1) {
                        setError = true;
                        setErrorMessage = "Invalid value for Gender: " + data[key] + ".";
                    }
                    break;

                case "age":
                    resultsArray.push(validateType(data[key], String, "Age"));
                    if (ageSet.indexOf(data[key]) === -1) {
                        setError = true;
                        setErrorMessage = "Invalid value for Age: " + data[key] + ".";
                    }
                    break;

                case "status":
                    resultsArray.push(validateType(data[key], String, "Status"));
                    if (statusSet.indexOf(data[key]) === -1) {
                        setError = true;
                        setErrorMessage = "Invalid value for Status: " + data[key] + ".";
                    }
                    break;

                case "date":
                    resultsArray.push(validateType(data[key], String, "Date"));
                    let dateObject = new Date(data[key]);

                    // We can check if it's a valid date quite easily (note the ==, not ===):
                    if (dateObject == "Invalid Date") {
                        dateError = true;
                        dateErrorMessage = "Invalid date supplied, make sure you have given a real date.";
                    }
                    // Check if it's in the future...
                    else if (new Date(data[key]).getTime() > Date.now()) {
                        dateError = true;
                        dateErrorMessage = "You can't set a date in the future!";
                    }
                    break;

                case "observers":
                    resultsArray.push(validateArrayTypes(data[key], String, "Observer"));
                    resultsArray.push(validateArrayLengths(data[key], 3, 30, "Observer"));
                    break;

                case "comment":
                    resultsArray.push(validateType(data[key], String, "Comment"));
                    resultsArray.push(validateLength(data[key], 3, 500, "Comment"));
                    break;

                default:
                    console.log("Unexpected key while validating data: " + key);
                    return showMessage("Failed to parse upload data. Please check the console.");

            }

        });

        // Show an error message if necessary.
        let errorStart = `Error on row ${rowNumber}: `;

        if (setError) {
            showMessage(errorStart + setErrorMessage);
            return false;
        }
        else if (dateError) {
            showMessage(errorStart + dateErrorMessage);
            return false;
        }
        else if (allValid(resultsArray)) {
            return true;
        }
        else {
            showMessage(errorStart + getErrorMessage(resultsArray));
            return false;
        }
    }

    // // Shows the new species by adding a class to the matching names.
    // function showNewSpecies(newSpecies) {
    //     let speciesInputs = document.querySelectorAll(".species-input");

    //     newSpecies.forEach(species => {
    //         // Loop through each input, looking for the species.
    //         for (let i = 0; i < speciesInputs.length; i++) {
    //             let input = speciesInputs[i];

    //             if (input.value === species) {
    //                 input.classList.add("new-species");
    //             }
    //         }
    //     });
    // }

    // // Removes the 'new-species' class on an element if it exists.
    // function removeNewSpeciesClass(element) {
    //     element.classList.remove("new-species");
    // }

    // Sends a request to upload the data.
    async function uploadData() {
        // Deactivate the upload button.
        uploadButton.removeEventListener("click", uploadData);

        // Local function to reactivate the upload button if there is an error.
        function reactivateUploadButton() {
            uploadButton.addEventListener("click", uploadData);
        }

        // Upper-cases the first letter of a string.
        function upperCaseFirstLetter(string) {
            return string.charAt(0).toUpperCase() + string.slice(1);
        }

        // Create the object that will be uploaded.
        let dataUpload = {
            species: []
        };

        // Generate a (ordered) list of fields that are in this group.
        let fieldList = FIELD_LIST.filter(element => lastGroupData.invalidFields.indexOf(element) === -1);

        // Loop through each row of the table.
        let rows = formBody.getElementsByTagName("tr");
        for (let i = 0; i < rows.length; i++) {

            let row = rows[i];
            let tds = row.getElementsByTagName("td");

            // This is the object that will be pushed into the "species" array in the upload.
            let dataEntry = {};

            for (let j = 0; j < tds.length; j++) {

                let td = tds[j];
                let currentField = fieldList[j];
                // capitalised element!!!

                switch (currentField) {
                    case "Species":
                        let speciesValue = td.querySelector("input").value;
                        dataEntry["species"] = speciesValue || undefined; // we are setting UNCAPITALISED values (for DB model)
                        break;

                    case "Number":
                        let numberValue = td.querySelector("input").value;
                        dataEntry["number"] = isNaN(numberValue) ? undefined : (Number(numberValue) || undefined);
                        break;

                    case "Gender":
                        let genderInput = td.querySelector("input:checked");
                        let genderValue = genderInput ? genderInput.value : undefined;
                        dataEntry["gender"] = genderValue;
                        break;

                    case "Age":
                        let ageValue = td.querySelector("select").value;
                        dataEntry["age"] = ageValue || undefined;
                        break;

                    case "Status":
                        let statusValue = td.querySelector("select").value;
                        dataEntry["status"] = statusValue || undefined;
                        break;

                    case "Date":
                        let dateValue = td.querySelector("input").value;
                        dataEntry["date"] = dateValue || undefined;
                        break;

                    case "Observers":
                        let observersValue = td.querySelector("input").value || "";
                        let splitObservers = observersValue ? observersValue.split(",") : undefined;
                        dataEntry["observers"] = splitObservers;
                        break;

                    case "Comment":
                        let commentValue = td.querySelector("input").value || "";
                        dataEntry["comment"] = commentValue || undefined;
                        break;

                    default:
                        console.log(td);
                        console.log(currentField);
                        reactivateUploadButton();
                        return showMessage("Failed to parse upload data. Please check the console.");
                }

            }

            let errorStart = `Error on row ${i + 1}: `;
            let dataKeys = Object.keys(dataEntry);

            // Check if the entry has all of the required fields in it.
            let requiredFields = FIELD_LIST.filter(element => {
                return lastGroupData.invalidFields.indexOf(element) === -1 && lastGroupData.optionalFields.indexOf(element) === -1;
            });

            // This just checks that the keys are there, not the values!
            let requiredCheckFailed = false;
            requiredFields.forEach(field => {
                if (requiredCheckFailed) {
                    return;
                }

                if (dataKeys.indexOf(field.toLowerCase()) === -1) {
                    requiredCheckFailed = true;
                    // This should only happen if they modify the code somehow.
                    showMessage(errorStart + `The ${field} field is required. If you have not modified the table, please report this error to a system administrator.`);
                }
            });

            if (requiredCheckFailed) {
                reactivateUploadButton();
                return;
            }

            // Now check each value, if it's undefined, check if it is optional.
            // If not, cancel the upload and tell them why.
            let optionalCheckFailed = false;
            dataKeys.forEach(key => {
                if (optionalCheckFailed) {
                    return;
                }

                // This also acts as a 'required' field check, as it's making sure there are
                // no undefined values where they shouldn't be.
                if (!dataEntry[key]) {
                    if (lastGroupData.optionalFields.indexOf(upperCaseFirstLetter(key)) === -1) {
                        optionalCheckFailed = true;
                        showMessage(errorStart + `The ${key} field is not optional, please fill it in.`);
                    }
                    else {
                        // Remove the optional field, we don't want it in the upload, as it will mess with validation.
                        delete dataEntry[key];
                    }
                }
            });

            // Stop the upload if the check failed.
            if (optionalCheckFailed) {
                reactivateUploadButton();
                return;
            }

            // Check that the entry has none of the invalid fields in it.
            let invalidCheckFailed = false;
            dataKeys.forEach(key => {
                if (invalidCheckFailed) {
                    return;
                }

                if (lastGroupData.invalidFields.indexOf(upperCaseFirstLetter(key)) !== -1) {
                    invalidCheckFailed = true;
                    showMessage(errorStart + `The ${key} cannot be used with this taxonomic group. If you have not modified the table, please report this error to a system administrator.`);
                }
            });

            if (invalidCheckFailed) {
                reactivateUploadButton();
                return;
            }

            // Validate the row of data.
            if (!validateRowData(dataEntry, i + 1)) {
                reactivateUploadButton();
                return;
            }

            // This row is valid, push it.
            dataUpload.species.push(dataEntry);

        }

        // Add the taxonomic group name onto the upload.
        // These are validated server-side.
        dataUpload.taxonomicGroup = lastGroupData.name;

        try {
            let body = await JSONRequest(document.URL, dataUpload, "POST");

            if (body.error) {
                reactivateUploadButton();
                showMessage(body.error);
            }
            else {
                showMessage("Upload successful! Redirecting you in a few seconds.");

                setTimeout(() => {
                    document.location = "/";
                }, 5000);
            }
        }
        catch (err) {
            reactivateUploadButton();
            showMessage(err.message);
        }
    }

    // Event Listeners

    // Add click listener to hide error message.
    errorMessage.addEventListener("click", () => changeVisibility(errorMessage, false));

    // Add click listener to add a new row.
    newRowButton.addEventListener("click", addNewRow);

    // Add submit listener to selection form.
    selectionForm.addEventListener("submit", getTaxonomicGroup);

    // Add click listener to upload the data.
    uploadButton.addEventListener("click", uploadData);

})();
