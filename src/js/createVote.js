const Web3 = require('web3');
const contract = require('@truffle/contract');
const votingArtifacts = require('../../build/contracts/Voting.json');
const VotingContract = contract(votingArtifacts);

let web3Provider = window.ethereum;
if (typeof window !== 'undefined' && typeof window.ethereum !== 'undefined') {
  window.ethereum.request({ method: 'eth_requestAccounts' }); 
} else {
  console.warn('No web3 provider found. Using default HTTP provider.');
  web3Provider = new Web3.providers.HttpProvider('http://127.0.0.1:9545');
}

VotingContract.setProvider(web3Provider);

window.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('Authorization')?.split(' ')[1];

  if (token) {
    localStorage.setItem('jwtTokenVoter', token);
    const userRole = getRoleFromToken(token);
    if (userRole === 'admin') {
      getVotingRooms(token, true); // Get all rooms for admin
    } else {
      getUserAssignedRooms(token); // Get assigned rooms for user
    }
  } else {
    console.error('Authorization token not found in URL.');
  }
});

function getRoleFromToken(token) {
  const decodedToken = JSON.parse(atob(token.split('.')[1]));
  return decodedToken.role;
}

async function getUserAssignedRooms(token) {
  const walletID = await getWalletID();
  fetch(`http://127.0.0.1:8000/userAssignedRooms/${walletID}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  .then(response => response.json())
  .then(data => {
    if (data.roomIDs && data.roomIDs.length > 0) {
      getVotingRooms(token, false, data.roomIDs); 
    } else {
      throw new Error('No rooms assigned to this user');
    }
  })
  .catch(error => {
    console.error('Error fetching user assigned rooms:', error);
  });
}

async function getWalletID() {
  const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
  return accounts[0];
}

async function getVotingRooms(token, isAdmin, userAssignedRoomIDs = []) {
  try {
    const votingInstance = await VotingContract.deployed();
    const rooms = await votingInstance.getAllVotingRooms.call();
    const voteContainer = document.querySelector('.container');

    voteContainer.querySelectorAll('.voteButton:not(#createVoteButton)').forEach(button => button.remove());

    const userToken = localStorage.getItem('jwtTokenVoter');
    const adminToken = localStorage.getItem('jwtTokenAdmin');

    rooms.forEach(async (room) => {
      const roomId = room[0]?.toString();
      const startDate = new Date(room[1] * 1000).toLocaleString();
      const endDate = new Date(room[2] * 1000).toLocaleString();
      const roomName = room[3];

      if (!roomId || !startDate || !endDate || !roomName) {
        console.warn("Room data is incomplete:", room);
        return;
      }



      if (!isAdmin && userAssignedRoomIDs && !userAssignedRoomIDs.map(String).includes(roomId)) {

        return; // Skip rooms not assigned to the user
      }

      const voteButton = document.createElement('button');
      voteButton.classList.add('voteButton');
      voteButton.innerText = `${roomName} (Start: ${startDate}, End: ${endDate})`;

      try {
        const candidates = await votingInstance.getRoomCandidates.call(roomId);
        if (candidates.length > 0) {
          voteContainer.appendChild(voteButton);

          voteButton.addEventListener('click', () => {
            localStorage.setItem('previousPage', 'createVote.html');
            const redirectPage = isAdmin ? 'adminIndex.html' : 'index.html';
            const redirectToken = isAdmin ? adminToken : userToken;
            window.location.replace(`http://127.0.0.1:8080/${redirectPage}?Authorization=Bearer ${redirectToken}&roomId=${roomId}`);
          });

        } else {
          console.warn(`No candidates found for room ${roomId}`);
        }
      } catch (error) {
        console.error('Error fetching candidates for room:', roomId, error);
      }
    });

  } catch (error) {
    console.error('Error fetching voting rooms:', error);
  }
}
