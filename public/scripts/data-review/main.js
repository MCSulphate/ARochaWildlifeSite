(() => {
    
    //
    // TABLE GENERATION AND SUBMISSION FUNCTIONALITY
    //

    // The table containing the species.
    let speciesTable = document.getElementById("species-table");

    // The table container.
    let tableContainer = document.getElementById("table-container");

    // The species data that will be received.
    let species;

    // Run this function on page load, fetches species data from the server.
    (async () => {
        try {
            let body = await JSONRequest("/review/species-data", {});

            if (body.error) {
                let errorMessage = document.createElement("h2");
                errorMessage.className = "error-message";
                errorMessage.textContent = body.error;

                hideLoadingImageAndShowContent(errorMessage, tableContainer);
            }
            else {
                // The data has arrived! Let's construct a table with it.
                species = body.species;

                // Sort the data alphabetically. First, we need a list of the names.
                let nameList = Object.keys(species);

                nameList.sort((a, b) => {
                    if (a.toLowerCase() < b.toLowerCase()) return -1;
                    else if (a.toLowerCase() > b.toLowerCase()) return 1;
                    else return 0;
                });

                // The table body to add to the table.
                let tableBody = document.createElement("tbody");

                for (let latinName of nameList) {
                    // Get species data.
                    let speciesData = species[latinName];

                    // Create needed elements.
                    let tableRow = document.createElement("tr");
                    let latinNameData = document.createElement("td");
                    let commonNameData = document.createElement("td");
                    let taxonomicGroupData = document.createElement("td");
                    let locationsData = document.createElement("td");

                    // Container for higlighted fields.
                    let highlightContainer = document.createElement("div");
                    highlightContainer.className = "table-highlight";

                    // Set the text content of each.
                    highlightContainer.textContent = latinName;
                    commonNameData.textContent = speciesData.commonName;
                    taxonomicGroupData.textContent = speciesData.taxonomicGroup;
                    locationsData.textContent = speciesData.locations.join(", ");

                    // Append the elements to the row.
                    latinNameData.appendChild(highlightContainer);
                    tableRow.appendChild(latinNameData);
                    tableRow.appendChild(commonNameData);
                    tableRow.appendChild(taxonomicGroupData);
                    tableRow.appendChild(locationsData);

                    // Add a click listener to the row to toggle species selection.
                    tableRow.addEventListener("click", () => {
                        toggleSpeciesSelection(tableRow);
                    });

                    // Append the row to the table.
                    tableBody.appendChild(tableRow);
                }

                // Hide the loading image and show the table!
                hideLoadingImageAndShowContent(tableBody, speciesTable);
            }
        }
        catch (err) {
            let errorMessage = document.createElement("h2");
            errorMessage.className = "error-message";
            errorMessage.textContent = "There was an error loading this page. Please report this to a system administrator.";

            hideLoadingImageAndShowContent(errorMessage, tableContainer);
            console.error(err);
        }
    })();

    // Adds a species to the selected list.
    let selectedSpecies = [];
    function toggleSpeciesSelection(tableRow) {
        let latinName = tableRow.querySelectorAll("td")[0].textContent;

        if (selectedSpecies.indexOf(latinName) === -1) {
            selectedSpecies.push(latinName);
            tableRow.className = "selected-row";
        }
        else {
            selectedSpecies.splice(selectedSpecies.indexOf(latinName), 1);
            tableRow.className = "";
        }
    }

    // Hides the loading image.
    function hideLoadingImageAndShowContent(elementToShow, parentElement) {
        // Get the loading icon, make it disappear :o
        let loadingImage = document.getElementById("loading-image");
        loadingImage.style.opacity = 0;

        setTimeout(() => {
            loadingImage.style.display = "none";
            parentElement.style.display = "";
            parentElement.appendChild(elementToShow);
        }, 750);
    }

    //
    // FILTER AND SORT FUNCTIONALITY
    //

    // Buttons
    let sortButton = document.getElementById("sort-button");
    let filterButton = document.getElementById("filter-button");
    let filterClearButton = document.getElementById("filter-clear-button");

    // Sort Fields
    let sortTypeSelect = document.getElementById("sort-type-select");
    let sortMethodSelect = document.getElementById("sort-method-select");

    // Sorting Handler
    sortButton.addEventListener("click", () => {
        let sortType = sortTypeSelect.value;
        let sortMethod = sortMethodSelect.value;
        let tableRows = document.querySelector("#species-table").querySelector("tbody").querySelectorAll("tr");
        let newTableBody = document.createElement("tbody");

        // Convert the NodeList into an Array.
        tableRows = Array.prototype.slice.call(tableRows, 0);

        // Ignore the click if they haven't selected things.
        if (!sortType || !sortMethod) return;
        let isAZ = sortMethod === "az";
        let typeIndex = sortType === "latinName" ? 0 : sortType === "commonName" ? 1 : 2;

        function compare(a, b) {
            if (a.toLowerCase() < b.toLowerCase()) {
                if (isAZ) return -1;
                else return 1;
            }
            else if (a.toLowerCase() > b.toLowerCase()) {
                if (isAZ) return 1;
                else return -1
            }
            else return null;
        }

        // Sort the rows.
        tableRows.sort((a, b) => {
            let typeA = a.querySelectorAll("td")[typeIndex].textContent;
            let typeB = b.querySelectorAll("td")[typeIndex].textContent;

            let result = compare(typeA, typeB);

            if (result === null && typeIndex !== 0) {
                let latinNameA = a.querySelectorAll("td")[0].textContent;
                let latinNameB = b.querySelectorAll("td")[0].textContent;

                result = compare(latinNameA, latinNameB);
            }
            else if (result === null) result = 1;

            return result;
        });

        // Clone the rows into a new table.
        for (let row of tableRows) {
            let clonedRow = row.cloneNode(true);

            // Add a click listener to the row to toggle species selection.
            clonedRow.addEventListener("click", () => {
                toggleSpeciesSelection(clonedRow);
            });

            newTableBody.appendChild(clonedRow);
        }

        // Remove the current table, add the new one.
        document.querySelector("#species-table").querySelector("tbody").remove();
        speciesTable.appendChild(newTableBody);
    });

    // Filter Fields
    let filterTypeSelect = document.getElementById("filter-type-select");
    let filterTextInput = document.getElementById("filter-text-input");

    // Filtering Handler
    filterButton.addEventListener("click", () => {
        let filterType = filterTypeSelect.value;
        let filterText = filterTextInput.value;
        let tableRows = document.querySelector("#species-table").querySelector("tbody").querySelectorAll("tr");

        // Make sure they filled in the fields.
        if (!filterType || !filterText) return;
        filterText = filterText.toLowerCase();

        // Filter the rows.
        for (let i = 0; i < tableRows.length; i++) {
            let latinName = tableRows[i].querySelector("td").textContent;
            let speciesData = species[latinName];
            let filterData = speciesData[filterType];
            let containsFlag = false;

            if (typeof filterData === "string") {
                if (filterData.toLowerCase().indexOf(filterText) !== -1) containsFlag = true;
            }
            else {
                for (let str of filterData) {
                    if (str.toLowerCase().indexOf(filterText) !== -1) containsFlag = true;
                }
            }

            // If it does not contain the filter, hide it.
            if (!containsFlag) {
                tableRows[i].style.display = "none";
            }
        }
    });

    // Clears filtering on species.
    filterClearButton.addEventListener("click", () => {
        let tableRows = document.querySelector("#species-table").querySelector("tbody").querySelectorAll("tr");

        for (let i = 0; i < tableRows.length; i++) {
            tableRows[i].style.display = "";
        }
    });

    //
    // MODAL FUNCTIONALITY CODE
    //

    // Modal
    let locationsModal = document.getElementById("locations-modal");

    // Causes the modal to pop up.
    document.getElementById("species-submit-button").addEventListener("click", event => {
        // Don't do anything if they haven't selected any species.
        if (selectedSpecies.length === 0) return;
        // We don't want to compare more than 20 species at a time.
        else if (selectedSpecies.length > 20) return;
        
        locationsModal.style.display = "block";
    });

    // Closes the modal.
    locationsModal.querySelector(".close").addEventListener("click", event => {
        locationsModal.style.display = "none";
    });

    // Elements
    let locationsTable = document.getElementById("locations-table");
    let locationsTableBody = locationsTable.querySelector("tbody");

    // Selected Locations
    let selectedLocations = [];
    function toggleLocationSelection(tableRow) {
        let locationName = tableRow.querySelector("td").textContent;

        if (selectedLocations.indexOf(locationName) === -1) {
            selectedLocations.push(locationName);
            tableRow.className = "selected-row";
        }
        else {
            selectedLocations.splice(selectedLocations.indexOf(locationName), 1);
            tableRow.className = "";
        }
    }

    // Fetches location data from the server.
    (async() => {
        try {
            let body = await JSONRequest("/review/locations-data", {});

            if (body.error) {
                let errorMessage = document.createElement("h2");
                errorMessage.class = "error-message";
                errorMessage.textContent = body.error;
    
                locationsTableBody.appendChild(errorMessage);
            }
            else {
                let locations = body.locations;
                for (let location of locations) {
                    let tableRow = document.createElement("tr");
                    let tableData = document.createElement("td");

                    tableData.colSpan = 4;
                    tableData.textContent = location;
                    tableRow.appendChild(tableData);
                    locationsTableBody.appendChild(tableRow);

                    // Add a click listener to the row to toggle selection.
                    tableRow.addEventListener("click", () => {
                        toggleLocationSelection(tableRow);
                    });
                }
            }
        }
        catch (err) {
            let errorMessage = document.createElement("h2");
            errorMessage.class = "error-message";
            errorMessage.textContent = "There was an error loading this page. Please report this to a system administrator.";

            tbody.appendChild(errorMessage);
        }
    })();

    //
    // CHART CREATION CODE
    //

    // Container for the detailed species data.
    let detailedSpecies;

    // Elements
    let fromDateInput = document.getElementById("from-date");
    let toDateInput = document.getElementById("to-date");

    // Click listener for the locations submit button:
    // Fetches detailed data for each species from the server.
    document.getElementById("locations-submit-button").addEventListener("click", async() => {
        try {
            let dataToSend = {
                latinNames: selectedSpecies,
                locationNames: selectedLocations,
                fromDate: fromDateInput.value ? new Date(fromDateInput.value) : null,
                toDate: toDateInput.value ? new Date(toDateInput.value) : null
            };

            // If there is a from-date and no to-date, set it to today.
            if (dataToSend.fromDate && !dataToSend.toDate) {
                dataToSend.toDate = new Date();
            }

            // Check that the to-date is more recent than the from date.
            if (dataToSend.fromDate && dataToSend.toDate && dataToSend.fromDate.getTime() > dataToSend.toDate.getTime()) {
                displayFormError(locationsModal, "Please select a to-date that is after the from-date.");
                return;
            }

            detailedSpecies = await JSONRequest("/review/detailed-species-data", dataToSend);
            createCharts();
        }
        catch (err) {
            displayFormError(locationsModal, "Failed to fetch species data. Please report this to an admin.");
            console.log(err.message);
        }
    });

    // Creates the charts and opens them in a new modal.
    function createCharts() {
        displayFormSuccess(locationsModal, detailedSpecies.message);
    }

})();
