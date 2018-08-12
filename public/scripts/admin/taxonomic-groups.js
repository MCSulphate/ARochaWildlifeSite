// Matthew Lester NEA Project - taxonomic-groups.js (Taxonomic Groups Page Script)

// ESLint Warning Hiders
/* global message */
/* global changeVisibility */
/* global JSONRequest */
/* global validateType */
/* global validateArrayTypes */
/* global validateArrayLengths */
/* global getErrorMessage */
/* global allValid */

(() => {

    // Variables
    let groupFormShowing = false;

    // Constants - These are the fields that can be optional or invalid.
    const OPTIONAL_FIELDS = ["Gender", "Observers", "Number", "Comment", "Status", "Age"];
    const INVALID_FIELDS = ["Gender", "Number", "Observers", "Age"];

    // Groups Table
    let groupsTable = document.querySelector("#taxonomic-groups-table tbody");

    // Form-Related Elements
    let newGroupForm = document.getElementById("new-group-form");
    let groupName = document.getElementById("group-name");
    let optionalFields = document.getElementById("optional-fields");
    let invalidFields = document.getElementById("invalid-fields");
    let statuses = document.getElementById("statuses");

    // Form Buttons
    let formToggleButton = document.getElementById("form-toggle-button");
    let newOptionalFieldButton = document.getElementById("new-optional-field-button");
    let newInvalidFieldButton = document.getElementById("new-invalid-field-button");
    let newStatusButton = document.getElementById("new-status-button");
    let formClearButton = document.getElementById("form-clear-button");
    let formSubmitButton = newGroupForm.querySelector("button");

    // Error Message
    let errorMessage = document.getElementById("error-message");
    let showMessage = message.bind(errorMessage);

    // Removes an HTMLCollection of elements.
    function removeElements(elements) {
        // Loop in reverse order, as it is a live list.
        for (let i = elements.length - 1; i > -1; i--) {
            elements[i].remove();
        }
    }

    // Clears the form.
    function clearForm() {
        groupName.value = "";

        // Get the inputs.
        let optionalSelects = optionalFields.getElementsByTagName("div");
        let invalidSelects = invalidFields.getElementsByTagName("div");
        let statusInputs = statuses.getElementsByTagName("div");

        // Remove all of the inputs.
        removeElements(optionalSelects);
        removeElements(invalidSelects);
        removeElements(statusInputs);

        formSubmitButton.textContent = "Create Group";
        groupName.disabled = "";
    }

    // Toggles the new group form.
    function toggleNewGroupForm() {
        if (groupFormShowing) {
            formToggleButton.textContent = "Add a new taxonomic group";
            changeVisibility(newGroupForm, false);
            groupFormShowing = false;
            clearForm();
        }
        else {
            formToggleButton.textContent = "Close Form";
            changeVisibility(newGroupForm, true, "inline-block");
            groupFormShowing = true;
            
            // Focus the group name input.
            groupName.focus();
        }
    }

    // Returns a <select> element with the given fields.
    function getSelectElement(fields, number, valueToSet) {
        let div = document.createElement("div");
        let select = document.createElement("select");
        let option = document.createElement("option");
        let text = document.createTextNode(number + ".");

        let dummyOption = option.cloneNode();
        dummyOption.textContent = "";
        select.appendChild(dummyOption);

        fields.forEach(field => {
            let fieldOption = option.cloneNode();
            fieldOption.textContent = field;
            fieldOption.value = field;
            select.appendChild(fieldOption);
        });

        if (valueToSet) {
            select.value = valueToSet;
        }

        // Put the number and select inside a span.
        div.appendChild(text);
        div.appendChild(select);
        return div;
    }

    // Adds a new select input to a given parent.
    function addSelectInput(fields, fieldType, parentElement, valueToSet) {
        let numberOfFields = parentElement.querySelectorAll("select").length;

        // Check the number of current fields against the maximum.
        if (numberOfFields === fields.length) {
            return showMessage("You have reached the maximum number of " + fieldType + " fields.");
        }

        let selectElement = getSelectElement(fields, numberOfFields + 1, valueToSet);

        let addButton = parentElement.querySelector("a");
        parentElement.insertBefore(selectElement, addButton);
    }

    // Adds a new optional field input.
    function addOptionalField(valueToSet) {
        addSelectInput(OPTIONAL_FIELDS, "optional", optionalFields, valueToSet);
    }

    // Adds a new invalid field input.
    function addInvalidField(valueToSet) {
        addSelectInput(INVALID_FIELDS, "invalid", invalidFields, valueToSet);
    }

    // Adds a new text input for a status.
    function addStatusInput(valueToSet) {
        let nextNumber = statuses.querySelectorAll("input").length + 1;
        let div = document.createElement("div");
        let text = document.createTextNode(nextNumber + ".");

        let input = document.createElement("input");
        input.type = "text";
        input.placeholder = "Status " + nextNumber;
        input.minlength = "2";
        input.maxlength = "30";

        div.appendChild(text);
        div.appendChild(input);

        if (valueToSet && typeof valueToSet === "string") {
            input.value = valueToSet;
        }

        let newButton = statuses.querySelector("a");
        statuses.insertBefore(div, newButton);
    }

    // Loads an update form and toggles it on if it's not showing.
    function loadUpdateForm(event) {
        clearForm();
        let editButton = event.target;
        let row = editButton.parentNode.parentNode;

        let tableName = row.querySelector(".table-group-name");
        let tableOptionalFields = row.querySelector(".table-optional-fields");
        let tableInvalidFields = row.querySelector(".table-invalid-fields");
        let tableStatuses = row.querySelector(".table-statuses");

        let optionalText = tableOptionalFields.textContent || "";
        let invalidText = tableInvalidFields.textContent || "";
        let statusText = tableStatuses.textContent || "";

        let optionalValues = optionalText.split(", ");
        let invalidValues = invalidText.split(", ");
        let statusValues = statusText.split(", ");

        groupName.value = tableName.textContent;
        optionalValues.forEach(value => addOptionalField(value));
        invalidValues.forEach(value => addInvalidField(value));
        statusValues.forEach(value => addStatusInput(value));

        formSubmitButton.textContent = "Update Group";
        groupName.disabled = "disabled";

        if (!groupFormShowing) {
            toggleNewGroupForm();
        }
    }

    // Returns an array with the values of a list of inputs.
    // If specified, values must be contained within validationList.
    // If specified, value must NOT be contained within exclusionList.
    function getInputValues(inputElements, validationList, exclusionList) {
        let returnArray = [];
        for (let i = 0; i < inputElements.length; i++) {
            let inputElement = inputElements[i];
            let inputValue = inputElement.value;

            if (inputValue !== "") {
                if (returnArray.indexOf(inputValue) !== -1) {
                    return showMessage("You cannot have duplicate fields.");
                }
                else if (validationList && validationList.indexOf(inputValue) === -1) {
                    return showMessage("You have given an invalid field name.");
                }
                else if (exclusionList && exclusionList.indexOf(inputValue) !== -1) {
                    return showMessage("You cannot have the same fields in optional and invalid.");
                }

                returnArray.push(inputValue);
            }
        }

        return returnArray;
    }

    // Validates the form inputs.
    function validateFormData(data) {
        let nameTypeValid = validateType(data.name, String, "Group Name");
        let nameLengthValid = validateArrayLengths([data.name], 3, 30, "Group Name");

        let optionalTypesValid = validateArrayTypes(data.optionalFields, String, "Optional Fields");
        let invalidTypesValid = validateArrayTypes(data.invalidFields, String, "Optional Fields");

        let statusTypesValid = validateArrayTypes(data.statuses, String, "Statuses");
        let statusLengthsValid = validateArrayLengths(data.statuses, 3, 30, "Statuses");

        let resultsArray = [nameTypeValid, nameLengthValid, optionalTypesValid, invalidTypesValid, statusTypesValid, statusLengthsValid];

        if (allValid(resultsArray)) {
            return true;
        }
        else {
            showMessage(getErrorMessage(resultsArray));
            return false;
        }
    }
    
    // Validates the delete data.
    function validateDeleteData(data) {
        let nameTypeValid = validateType(data.name, String, "Group Name");
        let nameLengthValid = validateArrayLengths([data.name], 3, 30, "Group Name");
        
        let resultsArray = [nameTypeValid, nameLengthValid];
        
        if (allValid(resultsArray)) {
            return true;
        }
        else {
            showMessage(getErrorMessage(resultsArray));
            return false;
        }
    }
    
    // Sends a request to delete a group.
    async function deleteGroup(event) {
        let editButton = event.target;
        let row = editButton.parentNode.parentNode;
        let tableName = row.querySelector(".table-group-name").textContent;
        
        let dataToSend = {
            name: tableName
        };
        
        if (!validateDeleteData(dataToSend)) {
            return;
        }
        
        try {
            let body = await JSONRequest(document.URL, dataToSend, "DELETE");
            
            if (body.error) {
                showMessage(body.error);
            }
            else {
                // Clear the form if the deleted group is being edited.
                if (tableName === groupName.value) {
                    clearForm();
                }
                
                showMessage("Group successfully deleted.");
                row.remove();
            }
        }
        catch (err) {
            showMessage(err.message, err);
        }
        
    }

    // Appends a new group to the table.
    function appendNewGroup(groupData) {
        let optionalString = groupData.optionalFields.join(", ");
        let invalidString = groupData.invalidFields.join(", ");
        let statusString = groupData.statuses.join(", ");

        let row = document.createElement("tr");
        let td = document.createElement("td");
        let button = document.createElement("button");

        let name = td.cloneNode();
        let optionalFields = td.cloneNode();
        let invalidFields = td.cloneNode();
        let statuses = td.cloneNode();
        let buttonContainer = td.cloneNode();

        let editButton = button.cloneNode();
        let deleteButton = button.cloneNode();

        name.className = "table-group-name";
        optionalFields.className = "table-optional-fields";
        invalidFields.className = "table-invalid-fields";
        statuses.className = "table-statuses";

        name.textContent = groupData.name;
        optionalFields.textContent = optionalString;
        invalidFields.textContent = invalidString;
        statuses.textContent = statusString;

        editButton.className = "group-edit-button";
        deleteButton.className = "group-delete-button";

        editButton.textContent = "Edit";
        deleteButton.textContent = "Delete";
        
        // Add edit/delete listeners.
        editButton.addEventListener("click", loadUpdateForm);
        deleteButton.addEventListener("click", deleteGroup);

        buttonContainer.appendChild(editButton);
        buttonContainer.appendChild(deleteButton);

        row.appendChild(name);
        row.appendChild(optionalFields);
        row.appendChild(invalidFields);
        row.appendChild(statuses);
        row.appendChild(buttonContainer);

        groupsTable.appendChild(row);
    }

    // Finds a row in the table from group name.
    function findGroup(groupName) {
        let rows = groupsTable.getElementsByTagName("tr");

        for (let i = 0; i < rows.length; i++) {
            let row = rows[i];
            let rowName = row.querySelector(".table-group-name").textContent;

            if (rowName === groupName) {
                return row;
            }
        }

        return null;
    }

    // Updates a group in the table.
    function updateGroup(groupData) {
        let name = groupData.name;
        let tableGroup = findGroup(name);

        if (!tableGroup) {
            return showMessage("Error updating group in the table, please refresh the page.");
        }

        let optionalString = groupData.optionalFields.join(", ");
        let invalidString = groupData.invalidFields.join(", ");
        let statusString = groupData.statuses.join(", ");

        let optionalFields = tableGroup.querySelector(".table-optional-fields");
        let invalidFields = tableGroup.querySelector(".table-invalid-fields");
        let statuses = tableGroup.querySelector(".table-statuses");

        optionalFields.textContent = optionalString;
        invalidFields.textContent = invalidString;
        statuses.textContent = statusString;
    }

    // Sends a request to create or update a taxonomic group.
    async function createOrUpdateGroup(event) {
        // Prevent form submission.
        event.preventDefault();

        // Elements
        let optionalFieldElements = optionalFields.getElementsByTagName("select");
        let invalidFieldElements = invalidFields.getElementsByTagName("select");
        let statusElements = statuses.getElementsByTagName("input");

        // Values
        let name = groupName.value;
        let optionalFieldValues = getInputValues(optionalFieldElements, OPTIONAL_FIELDS);
        let invalidFieldValues = getInputValues(invalidFieldElements, INVALID_FIELDS, optionalFieldValues); // Exclude optional field values.
        let statusValues = getInputValues(statusElements);

        let dataToSend = {
            name: name,
            optionalFields: optionalFieldValues,
            invalidFields: invalidFieldValues,
            statuses: statusValues
        };

        if (!validateFormData(dataToSend)) {
            return;
        }

        try {
            // Decide if it's an update.
            let isUpdate = formSubmitButton.textContent === "Update Group";
            let method = isUpdate ? "PUT" : "POST";

            let body = await JSONRequest(document.URL, dataToSend, method);

            if (body.error) {
                showMessage(body.error);
            }
            else {
                if (isUpdate) {
                    showMessage("Group successfully updated.");
                    updateGroup(dataToSend);
                }
                else {
                    showMessage("Group successfully created.");
                    appendNewGroup(dataToSend);
                }
            }
            
            // Clear the form.
            clearForm();
        }
        catch (err) {
            showMessage(err.message, err);
        }
    }

    // Event Listeners
    // Add a click listener to toggle the form.
    formToggleButton.addEventListener("click", toggleNewGroupForm);

    // Add a click listener to clear the form.
    formClearButton.addEventListener("click", clearForm);

    // Add a click listener to the new optional field button.
    newOptionalFieldButton.addEventListener("click", addOptionalField);

    // Add a click listener to the new invalid field button.
    newInvalidFieldButton.addEventListener("click", addInvalidField);

    // Add a click listener to the new status button.
    newStatusButton.addEventListener("click", addStatusInput);

    // Add a click listener to hide the error message.
    errorMessage.addEventListener("click", () => changeVisibility(errorMessage, false));

    // Add a submit listener on the form to create a new group.
    newGroupForm.addEventListener("submit", createOrUpdateGroup);

    // Add click listeners to the current edit buttons.
    let editButtons = groupsTable.getElementsByClassName("group-edit-button");
    for (let i = 0; i < editButtons.length; i++) {
        editButtons[i].addEventListener("click", loadUpdateForm);
    }
    
    // Add click listeners to the current delete buttons.
    let deleteButtons = groupsTable.getElementsByClassName("group-delete-button");
    for (let i = 0; i < deleteButtons.length; i++) {
        deleteButtons[i].addEventListener("click", deleteGroup);
    }

})();
