const Web3 = require('web3');
const contract = require('@truffle/contract');
const votingArtifacts = require('../../build/contracts/Voting.json');
const VotingContract = contract(votingArtifacts);

let web3;
let web3Provider;

if (typeof window !== 'undefined' && typeof window.ethereum !== 'undefined') {
  web3Provider = window.ethereum;
  web3 = new Web3(window.ethereum);
  window.ethereum.request({ method: 'eth_requestAccounts' });
} else {
  console.warn('No web3 provider found. Using default HTTP provider.');
  web3Provider = new Web3.providers.HttpProvider('http://127.0.0.1:9545');
  web3 = new Web3(web3Provider);
}

VotingContract.setProvider(web3Provider);
let selectedRoomId = null;
let selectedUsers = [];

window.App = {
  eventStart: async function() {
    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      VotingContract.setProvider(window.ethereum);
      VotingContract.defaults({ from: window.ethereum.selectedAddress, gas: 6654755 });

      App.account = window.ethereum.selectedAddress;
      $("#accountAddress").html("Your Account: " + window.ethereum.selectedAddress);

      const instance = await VotingContract.deployed();
      await App.updateRoomList(instance);

      $(document).ready(function() {
        const urlParams = new URLSearchParams(window.location.search);
        const roomId = urlParams.get('roomId');
        
        const token = urlParams.get('Authorization')?.split(' ')[1];
        if (roomId) {
          selectedRoomId = parseInt(roomId);
          App.updateRoomCandidates(selectedRoomId, instance, token);
          App.updateVotingPageInfo(selectedRoomId, instance);
          App.checkAdminRole(token);
        }
        $('#voteButton').click(function() {
          App.vote(instance);
        });

        $('#selectRoom').change(function() {
          selectedRoomId = parseInt($('#selectRoom').val());
          if (!isNaN(selectedRoomId)) {
            App.updateRoomCandidates(selectedRoomId, instance, token);
          }
        });
      });
    } catch (err) {
      console.error("ERROR! " + err.message);
    }
  },

  checkAdminRole: function(token) {
    if (token) {
      try {
        const decodedToken = JSON.parse(atob(token.split('.')[1]));
        if (decodedToken.role === 'admin') {
          $("#voteButton").hide();
        }
      } catch (error) {
        console.error("Invalid token", error);
      }
    }
  },

  updateVotingPageInfo: async function(roomId, instance) {
    try {
      const room = await instance.votingRooms(roomId);
      const startDate = new Date(room.startDate * 1000).toLocaleString();
      const endDate = new Date(room.endDate * 1000).toLocaleString();

      $('#roomName').text(room.name);
      $('#dates').text(`Start: ${startDate} | End: ${endDate}`);
      const currentTimestamp = Math.round(Date.now() / 1000);
      if (currentTimestamp > room.endDate) {
        await App.displayResults(roomId, instance);
        $("#vote").hide();
        startFireworks();
      }
    } catch (error) {
      console.error("Failed to retrieve room info:", error);
    }

  },
  
  displayResults: async function(roomId, instance) {
    try {
      const candidates = await instance.getRoomCandidates(roomId);
      $('#resultsList').empty();
      $('#resultsList').append('<h3>Results</h3>');
      $('#resultsList').append('<ul id="results"></ul>');
      candidates.forEach(candidate => {
        $('#results').append(`<li>Name: ${candidate.name}, Votes: ${candidate.voteCount}</li>`);
      });
    } catch (err) {
      console.error("Error displaying results:", err);
    }
  },
  updateRoomList: async function(instance) {
    try {
      const roomCount = await instance.roomCount.call();
      $('#selectRoom').empty();

      for (let i = 0; i < roomCount; i++) {
        const room = await instance.votingRooms(i);
        $('#selectRoom').append(new Option(room.name, room.id));
      }
    } catch (error) {
      console.error("Failed to update room list:", error);
    }
  },

  updateRoomCandidates: async function(roomId, instance, token) {
    try {
      if (roomId !== undefined && instance !== undefined) {
        const candidates = await instance.getRoomCandidates(roomId);
        $('#boxCandidate').empty();

        const decodedToken = token ? JSON.parse(atob(token.split('.')[1])) : null;
        const isAdmin = localStorage.getItem('jwtTokenAdmin') !== null;

        const room = await instance.votingRooms(roomId);
        const currentTimestamp = Math.round(Date.now() / 1000);
        const showVoteCount = currentTimestamp > room.endDate;

        candidates.forEach(candidate => {
          const tableRow = `
            <tr>
              <td>${candidate.name}</td>
              <td>${showVoteCount ? candidate.voteCount : '--'}</td>
              ${isAdmin ? '' : `<td><input type="radio" name="candidate" value="${candidate.id}"></td>`}
            </tr>`;
          $('#boxCandidate').append(tableRow);
        });

        const hasVoted = await instance.votes(App.account, roomId);
        const votingPeriodActive = await App.checkVotingPeriod(roomId, instance);

        if (hasVoted || !votingPeriodActive) {
          $("#voteButton").attr("disabled", true);
          $("#msg").html("<p>You have already voted or voting is closed.</p>");
        } else {
          $("#voteButton").attr("disabled", false);
          $("#msg").empty();
        }
      } else {
        console.error("Error: Invalid room ID or instance.");
      }
    } catch (err) {
      console.error("ERROR in updateRoomCandidates! " + err.message);
    }
  },

  checkVotingPeriod: async function(roomId, instance) {
    try {
      const room = await instance.votingRooms(roomId);
      const currentTimestamp = Math.round(Date.now() / 1000);
      return currentTimestamp >= room.startDate && currentTimestamp <= room.endDate;
    } catch (err) {
      console.error("Error checking voting period:", err);
      return false;
    }
  },

  vote: async function(instance) {
    const selectedCandidateId = $('input[name="candidate"]:checked').val();
    try {
      const transaction = await instance.vote(selectedRoomId, selectedCandidateId, { from: App.account });
      await instance.storeTransactionHash(selectedRoomId, transaction.tx);
      document.getElementById('msg').innerHTML = '<p>Vote cast successfully!</p>';
    } catch (error) {
      console.error("Voting failed", error);
      document.getElementById('msg').innerHTML = '<p>Voting failed. Please try again.</p>';
    
    }
  },
};

$(document).ready(function() {
  App.eventStart();
});
