// Matthew Lester NEA Project - main.js (Data Review Main Page Scripts)

// ESLint Warning Hiders
/* global message */
/* global changeVisibility */

(() => {

    // Elements
    
    // Selection Elements
    let selectionForm = document.getElementById("selection-form");
    let siteAInput = document.getElementById("site-a-input");
    let siteBInput = document.getElementById("site-b-input");
    let fromDateInput = document.getElementById("from-date");
    let toDateInput = document.getElementById("to-date");
    
    // Sort Elements
    let sortInput = document.getElementById("sort-input");
    let sortButton = document.getElementById("sort-button");

    // Error Message
    let errorMessage = document.getElementById("error-message");
    let showMessage = message.bind(errorMessage);

    // Gets the species name from a checked box.
    function getSpeciesNameFromCheckbox(checkbox) {
        let row = checkbox.parentNode.parentNode;
        let speciesField = row.querySelector(".species-name");
        return speciesField.textContent;
    }

    // Redirects the user to the show page, rendering the requested data.
    function sendToShowPage(event) {
        // Prevent submission.
        event.preventDefault();

        // Get the input values from the inputs.
        let siteA = siteAInput.value;
        let siteB = siteBInput.value;
        let fromDate = new Date(fromDateInput.value);
        let toDate = new Date(toDateInput.value);

        let speciesElements = document.querySelectorAll("input:checked");
        // Check if there is less than or equal to 5 species.
        if (speciesElements.length > 5) {
            return showMessage("Please only select a maximum of 5 species.");
        }
        // Must be at least one.
        else if (speciesElements.length === 0) {
            return showMessage("Please select at least one species.");
        }

        // Generate the species string.
        let speciesNamesArray = [];
        for (let i = 0; i < speciesElements.length; i++) {
            speciesNamesArray.push(getSpeciesNameFromCheckbox(speciesElements[i]));
        }
        let speciesString = "species=" + encodeURIComponent(speciesNamesArray.join(","));

        // Check if the dates are valid.
        if (fromDate == "Invalid Date" || toDate == "Invalid Date") {
            return showMessage("Invalid dates, please make sure they are correct and try again.");
        }

        // Turn the dates into date strings.
        fromDate = fromDate.toDateString();
        toDate = toDate.toDateString();
        let dateComponent = "&fromDate=" + encodeURIComponent(fromDate) + "&toDate=" + encodeURIComponent(toDate);

        // Generate the final query string.
        let querystring;
        if (siteA == "") {
            // No sites selected - overall.
            querystring = speciesString + dateComponent;
        }
        else if (siteB == "") {
            // Only site A selected.
            let siteComponent = "&siteA=" + encodeURIComponent(siteA);
            querystring = speciesString + siteComponent + dateComponent;
        }
        else {
            // Two sites selected.
            let siteComponent = "&siteA=" + encodeURIComponent(siteA) + "&siteB=" + encodeURIComponent(siteB);
            querystring = speciesString + siteComponent + dateComponent;
        }

        // Redirect them to the show page.
        window.location = "./show?" + querystring;
        showMessage("Redirecting you to the show page...");
    }

    //
    // SORTING FUNCTIONS
    //

    // Merge sort an array with a given comparator function.
    function mergeSort(arr, comparator) {
        if (arr.length < 2) {
            return arr;
        }

        let middle = arr.length / 2;
        let left = arr.slice(0, middle);
        let right = arr.slice(middle, arr.length);

        return merge(mergeSort(left, comparator), mergeSort(right, comparator), comparator);
    }

    // Applies the merge to two arrays.
    function merge(left, right, comparator) {
        let result = [];

        while (left.length && right.length) {
            if (comparator(left[0], right[0])) {
                result.push(left.shift());
            }
            else {
                result.push(right.shift());
            }
        }

        while (left.length) {
            result.push(left.shift());
        }
        while (right.length) {
            result.push(right.shift());
        }

        return result;
    }
    
    // Returns the rows of the table.
    function getRows() {
        let speciesFields = document.querySelectorAll(".species-name");
        let rows = Array.from(speciesFields).map(e => e.parentNode);
        
        return rows;
    }
    
    // Removes all the rows, and appends new ones.
    function replaceRows(newRows) {
        let rows = getRows();
        
        // Remove the rows.
        for (let i = rows.length - 1; i >= 0; i--) {
            rows[i].remove();
        }
        
        // Add the new ones.
        let tbody = document.querySelector("tbody");
        for (let i = 0; i < newRows.length; i++) {
            tbody.appendChild(newRows[i]);
        }
    }
    
    // Sorts the rows by a comparator function, replacing the old ones.
    function sortAndReplaceRows(comparator) {
        // Get the rows of the table.
        let rows = getRows();
        
        // Merge sort them.
        let sortedRows = mergeSort(rows, comparator);
        
        // Set the contents of the table.
        replaceRows(sortedRows);
    }

    // Sorts the species alphabetically.
    function sortAlphabetically(ascending) {
        // The function that determines what is sorted where.
        return function(a, b) {
            let speciesA = a.querySelector(".species-name").textContent;
            let speciesB = b.querySelector(".species-name").textContent;
            
            if (ascending) {
                return speciesA < speciesB;
            }
            else {
                return speciesA > speciesB;
            }
        };
    }
    
    // Sorts the species by taxonomic group, then alphabetically.
    function sortByTaxonomicGroup() {
        return function(a, b) {
            let tGroupA = a.querySelector(".taxonomic-group").textContent;
            let tGroupB = b.querySelector(".taxonomic-group").textContent;
            let speciesA = a.querySelector(".species-name").textContent;
            let speciesB = b.querySelector(".species-name").textContent;
            
            // Check if same group.
            if (tGroupA !== tGroupB) {
                return tGroupA < tGroupB;
            }
            else {
                // Sort by species name.
                return speciesA < speciesB;
            }
        };
    }
    
    // Sorts the rows with a comparator selected from the input.
    function processSort() {
        let sortType = sortInput.value;
        let comparator;
        
        switch (sortType) {
            case "az-ascending": {
                comparator = sortAlphabetically(true);
                break;
            }
            case "az-descending": {
                comparator = sortAlphabetically(false);
                break;
            }
            case "taxonomic-group": {
                comparator = sortByTaxonomicGroup();
                break;
            }
            default: {
                showMessage("Failed to select a comparator.");
                return;
            }
        }
        
        // Sort the rows.
        sortAndReplaceRows(comparator);
    }

    // Add a submit listener to the selection form to send them to the show page.
    selectionForm.addEventListener("submit", event => sendToShowPage(event));
    
    // Add a click listener to the sort button, to sort the rows.
    sortButton.addEventListener("click", processSort);

    // Add a click listener to hide the error message.
    errorMessage.addEventListener("click", () => changeVisibility(errorMessage));

})();
