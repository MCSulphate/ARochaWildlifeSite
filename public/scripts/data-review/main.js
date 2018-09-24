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

                /*nameList.sort((a, b) => {
                    if (a.toLowerCase() < b.toLowerCase()) return -1;
                    else if (a.toLowerCase() > b.toLowerCase()) return 1;
                    else return 0;
                });*/

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
            tableRow.className = "selected-species";
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

    // Sort Fields
    let sortTypeSelect = document.getElementById("sort-type-select");
    let sortMethodSelect = document.getElementById("sort-method-select");

    // Filter Fields
    let filterTypeSelect = document.getElementById("filter-type-select");
    let filterTextInput = document.getElementById("filter-text-input");

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

})();
