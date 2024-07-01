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

window.addEventListener('load', async function() {
  try {
    const instance = await VotingContract.deployed();
    let token = localStorage.getItem('jwtTokenAdmin') || localStorage.getItem('jwtTokenVoter');
    if (!token) throw new Error('No JWT token found in localStorage.');

    let decodedToken;
    try {
      decodedToken = JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
      throw new Error('Failed to decode JWT token: ' + e.message);
    }

    const isAdmin = decodedToken.role === 'admin';
    if (isAdmin) {
      await displayAllTransactionHashes(instance);
    } else {
      await displayUserTransactionHashes(instance, decodedToken.wallet_id);
    }
  } catch (error) {
    console.error('Initialization error:', error);
  }
});

async function displayAllTransactionHashes(instance) {
  try {
    const roomCount = await instance.roomCount.call();
    for (let i = 0; i < roomCount; i++) {
      try {
        const hashes = await instance.getRoomTransactionHashes(i);
        console.log(`Transaction hashes for room ${i}:`, hashes);
        await appendTransactionHashes(instance, i, hashes);
      } catch (error) {
        console.error(`Error getting transaction hashes for room ${i}:`, error);
      }
    }
  } catch (error) {
    console.error('Error getting all voting rooms:', error);
  }
}

async function displayUserTransactionHashes(instance, userWalletID) {
  try {
    const response = await fetch('http://127.0.0.1:8000/users');
    if (!response.ok) throw new Error('Failed to fetch users');
    
    const users = await response.json();
    const user = users.find(user => user.walletID === userWalletID);
    const assignedRooms = user ? user.roomIDs : [];
    console.log('Assigned rooms for user:', assignedRooms);

    for (const roomId of assignedRooms) {
      try {
        const hashes = await instance.getRoomTransactionHashes(roomId);
        console.log(`Transaction hashes for room ${roomId}:`, hashes);
        await appendTransactionHashes(instance, roomId, hashes);
      } catch (error) {
        console.error(`Error getting transaction hashes for room ${roomId}:`, error);
      }
    }
  } catch (error) {
    console.error('Error fetching users or processing assigned rooms:', error);
  }
}

async function appendTransactionHashes(instance, roomId, hashes) {
  try {
    const room = await instance.votingRooms(roomId);
    const container = document.getElementById('transactionContainer');
    const roomDiv = document.createElement('div');
    roomDiv.innerHTML = `<h3>Room Name: ${room.name}</h3>`;

    hashes.forEach(hash => {
      const hashElement = document.createElement('p');
      hashElement.textContent = hash;
      roomDiv.appendChild(hashElement);
    });

    container.appendChild(roomDiv);
  } catch (error) {
    console.error(`Error fetching room name for room ${roomId}:`, error);
  }
}
