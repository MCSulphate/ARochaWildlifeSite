(() => {

    // Run this function on page load, fetches species data from the server.
    (async () => {
        try {
            let body = await JSONRequest("/review/species-data", {});

            if (body.error) {
                let errorMessage = document.createElement("h2");
                errorMessage.className = "error-message";
                errorMessage.textContent = body.error;

                hideLoadingImageAndShowContent(errorMessage);
            }
            else {
                console.dir(body);
            }
        }
        catch (err) {
            console.error(err);
        }
    })();

    // The table container.
    let tableContainer = document.getElementById("table-container");

    // Hides the loading image.
    function hideLoadingImageAndShowContent(elementToShow) {
        // Get the loading icon, make it disappear :O
        let loadingImage = document.getElementById("loading-image");
        loadingImage.style.opacity = 0;

        setTimeout(() => {
            loadingImage.style.display = "none";
            tableContainer.appendChild(elementToShow);
        }, 750);
    }

})();
