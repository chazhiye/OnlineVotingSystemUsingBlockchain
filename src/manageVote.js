import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import VotingContract from './build/contracts/Voting.json';
import { useHistory } from 'react-router-dom';
import Sidebar from './sidebar';
import { db } from './firebaseConfig';
import './manageVote.css';
import './sidebar.css';

const ManageVote = () => {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState(null);
  const [votingContract, setVotingContract] = useState(null);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [users, setUsers] = useState([]);
  const [roomName, setRoomName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [nameCandidate, setNameCandidate] = useState('');
  const [ICCandidate, setICCandidate] = useState('');
  const [activeSection, setActiveSection] = useState('defineVotingRoom');

  useEffect(() => {
    const initEthers = async () => {
      try {
        if (typeof window.ethereum !== 'undefined') {
          const provider = new ethers.BrowserProvider(window.ethereum);
          setProvider(provider);
          
          await window.ethereum.request({ method: 'eth_requestAccounts' });
          const signer = provider.getSigner();
          setSigner(signer);
          
          const account = await signer.getAddress();
          setAccount(account);

          const network = await provider.getNetwork();
          const networkId = network.chainId;

          const deployedNetwork = VotingContract.networks[networkId];
          if (!deployedNetwork) {
            throw new Error(`Smart contract not deployed on the detected network (${networkId})`);
          }

          const contract = new ethers.Contract(deployedNetwork.address, VotingContract.abi, signer);
          setVotingContract(contract);
        } else {
          console.error("MetaMask is not installed!");
        }
      } catch (error) {
        console.error("Error initializing ethers or contract:", error);
      }
    };

    initEthers();
    fetchUsers();
  }, []);

  useEffect(() => {
    if (votingContract) {
      updateRoomList();
    }
  }, [votingContract]);

  const fetchUsers = async () => {
    try {
      const usersSnapshot = await db.collection('voters').get();
      const usersData = usersSnapshot.docs.map(doc => doc.data());
      setUsers(usersData.filter(user => user.role !== 'admin'));
    } catch (error) {
      console.error('Error loading user list:', error);
    }
  };

  const updateRoomList = async () => {
    try {
      const rooms = await votingContract.methods.getAllVotingRooms().call();
      setRooms(rooms);
    } catch (err) {
      console.error('ERROR! ' + err.message);
    }
  };

  const handleCreateRoom = async () => {
    try {
      const start = Math.floor(new Date(startDate).getTime() / 1000);
      const end = Math.floor(new Date(endDate).getTime() / 1000);
      await votingContract.methods.createVotingRoom(start, end, roomName).send({ from: account });
      setRoomName('');
      setStartDate('');
      setEndDate('');
      updateRoomList();
    } catch (err) {
      console.error('Error creating voting room: ' + err.message);
    }
  };

  const handleAddCandidate = async () => {
    try {
      await votingContract.methods.addCandidate(selectedRoomId, nameCandidate, ICCandidate).send({ from: account });
      setNameCandidate('');
      setICCandidate('');
    } catch (err) {
      console.error('Error adding candidate: ' + err.message);
    }
  };

  const handleAssignUsers = async () => {
    try {
      const token = localStorage.getItem('jwtToken');
      const payload = { users: selectedUsers, roomID: selectedRoomId };

      const response = await fetch('http://127.0.0.1:8000/assignRoom', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to assign users to the room');
      }

      const responseData = await response.json();
      console.log('Users assigned successfully:', responseData);
    } catch (error) {
      console.error('Error assigning users to the room:', error);
    }
  };

  const handleUserSelect = (walletID, IC) => {
    if (!selectedUsers.includes(walletID)) {
      setSelectedUsers([...selectedUsers, walletID]);
    }
  };

  const handleAddAllUsers = () => {
    const allUsers = users.map(user => user.walletID);
    setSelectedUsers(allUsers);
  };

  const handleRemoveAllUsers = () => {
    setSelectedUsers([]);
  };

  return (
    <div className="main-container">
      <Sidebar />
      <div className="main-content">
        <div id="head" className="text-center">
          <h1>Online Voting System Using Blockchain</h1>
          <div className="button-container">
            <button onClick={() => setActiveSection('defineVotingRoom')} className={`actionButton ${activeSection === 'defineVotingRoom' ? 'active' : ''}`}>
              Define Voting Room
            </button>
            <button onClick={() => setActiveSection('addCandidate')} className={`actionButton ${activeSection === 'addCandidate' ? 'active' : ''}`}>
              Add Candidate
            </button>
            <button onClick={() => setActiveSection('assignUsers')} className={`actionButton ${activeSection === 'assignUsers' ? 'active' : ''}`}>
              Assign Users
            </button>
          </div>
        </div>

        <div className="form-container">
          {activeSection === 'defineVotingRoom' && (
            <div id="defineVotingRoomSection" className="form-section">
              <legend>Define Voting Room</legend>
              <table className="table text-center">
                <tr>
                  <th>Voting Room Name</th>
                  <td colspan="3">
                    <input
                      type="text"
                      value={roomName}
                      onChange={e => setRoomName(e.target.value)}
                    />
                  </td>
                </tr>
                <tr>
                  <th>Voting Start Time</th>
                  <td>
                    <input
                      type="datetime-local"
                      value={startDate}
                      onChange={e => setStartDate(e.target.value)}
                    />
                  </td>
                  <th>Voting End Time</th>
                  <td>
                    <input
                      type="datetime-local"
                      value={endDate}
                      onChange={e => setEndDate(e.target.value)}
                    />
                  </td>
                </tr>
                <tr>
                  <td colspan="4" className="text-center">
                    <button onClick={handleCreateRoom} className="btn btn-outline-primary">
                      Create Room
                    </button>
                  </td>
                </tr>
              </table>
            </div>
          )}

          {activeSection === 'addCandidate' && (
            <div id="addCandidateSection" className="form-section">
              <legend>Add Candidate</legend>
              <table className="table text-center">
                <tr>
                  <th>Select Room</th>
                  <td colspan="3">
                    <select value={selectedRoomId} onChange={e => setSelectedRoomId(e.target.value)}>
                      {rooms.map((room, index) => (
                        <option key={index} value={room.roomID}>
                          {room.name}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
                <tr>
                  <th>Candidate Name</th>
                  <td colspan="3">
                    <input
                      type="text"
                      value={nameCandidate}
                      onChange={e => setNameCandidate(e.target.value)}
                    />
                  </td>
                </tr>
                <tr>
                  <th>Candidate IC</th>
                  <td colspan="3">
                    <input
                      type="text"
                      value={ICCandidate}
                      onChange={e => setICCandidate(e.target.value)}
                    />
                  </td>
                </tr>
                <tr>
                  <td colspan="4" className="text-center">
                    <button onClick={handleAddCandidate} className="btn btn-outline-primary">
                      Add Candidate
                    </button>
                  </td>
                </tr>
              </table>
            </div>
          )}

          {activeSection === 'assignUsers' && (
            <div id="assignUsersSection" className="form-section">
              <legend>Assign Users</legend>
              <table className="table text-center">
                <tr>
                  <th>Select Room</th>
                  <td colspan="3">
                    <select value={selectedRoomId} onChange={e => setSelectedRoomId(e.target.value)}>
                      {rooms.map((room, index) => (
                        <option key={index} value={room.roomID}>
                          {room.name}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
                <tr>
                  <td colspan="4" className="text-center">
                    <button onClick={handleAddAllUsers} className="btn btn-outline-primary">
                      Select All Users
                    </button>
                    <button onClick={handleRemoveAllUsers} className="btn btn-outline-primary">
                      Remove All Users
                    </button>
                  </td>
                </tr>
                {users.map((user, index) => (
                  <tr key={index}>
                    <td>{user.walletID}</td>
                    <td>{user.IC}</td>
                    <td>
                      <button onClick={() => handleUserSelect(user.walletID, user.IC)} className="btn btn-outline-primary">
                        Add
                      </button>
                    </td>
                  </tr>
                ))}
                <tr>
                  <td colspan="4" className="text-center">
                    <button onClick={handleAssignUsers} className="btn btn-outline-primary">
                      Assign Users
                    </button>
                  </td>
                </tr>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageVote;
