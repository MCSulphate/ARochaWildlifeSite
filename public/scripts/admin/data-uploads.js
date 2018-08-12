// ESLint Warning Hiders
/* global toggleVisibility */
/* global JSONRequest */
/* global message */
/* global addListenersToAll */

// Rest of the code in an anonymous function to prevent leaking variables/functions.
(() => {
    
    // Variables for the upload currently being edited.
    let currentlyEditedContainer = null;
    
    // Error Message
    let errorMessage = document.getElementById("error-message");
    let showMessage = message.bind(errorMessage);
    
    // Toggles whether the data is shown for a specific upload.
    function toggleData(event) {
        let button = event.target;
        let parent = button.parentNode.parentNode;
        let dataContainer = parent.querySelector(".upload-data-container");
        
        // Change button text.
        button.textContent = button.textContent === "Show Data" ? "Hide Data" : "Show Data";
        
        // Toggle the visibility.
        toggleVisibility(dataContainer);
    }
    
    // Hides an edit form for an upload.
    function hideEditForm() {
        if (!currentlyEditedContainer) {
            console.error("There is no edit form to hide.");
        }
        else {
            // TODO
        }
    }
    
    // Creates an edit form from an upload.
    function createEditForm(event) {
        let button = event.target;
        let buttonContainer = button.parentNode;
        let dataContainer = buttonContainer.querySelector(".upload-data-container");
        
        // TODO
        // 
    }
    
    // Submits a request to delete an upload.
    async function submitDeleteRequest(event) {
        let button = event.target;
        let parent = button.parentNode.parentNode;
        let infoContainer = parent.querySelector(".upload-info-container");
        
        let uploadID = infoContainer.querySelector(".upload-id").textContent;
        try {
            let body = await JSONRequest(document.URL, { id: uploadID }, "DELETE");
            if (body.error) {
                showMessage(body.error);
            }
            else {
                parent.remove();
                showMessage("Data upload successfully deleted.");
            }
        }
        catch (err) {
            showMessage(err.message);
        }
    }
    
    //
    // EVENT LISTENERS
    //
    
    // Toggle data buttons.
    let toggleButtons = document.getElementsByClassName("upload-show-button");
    addListenersToAll(toggleButtons, "click", toggleData);
    
    // Delete upload buttons.
    let deleteButtons = document.getElementsByClassName("delete-upload-button");
    addListenersToAll(deleteButtons, "click", submitDeleteRequest);
    
    // Toggle error message.
    errorMessage.addEventListener("click", () => { toggleVisibility(errorMessage); });
    
})();