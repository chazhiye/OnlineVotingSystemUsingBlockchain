import React, { useEffect, useState } from 'react';
import Web3 from 'web3';
import { db } from './firebaseConfig';
import { getFirestore, doc, getDoc, collection, getDocs } from 'firebase/firestore';
import VotingContract from './build/contracts/Voting.json';
import Sidebar from './sidebar';
import './createVote.css';
import './sidebar.css';

const CreateVote = () => {
  const [walletAddress, setWalletAddress] = useState('');
  const [votingRooms, setVotingRooms] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const init = async () => {
      await connectWallet();
      await fetchVotingRooms();
    };

    init();
  }, []);

  const connectWallet = async () => {
    if (typeof window !== 'undefined' && typeof window.ethereum !== 'undefined') {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setWalletAddress(accounts[0]);
      setIsAdmin(await checkIfAdmin(accounts[0]));
    } else {
      console.warn('Please install MetaMask');
    }
  };

  const checkIfAdmin = async (walletAddress) => {
    const firestore = getFirestore(db);
    const docRef = doc(firestore, 'admin', walletAddress);
    const docSnap = await getDoc(docRef);

    return docSnap.exists();
  };

  const fetchVotingRooms = async () => {
    try {
      const web3 = new Web3(window.ethereum);
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = VotingContract.networks[networkId];
      const votingInstance = new web3.eth.Contract(VotingContract.abi, deployedNetwork && deployedNetwork.address);
      const rooms = await votingInstance.methods.getAllVotingRooms().call();

      setVotingRooms(rooms);
    } catch (error) {
      console.error('Error fetching voting rooms:', error);
    }
  };

  const handleRoomClick = (roomId) => {
    const redirectPage = isAdmin ? '/adminIndex' : '/index';
    window.location.replace(`${redirectPage}?roomId=${roomId}`);
  };

  return (
    <div className="main-container">
      <Sidebar />
      <div className="main-content">
        <h1>Admin Vote</h1>
        <div className="container">
          {votingRooms.map((room, index) => (
            <button key={index} className="voteButton" onClick={() => handleRoomClick(room.id)}>
              {room.name} (Start: {new Date(room.start * 1000).toLocaleString()}, End: {new Date(room.end * 1000).toLocaleString()})
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CreateVote;
