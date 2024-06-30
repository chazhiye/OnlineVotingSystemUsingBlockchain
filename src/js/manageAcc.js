document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('addUserButton')) {
    loadApplicants();
    loadUsers();

    document.getElementById('addUserButton').addEventListener('click', () => showSection('addUserSection'));
    document.getElementById('applicantsButton').addEventListener('click', () => showSection('applicantsSection'));
    document.getElementById('allUsersButton').addEventListener('click', () => showSection('allUsersSection'));
    document.getElementById('searchInput').addEventListener('input', searchTable);

    const addUserForm = document.getElementById('addUserForm');
    addUserForm.addEventListener('submit', handleAddUser);
  }

  if (document.getElementById('applyAccountForm')) {
    const applyAccountForm = document.getElementById('applyAccountForm');
    applyAccountForm.addEventListener('submit', handleApplyAccount);
  }

  const walletIDInput = document.getElementById('walletID');
  if (walletIDInput) {
    walletIDInput.addEventListener('input', () => {
      walletIDInput.value = walletIDInput.value.toLowerCase();
    });
  }
});

async function handleApplyAccount(event) {
  event.preventDefault();
  
  const IC = document.getElementById('IC').value;
  const icPattern = /^\d{6}-\d{2}-\d{4}$/;

  if (!icPattern.test(IC)) {
    displayPromptMessage('Invalid IC number format. It should be in the format 000000-00-0000.', 'red');
    return;
  }

  const walletID = document.getElementById('walletID').value;
  const role = document.getElementById('role').value;

  const data = { walletID, role, IC };
  const promptMessage = document.createElement('div');
  promptMessage.id = "promptMessage";
  promptMessage.style.marginTop = "10px";

  try {
    const response = await fetch('http://127.0.0.1:8000/applyAccount', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      displayPromptMessage('Account application submitted successfully!', 'green');
    } else {
      const error = await response.json();
      displayPromptMessage(error.detail || 'Account application failed', 'red');
      throw new Error(promptMessage.textContent);
    }
  } catch (error) {
    displayPromptMessage(error.message || 'Account application failed. Please try again.', 'red');
  }
}

function displayPromptMessage(message, color) {
  const promptMessage = document.getElementById('promptMessage') || document.createElement('div');
  promptMessage.id = "promptMessage";
  promptMessage.style.marginTop = "10px";
  promptMessage.textContent = message;
  promptMessage.style.color = color;

  const applyButton = document.getElementById('apply');
  applyButton.parentNode.insertBefore(promptMessage, applyButton);
}


function showAddUserError(message) {
  const errorDiv = document.getElementById('addUserError');
  errorDiv.innerText = message;
  errorDiv.style.color = 'red';
}

function showSuccess(message) {
  const successDiv = document.getElementById('addUserError');
  successDiv.innerText = message;
  successDiv.style.color = 'green';
}

async function handleAddUser(event) {
  event.preventDefault();

  const walletID = document.getElementById('walletID').value;
  const role = document.getElementById('role').value;
  const IC = document.getElementById('IC').value;

  const data = { walletID, role, IC };

  try {
    const response = await fetch('http://127.0.0.1:8000/addUser', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      showSuccess('User added successfully!');
      loadUsers();
    } else {
      const error = await response.json();
      throw new Error(error.detail || 'Adding user failed');
    }
  } catch (error) {
    showAddUserError(error.message || 'Adding user failed. Please try again.');
  }
}

async function loadApplicants() {
  try {
    const response = await fetch('http://127.0.0.1:8000/applicants');
    if (!response.ok) throw new Error('Failed to fetch applicants');

    const applicants = await response.json();
    const applicantsTable = document.getElementById('applicantsTable').getElementsByTagName('tbody')[0];

    applicantsTable.innerHTML = '';
    applicants.forEach(applicant => {
      const row = applicantsTable.insertRow();
      row.insertCell(0).textContent = applicant.walletID;
      row.insertCell(1).textContent = applicant.IC;
      row.insertCell(2).textContent = applicant.role;

      const actionsCell = row.insertCell(3);
      const approveButton = document.createElement('button');
      approveButton.textContent = 'Approve';
      approveButton.onclick = () => approveApplicant(applicant.walletID);

      const rejectButton = document.createElement('button');
      rejectButton.textContent = 'Reject';
      rejectButton.onclick = () => rejectApplicant(applicant.walletID);

      actionsCell.appendChild(approveButton);
      actionsCell.appendChild(rejectButton);
    });
  } catch (error) {
    console.error('Error loading applicants:', error);
  }
}

