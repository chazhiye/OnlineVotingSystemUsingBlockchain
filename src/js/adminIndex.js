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

const AdminApp = {
  init: async function() {
    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      VotingContract.setProvider(window.ethereum);
      VotingContract.defaults({ from: window.ethereum.selectedAddress, gas: 6654755 });

      AdminApp.account = window.ethereum.selectedAddress;
      $("#accountAddress").html("Your Account: " + window.ethereum.selectedAddress);

      const instance = await VotingContract.deployed();
      await AdminApp.updateRoomList(instance); // Wait for room list to load before setting selected room

      $(document).ready(function() {
        const urlParams = new URLSearchParams(window.location.search);
        const roomId = urlParams.get('roomId');
        const token = urlParams.get('Authorization')?.split(' ')[1]; // Handle optional token

        if (roomId) {
          console.log(`Room ID from URL: ${roomId}`);
          selectedRoomId = parseInt(roomId);
          AdminApp.updateAdminRoomCandidates(selectedRoomId, instance, token);
          AdminApp.updateVotingPageInfo(selectedRoomId, instance); 
          AdminApp.checkAdminRole(token); // Check if the user is an admin
        }

        $('#deleteAllButton').click(async function() {
          if (selectedRoomId === null || isNaN(selectedRoomId)) {
              console.error("Invalid room ID");
              return;
          }
          try {
              await instance.deleteVotingRoom(selectedRoomId, { from: AdminApp.account });
              console.log("All candidates and room deleted successfully");
              AdminApp.updateRoomList(instance); // Update room list after deletion
      
              // Redirect to the previous page
              const previousPage = localStorage.getItem('previousPage');
              if (previousPage) {
                  const tokenKey = previousPage === 'admin.html' ? 'jwtTokenAdmin' : 'jwtTokenVoter';
                  const token = localStorage.getItem(tokenKey);
                  if (token) {
                      window.location.replace(`http://127.0.0.1:8080/${previousPage}?Authorization=Bearer ${token}`);
                  } else {
                      console.error('Token not found for previous page.');
                      window.location.replace('http://127.0.0.1:8080');
                  }
              } else {
                  console.error('Previous page not set.');
              }
          } catch (err) {
              console.error("Error deleting room and candidates: " + err.message);
          }
      });
      
      });
    } catch (err) {
      console.error("ERROR! " + err.message);
    }
  },

  checkAdminRole: function(token) {
    if (token) {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      const payload = JSON.parse(jsonPayload);
      if (payload.role !== 'admin') {
        console.error("User is not an admin");
        window.location.replace('http://127.0.0.1:8080/voter.html?Authorization=Bearer ' + token);
      }
    }
  },

  updateRoomList: async function(instance) {
    try {
      const roomList = $("#roomList");
      roomList.empty();

      const rooms = await instance.getAllVotingRooms();
      rooms.forEach(room => {
        const option = $("<option></option>").attr("value", room.id).text(room.name);
        roomList.append(option);
      });

      roomList.change(async function() {
        selectedRoomId = parseInt($(this).val());
        console.log(`Selected Room ID: ${selectedRoomId}`);
        AdminApp.updateAdminRoomCandidates(selectedRoomId, instance);
        AdminApp.updateVotingPageInfo(selectedRoomId, instance);
      });

      // Set the selected room ID if it's provided in the URL
      const urlParams = new URLSearchParams(window.location.search);
      const roomId = urlParams.get('roomId');
      if (roomId) {
        roomList.val(roomId).change();
        selectedRoomId = parseInt(roomId);
      }
    } catch (err) {
      console.error("Error fetching voting rooms: " + err.message);
    }
  },
  updateAdminRoomCandidates: async function(roomId, instance, token) {
    try {
      const candidates = await instance.getRoomCandidates(roomId);
      $('#boxCandidate').empty();

      candidates.forEach(function(candidate) {
        const editButton = $('<button>').text('Edit').click(function() {
          AdminApp.editCandidate(candidate.id, roomId, instance);
        }).css({ display: 'inline-block', margin: '5px' });

        const deleteButton = $('<button>').text('Delete').click(async function() {
          await AdminApp.deleteCandidate(candidate.id, roomId, instance, token);
          AdminApp.updateAdminRoomCandidates(roomId, instance, token); // Update admin candidates after deletion
        }).css({ display: 'inline-block', margin: '5px' });

        const row = $('<tr>').append(
          $('<td>').text(candidate.name),
          $('<td>').text(candidate.voteCount),
          $('<td>').append(editButton, deleteButton)
        );
        $('#boxCandidate').append(row);
      });
    } catch (err) {
      console.error("Error updating room candidates:", err);
    }
  },

  editCandidate: async function(candidateId, roomId, instance) {
    const newName = prompt('Enter new name for candidate:');
    if (newName) {
      try {
        await instance.editCandidate(roomId, candidateId, newName, { from: AdminApp.account });
        console.log("Candidate edited successfully");
        AdminApp.updateAdminRoomCandidates(roomId, instance); // Update admin candidates after editing
      } catch (err) {
        console.error("Error editing candidate: " + err.message);
      }
    }
  },

  deleteCandidate: async function(candidateId, roomId, instance) {
    try {
      await instance.deleteCandidate(roomId, candidateId, { from: AdminApp.account });
      console.log("Candidate deleted successfully");
      AdminApp.updateAdminRoomCandidates(roomId, instance); // Update admin candidates after deletion
    } catch (err) {
      console.error("Error deleting candidate:", err);
    }
  },

  updateVotingPageInfo: async function(roomId, instance) {
    try {
      const room = await instance.votingRooms(roomId);
      const startDate = new Date(room.startDate * 1000).toLocaleString();
      const endDate = new Date(room.endDate * 1000).toLocaleString();

      $('#roomName').text(room.name);
      $('#dates').text(`Start: ${startDate}, End: ${endDate}`);
    } catch (err) {
      console.error("Error updating voting page info:", err);
    }
  },
};
const backButton = document.getElementById('backButton');
if (backButton) {
    backButton.addEventListener('click', () => {
        const previousPage = localStorage.getItem('previousPage');
        if (previousPage) {
            const tokenKey = previousPage === 'admin.html' ? 'jwtTokenAdmin' : 'jwtTokenVoter';
            const token = localStorage.getItem(tokenKey);
            if (token) {
                window.location.replace(`http://127.0.0.1:8080/${previousPage}?Authorization=Bearer ${token}`);
            } else {
                console.error('Token not found for previous page.');
                window.location.replace('http://127.0.0.1:8080');
            }
        } else {
            console.error('Previous page not set.');
        }
    });
}
window.AdminApp = AdminApp;
window.addEventListener('load', AdminApp.init);
