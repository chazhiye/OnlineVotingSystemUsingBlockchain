// manageVote.js

const Web3 = require('web3');
const contract = require('@truffle/contract');
const votingArtifacts = require('../../build/contracts/Voting.json');
const VotingContract = contract(votingArtifacts);

let web3Provider;
if (typeof window !== 'undefined' && typeof window.ethereum !== 'undefined') {
  web3Provider = window.ethereum;
  window.ethereum.request({ method: 'eth_requestAccounts' });
} else {
  console.warn('No web3 provider found. Using default HTTP provider.');
  web3Provider = new Web3.providers.HttpProvider('http://127.0.0.1:9545');
}

VotingContract.setProvider(web3Provider);
let selectedRoomId = null;
let selectedUsers = [];

window.ManageVote = {
  start: async function() {
    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      VotingContract.setProvider(window.ethereum);
      VotingContract.defaults({ from: window.ethereum.selectedAddress, gas: 6654755 });

      ManageVote.account = window.ethereum.selectedAddress;
      $("#accountAddress").html("Your Account: " + window.ethereum.selectedAddress);
    } catch (err) {
      console.error("ERROR! " + err.message);
    }
    const instance = await VotingContract.deployed();
    await ManageVote.updateRoomList(instance);
    $(document).ready(function() {
        const urlParams = new URLSearchParams(window.location.search);
        const roomId = urlParams.get('roomId');
        const token = urlParams.get('Authorization')?.split(' ')[1];
        if (roomId) {
          selectedRoomId = parseInt(roomId);
        }
        ManageVote.loadUserlist();
            $('#selectRoomForAssignment').change(function() {
                selectedRoomId = parseInt($('#selectRoomForAssignment').val());

            });
            $('#createRoom').click(async function() {
                const startDate = Date.parse(document.getElementById("startDate").value) / 1000;
                const endDate = Date.parse(document.getElementById("endDate").value) / 1000;
                const roomName = document.getElementById("roomName").value;
                try {
                  await instance.createVotingRoom(startDate, endDate, roomName);
                  $("#msg1").html("Voting room created successfully");
                  setTimeout(() => {
                    $("#msg1").html("");
                }, 3000);
                    ManageVote.updateRoomList(instance);
                } catch (err) {
                  console.error("Error creating voting room: " + err.message);
                }
              });
              $('#selectRoom').change(function() {
                selectedRoomId = parseInt($('#selectRoom').val());

              });
              $('#addCandidate').click(async function() {
                const nameCandidate = $('#name').val();
                const ICCandidate = $('#IC').val();
                if (selectedRoomId === null || isNaN(selectedRoomId)) {
                  console.error("Invalid room ID");
                  return;
                }
                try {
                  await instance.addCandidate(selectedRoomId, nameCandidate, ICCandidate);
                  $("#msg2").html("Candidate added successfully");
                  setTimeout(() => {
                    $("#msg2").html("");
                }, 3000);
                    
                } catch (err) {
                  console.error("Error adding candidate: " + err.message);
                }
              });
            $('#assignUsers').click(function(event) {
                event.preventDefault();
                ManageVote.assignUsersToRoom();
            });
    });
  },


  assignUsersToRoom: async function() {
    try {
        const roomID = parseInt($('#selectRoomForAssignment').val());

        if (selectedUsers.length === 0 || isNaN(roomID)) {
            $("#msg4").html("No users selected or invalid room ID");
            return;
        }

        const apiUrl = 'http://127.0.0.1:8000/assignRoom';
        const token = localStorage.getItem('jwtToken');
        const payload = { users: selectedUsers, roomID: roomID };

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error('Failed to assign users to the room');
        }

        const responseData = await response.json();
        $("#msg3").html("Users assigned successfully");
        setTimeout(() => {
          $("#msg3").html("");
      }, 3000);
    } catch (error) {
        console.error('Error assigning users to the room:', error);
    }
},

    updateRoomList: async function(instance) {
        try {
        const rooms = await instance.getAllVotingRooms();
        $('#selectRoom').empty();
        $('#selectRoom').append($('<option>', { value: '', text: 'Select Voting' }));

        $('#selectRoomForAssignment').empty();
        $('#selectRoomForAssignment').append($('<option>', { value: '', text: 'Select Voting Room for Assignment' }));

        if (rooms.length === 0) {
            console.warn('No voting rooms found.');
        } else {
            rooms.forEach(function(room) {
            const option = $('<option>', {
                value: room.id,
                text: `${room.name} (Start: ${new Date(room.startDate * 1000).toLocaleString()}, End: ${new Date(room.endDate * 1000).toLocaleString()})`
            });
            $('#selectRoom').append(option);
            $('#selectRoomForAssignment').append(option.clone());
            });
        }
        } catch (err) {
        console.error("ERROR! " + err.message);
        }
    },

};

window.addEventListener('load', ManageVote.start);