async function loadUsers() {
  try {
    const response = await fetch('http://127.0.0.1:8000/users');
    if (!response.ok) throw new Error('Failed to fetch users');

    const users = await response.json();
    const usersTable = document.getElementById('allUsersTable').getElementsByTagName('tbody')[0];

    usersTable.innerHTML = '';
    users.forEach(user => {
      if (user.role !== 'admin') {
        let roomIDs = '';
        if (Array.isArray(user.roomIDs)) {
          roomIDs = user.roomIDs.join(', ');
        } else if (typeof user.roomIDs === 'string') {
          roomIDs = user.roomIDs.replace(/[\[\]]/g, '');
        } else if (user.roomIDs) {
          roomIDs = user.roomIDs.toString();
        }

        const row = usersTable.insertRow();
        row.innerHTML = `
          <td>${user.walletID}</td>
          <td>${user.IC}</td>
          <td>${user.role}</td>
          <td>${roomIDs}</td>
          <td>
            <button onclick="deleteUser('${user.walletID}')">Delete</button>
            <button onclick="editUser(this)">Edit</button>
            <button onclick="saveUser(this)" style="display:none;">Save</button>
          </td>
        `;
      }
    });
  } catch (error) {
    console.error('Error loading users:', error);
  }
}




async function approveApplicant(walletID) {
  try {
    const response = await fetch(`http://127.0.0.1:8000/approveApplicant`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ walletID: walletID })
    });
    if (!response.ok) throw new Error('Failed to approve applicant');

    loadApplicants();
    loadUsers();
  } catch (error) {
    console.error('Error approving applicant:', error);
  }
}

async function rejectApplicant(walletID) {
  try {
    const response = await fetch(`http://127.0.0.1:8000/rejectApplicant`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ walletID: walletID })
    });
    if (!response.ok) throw new Error('Failed to reject applicant');

    loadApplicants();
  } catch (error) {
    console.error('Error rejecting applicant:', error);
  }
}

async function deleteUser(walletID) {
  const isConfirmed = confirm("Are you sure you want to delete this user?");
  
  if (!isConfirmed) {
    return;
  }

  try {
    const response = await fetch(`http://127.0.0.1:8000/users/${walletID}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!response.ok) throw new Error('Failed to delete user');

    loadUsers();
  } catch (error) {
    console.error('Error deleting user:', error);
  }
}

function editUser(editButton) {
  const row = editButton.closest('tr');
  const saveButton = row.querySelector('button[onclick="saveUser(this)"]');
  const cells = row.querySelectorAll('td:not(:last-child)');

  cells.forEach(cell => {
    const input = document.createElement('input');
    input.type = 'text';
    input.value = cell.textContent;
    cell.textContent = '';
    cell.appendChild(input);
  });

  editButton.style.display = 'none';
  saveButton.style.display = '';
}

async function saveUser(saveButton) {
  const row = saveButton.closest('tr');
  const cells = row.querySelectorAll('td');

  const walletID = cells[0].querySelector('input').value;
  const IC = cells[1].querySelector('input').value;
  const role = cells[2].querySelector('input').value;
  const roomIDsInput = cells[3].querySelector('input').value;

  // Add logging for roomIDsInput
  console.log("Room IDs Input:", roomIDsInput);

  // Split and map room IDs correctly, handle edge cases
  const roomIDs = roomIDsInput ? roomIDsInput.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id)) : [];

  // Add logging for roomIDs after processing
  console.log("Processed Room IDs:", roomIDs);

  const updatedUser = {
    walletID: walletID,
    IC: IC,
    role: role,
    roomIDs: roomIDs.length ? roomIDs : null  // Ensure roomIDs is null if empty
  };

  console.log("Updating user with data:", updatedUser);

  try {
    const response = await fetch(`http://127.0.0.1:8000/users/${walletID}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedUser)
    });

    if (!response.ok) {
      throw new Error('Failed to update user');
    }

    alert('User updated successfully');
    loadUsers();
  } catch (error) {
    console.error('Failed to update user', error);
    alert('Failed to update user');
  }
}



function searchTable() {
  const searchInput = document.getElementById('searchInput').value.toLowerCase();
  const table = document.getElementById('allUsersTable');
  const rows = table.getElementsByTagName('tr');

  for (let i = 1; i < rows.length; i++) {
    const cells = rows[i].getElementsByTagName('td');
    let match = false;

    for (let j = 0; j < cells.length; j++) {
      if (cells[j].textContent.toLowerCase().includes(searchInput)) {
        match = true;
        break;
      }
    }

    rows[i].style.display = match ? '' : 'none';
  }
}

function sortTable(columnIndex) {
  const table = document.getElementById('allUsersTable');
  const rows = Array.from(table.rows).slice(1);

  const sortedRows = rows.sort((a, b) => {
    const aText = a.cells[columnIndex].textContent;
    const bText = b.cells[columnIndex].textContent;

    return aText.localeCompare(bText);
  });

  const tbody = table.getElementsByTagName('tbody')[0];
  tbody.innerHTML = '';
  sortedRows.forEach(row => tbody.appendChild(row));
}

function showSection(sectionId) {
  const sections = document.querySelectorAll('.section');
  sections.forEach(section => {
    section.classList.remove('active');
  });

  document.getElementById(sectionId).classList.add('active');

  const buttons = document.querySelectorAll('.section-button');
  buttons.forEach(button => {
    button.classList.remove('active');
  });

  const activeButton = document.querySelector(`button[id*="${sectionId.split('Section')[0]}Button"]`);
  if (activeButton) {
    activeButton.classList.add('active');
  }
}
