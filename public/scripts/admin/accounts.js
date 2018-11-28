(() => {

    // Modals
    let newUserModal = document.getElementById("new-user-modal");
    let editUserModal = document.getElementById("edit-user-modal");

    // Functions to show modals.
    function showNewUserModal() {
        newUserModal.style.display = "block";
    }

    function showEditUserModal() {
        editUserModal.style.display = "block";
    }

    // Functions to hide the modals.
    function hideNewUserModal() {
        newUserModal.style.display = "none";
    }

    function hideEditUserModal() {
        editUserModal.style.display = "none";
    }

    //
    // Functions to load the new user / edit user forms.
    //

    // Inputs
    let newUsernameInput = document.getElementById("new-username-input");
    let newPasswordInput = document.getElementById("new-password-input");

    let editUsernameInput = document.getElementById("edit-username-input");
    let editPasswordInput = document.getElementById("edit-password-input");

    // Buttons
    let newUserButton = document.getElementById("new-user-button");
    let editButtons = document.querySelectorAll(".edit-button");

    // Functions
    function loadNewUserModal() {
        // Reset previous values.
        newUsernameInput.value = "";
        newPasswordInput.value = "";

        // Open the modal.
        showNewUserModal();
    }

    function loadEditUserModal(event) {
        // Get the selected username for the user to edit.
        let target = event.target;
        let usernameData = target.parentNode.parentNode.querySelector(".username-data");
        let username = usernameData.textContent;

        // Reset previous password value.
        editPasswordInput.value = "";

        // Set the username field, not password.
        editUsernameInput.value = username;

        // Open the modal.
        showEditUserModal();
    }

    // Click event listeners.
    newUserButton.addEventListener("click", loadNewUserModal);
    newUserModal.querySelector(".close").addEventListener("click", hideNewUserModal);
    editUserModal.querySelector(".close").addEventListener("click", hideEditUserModal);

    for (let i = 0; i < editButtons.length; i++) {
        editButtons[i].addEventListener("click", loadEditUserModal);
    }

    //
    // Functions to Submit New / Edit / Delete User Data to the Server
    //

    // Buttons.
    let deleteButtons = document.querySelectorAll(".delete-button");
    let newUserSubmitButton = document.getElementById("new-user-submit-button");
    let editUserSubmitButton = document.getElementById("edit-user-submit-button");

    // Form elements.
    let newUserForm = document.getElementById("new-user-form");
    let editUserForm = document.getElementById("edit-user-form");

    // Function to submit delete data to the server.
    async function deleteUser(event) {
        // Get the username of the user to delete.
        let target = event.target;
        let usernameData = target.parentNode.parentNode.querySelector(".username-data");
        let username = usernameData.textContent;

        // Data to send to the server.
        let data = {
            username
        };

        // Send the request.
        let response = await JSONRequest("/admin/accounts", data, "DELETE");

        // Get the delete messages container.
        let deleteMessagesContainer = document.getElementById("delete-messages-container");

        // Catch errors, or display success message.
        if (response.error) {
            // Display the error message.
            displayFormError(deleteMessagesContainer, response.error);
        }
        else {
            // Remove the table row.
            target.parentNode.parentNode.remove();
        }
    }

    // Function to submit new user data to the server.
    async function createNewUser() {
        // Get the username and password data.
        let username = newUsernameInput.value;
        let password = newPasswordInput.value;

        // Perform simple data validation.
        if (username.length < 3 || username.length > 100) {
            displayFormError(newUserForm, "Username must be between 3 and 100 characters in length.");
            return;
        }
        else if (password.length < 8 || password.length > 200) {
            displayFormError(newUserForm, "Password must be between 8 and 200 characters in length.");
            return;
        }

        // Data to send to the server.
        let data = {
            username,
            password
        };

        // Send the request.
        let response = await JSONRequest("/admin/accounts", data);

        // Error handling / success message.
        if (response.error) {
            displayFormError(newUserForm, response.error);
        }
        else {
            displayFormSuccess(newUserForm, "Successfully created the user.");

            // Reset the values, user created.
            newUsernameInput.value = "";
            newPasswordInput.value = "";

            // Add the user to a new row in the table.
            let tableBody = document.querySelector("tbody");

            let row = document.createElement("tr");
            let usernameData = document.createElement("td");
            let lastLogin = document.createElement("td");
            let buttonContainer = document.createElement("td");
            let editButton = document.createElement("a");
            let deleteButton = document.createElement("a");

            usernameData.className = "username-data";
            editButton.className = "edit-button";
            deleteButton.className = "delete-button";

            usernameData.textContent = username;
            lastLogin.textContent = "Unknown";
            editButton.textContent = "Edit";
            deleteButton.textContent = "Delete";

            buttonContainer.appendChild(editButton);
            buttonContainer.appendChild(deleteButton);

            row.appendChild(usernameData);
            row.appendChild(lastLogin);
            row.appendChild(buttonContainer);

            editButton.addEventListener("click", loadEditUserModal);
            deleteButton.addEventListener("click", deleteUser);

            tableBody.appendChild(row);
        }
    }

    // Function to edit a user.
    async function submitEditForm() {
        // Get the username and password data.
        let username = editUsernameInput.value;
        let password = editPasswordInput.value;

        // Perform simple data validation.
        if (password.length < 8 || password.length > 200) {
            displayFormError(editUserForm, "Password must be between 8 and 200 characters in length.");
            return;
        }

        // Data to send to the server.
        let data = {
            username,
            password
        };

        // Send the request.
        let response = await JSONRequest("/admin/accounts", data, "PUT");

        // Error handling / success message.
        if (response.error) {
            displayFormError(editUserForm, response.error);
        }
        else {
            displayFormSuccess(editUserForm, "Successfully updated the user.");

            // Reset the values, user created.
            editUsernameInput.value = "";
            editPasswordInput.value = "";
        }
    }

    // Click listeners.
    newUserSubmitButton.addEventListener("click", createNewUser);
    editUserSubmitButton.addEventListener("click", submitEditForm);

    for (let i = 0; i < deleteButtons.length; i++) {
        deleteButtons[i].addEventListener("click", deleteUser);
    }

})();