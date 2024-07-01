// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Voting {
    struct Room {
        uint256 id;
        uint256 startDate;
        uint256 endDate;
        string name;
    }

    struct Candidate {
        uint256 id;
        string name;
        string IC;
        uint256 voteCount;
    }

    Room[] public votingRooms;
    mapping(uint256 => Candidate[]) public roomCandidates;
    mapping(address => mapping(uint256 => bool)) public votes;
    mapping(uint256 => bytes32[]) public roomTransactionHashes;

    uint256 public roomCount = 0;
    uint256 public candidateCount = 0;

    event RoomCreated(uint256 id, uint256 startDate, uint256 endDate, string name);
    event CandidateAdded(uint256 roomId, uint256 id, string name, string IC);
    event CandidateEdited(uint256 roomId, uint256 candidateId, string newName);
    event CandidateDeleted(uint256 roomId, uint256 candidateId);
    event RoomDeleted(uint256 id);
    event Voted(uint256 roomId, uint256 candidateID);
    event DebugHashes(bytes32[] hashes); 

    function createVotingRoom(uint256 _startDate, uint256 _endDate, string memory _name) public {
        require(_startDate <= _endDate, "Start date must be before end date");
        votingRooms.push(Room(roomCount, _startDate, _endDate, _name));
        emit RoomCreated(roomCount, _startDate, _endDate, _name);
        roomCount++;
    }

    function addCandidate(uint256 roomId, string memory name, string memory IC) public {
        require(roomId < roomCount, "Invalid room ID");
        roomCandidates[roomId].push(Candidate(candidateCount, name, IC, 0));
        emit CandidateAdded(roomId, candidateCount, name, IC);
        candidateCount++;
    }

    function vote(uint256 roomId, uint256 candidateID) public {
        require(roomId < roomCount, "Invalid room ID");
        require(!votes[msg.sender][roomId], "You have already voted in this room");

        Room memory room = votingRooms[roomId];
        require(block.timestamp >= room.startDate && block.timestamp <= room.endDate, "Voting is not open");

        Candidate[] storage candidates = roomCandidates[roomId];
        bool validCandidate = false;
        for (uint i = 0; i < candidates.length; i++) {
            if (candidates[i].id == candidateID) {
                candidates[i].voteCount++;
                validCandidate = true;
                break;
            }
        }
        require(validCandidate, "Invalid candidate ID");

        votes[msg.sender][roomId] = true;

        emit Voted(roomId, candidateID);
    }

    function getAllVotingRooms() public view returns (Room[] memory) {
        Room[] memory roomsMemory = new Room[](votingRooms.length);
        for (uint i = 0; i < votingRooms.length; i++) {
            roomsMemory[i] = votingRooms[i];
        }
        return roomsMemory;
    }

    function getRoomCandidates(uint256 roomId) public view returns (Candidate[] memory) {
        require(roomId < roomCount, "Invalid room ID");
        return roomCandidates[roomId];
    }

    function getCandidate(uint256 candidateID) public view returns (Candidate memory) {
        for (uint256 i = 0; i < roomCount; i++) {
            for (uint256 j = 0; i < roomCandidates[i].length; j++) {
                if (roomCandidates[i][j].id == candidateID) {
                    return roomCandidates[i][j];
                }
            }
        }
        revert("Candidate not found");
    }

    function editCandidate(uint256 roomId, uint256 candidateId, string memory newName) public {
        require(roomId < roomCount, "Invalid room ID");
        Candidate[] storage candidates = roomCandidates[roomId];
        for (uint256 i = 0; i < candidates.length; i++) {
            if (candidates[i].id == candidateId) {
                candidates[i].name = newName;
                emit CandidateEdited(roomId, candidateId, newName);
                return;
            }
        }
        revert("Candidate not found in the specified room");
    }

    function deleteCandidate(uint256 roomId, uint256 candidateId) public {
        require(roomId < roomCount, "Invalid room ID");
        Candidate[] storage candidates = roomCandidates[roomId];
        for (uint256 i = 0; i < candidates.length; i++) {
            if (candidates[i].id == candidateId) {
                candidates[i] = candidates[candidates.length - 1];
                candidates.pop();
                emit CandidateDeleted(roomId, candidateId);
                return;
            }
        }
        revert("Candidate not found in the specified room");
    }

    function deleteAllCandidates(uint256 roomId) public {
        require(roomId < roomCount, "Invalid room ID");
        delete roomCandidates[roomId];
    }

    function deleteVotingRoom(uint256 roomId) public {
        require(roomId < roomCount, "Invalid room ID");

        delete roomCandidates[roomId];
        delete roomTransactionHashes[roomId];

        if (roomId != votingRooms.length - 1) {
            votingRooms[roomId] = votingRooms[votingRooms.length - 1];
        }
        votingRooms.pop();
        roomCount--;

        emit RoomDeleted(roomId);
    }

    function storeTransactionHash(uint256 roomId, bytes32 txHash) public {
        require(roomId < roomCount, "Invalid room ID");
        roomTransactionHashes[roomId].push(txHash);
        emit DebugHashes(roomTransactionHashes[roomId]);
    }

    function getRoomTransactionHashes(uint256 roomId) public view returns (bytes32[] memory) {
        require(roomId < roomCount, "Invalid room ID");
        return roomTransactionHashes[roomId];
    }
}