ManageVote.loadUserlist = async function() {
    try {
        const response = await fetch('http://127.0.0.1:8000/users');
        if (!response.ok) throw new Error('Failed to fetch users');
  
        const users = await response.json();
        const userList = document.getElementById('userList');
        userList.innerHTML = ''; 
  
        // Filter out users with the role 'admin'
        const filteredUsers = users.filter(user => user.role !== 'admin');
  
        filteredUsers.forEach(user => {
            const option = document.createElement('option');
            option.value = user.walletID;
            option.textContent = user.IC;
            userList.appendChild(option);
        });
  
        // Adding event listener after populating the user list
        userList.addEventListener('change', function() {
            const selectedOption = userList.options[userList.selectedIndex];
            if (selectedOption) {
                const walletID = selectedOption.value;
                const IC = selectedOption.textContent;
                ManageVote.addUserToSelected(walletID, IC);
  
                // Remove the selected option to prevent duplicates
                if (selectedOption.parentNode) {
                    userList.removeChild(selectedOption);
                }
            }
        });
  
    } catch (error) {
        console.error('Error loading user list:', error);
    }
  };
  ManageVote.addUserToSelected = function(walletID, IC) {
    if (!selectedUsers.includes(walletID)) {
        selectedUsers.push(walletID);
  
        const selectedUsersContainer = document.getElementById('selectedUsers');
        const userElement = document.createElement('div');
        userElement.textContent = IC;
        userElement.dataset.walletID = walletID;
  
        // Check if the remove button already exists
        if (!userElement.querySelector('.remove-user-button')) {
            const removeButton = document.createElement('button');
            removeButton.textContent = 'x';
            removeButton.classList.add('remove-user-button');
            removeButton.style.color = 'red';
            removeButton.style.backgroundColor = 'transparent';
            removeButton.style.border = 'none';
            removeButton.style.cursor = 'pointer';
            removeButton.addEventListener('click', function() {
                selectedUsers = selectedUsers.filter(id => id !== walletID);
                selectedUsersContainer.removeChild(userElement);
  
                // Allow immediate re-adding of the user
                const userList = document.getElementById('userList');
                if (!Array.from(userList.options).some(option => option.value === walletID)) {
                    const option = document.createElement('option');
                    option.value = walletID;
                    option.textContent = IC;
                    userList.appendChild(option);
                }
            });
  
            userElement.appendChild(removeButton);
        }
  
        selectedUsersContainer.appendChild(userElement);
  
        // Remove the user from the dropdown list to prevent duplicates
        const userList = document.getElementById('userList');
        const optionToRemove = Array.from(userList.options).find(option => option.value === walletID);
        if (optionToRemove) {
            userList.removeChild(optionToRemove);
        }
    }
  };
  
  
document.addEventListener('DOMContentLoaded', function () {
    const defineVotingRoomButton = document.getElementById('createRoomButton');
    const addCandidateButton = document.getElementById('addCandidateButton');
    const assignUsersButton = document.getElementById('assignUsersButton');
    const defineVotingRoomSection = document.getElementById('defineVotingRoomSection');
    const addCandidateSection = document.getElementById('addCandidateSection');
    const assignUsersSection = document.getElementById('assignUsersSection');
    const addAllUsersButton = document.getElementById('addAllUsersButton');
    const removeAllUsersButton = document.getElementById('removeAllUsersButton');
  
    defineVotingRoomButton.addEventListener('click', () => {
        addCandidateSection.style.display = 'none';
        defineVotingRoomSection.style.display = 'block';
        assignUsersSection.style.display = 'none';
  
        defineVotingRoomButton.classList.add('active');
        addCandidateButton.classList.remove('active');
        assignUsersButton.classList.remove('active');
    });
  
    addCandidateButton.addEventListener('click', () => {
        defineVotingRoomSection.style.display = 'none';
        addCandidateSection.style.display = 'block';
        assignUsersSection.style.display = 'none';
  
        addCandidateButton.classList.add('active');
        defineVotingRoomButton.classList.remove('active');
        assignUsersButton.classList.remove('active');
    });
  
    assignUsersButton.addEventListener('click', () => {
        defineVotingRoomSection.style.display = 'none';
        addCandidateSection.style.display = 'none';
        assignUsersSection.style.display = 'block';
  
        addCandidateButton.classList.remove('active');
        defineVotingRoomButton.classList.remove('active');
        assignUsersButton.classList.add('active');
    });
  
    addAllUsersButton.addEventListener('click', () => {
        const userList = document.getElementById('userList');
        const options = Array.from(userList.options);
  
        options.forEach(option => {
            const walletID = option.value;
            const IC = option.textContent;
            ManageVote.addUserToSelected(walletID, IC);
        });
    });
  
    removeAllUsersButton.addEventListener('click', () => {
        const userList = document.getElementById('userList');
        const selectedUsersContainer = document.getElementById('selectedUsers');
        const selectedUserElements = Array.from(selectedUsersContainer.children);
  
        selectedUserElements.forEach(userElement => {
            const walletID = userElement.dataset.walletID;
            const IC = userElement.textContent.replace('x', '').trim();
  
            // Create a new option element to add back to the userList
            const option = document.createElement('option');
            option.value = walletID;
            option.textContent = IC;
            userList.appendChild(option);
  
            // Remove the user element from the selectedUsersContainer
            selectedUsersContainer.removeChild(userElement);
        });
  
        // Clear the selectedUsers array
        selectedUsers = [];
    });
  });
  