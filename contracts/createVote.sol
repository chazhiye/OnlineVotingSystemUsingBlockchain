// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract CreateVote {
    // Struct to represent a poll room
    struct PollRoom {
        address creator;
        string title;
        uint256 createdAt;
        address[] voters;
    }

    // Array to store all created poll rooms
    PollRoom[] public pollRooms;

    // Event emitted when a new poll room is created
    event PollRoomCreated(address indexed creator, string title, uint256 indexed roomId);

    // Function to create a new poll room
    function createPollRoom(string memory _title) external {
        // Create a new poll room instance
        address[] memory _voters;
        pollRooms.push(PollRoom(msg.sender, _title, block.timestamp, _voters));

        emit PollRoomCreated(msg.sender, _title, pollRooms.length - 1);
    }

    // Function to add a voter to a poll room
    function addVoter(uint256 roomId, address voter) external {
        require(roomId < pollRooms.length, "Invalid poll room ID");
        pollRooms[roomId].voters.push(voter);
    }

    // Function to get the total number of poll rooms
    function getPollRoomCount() external view returns (uint256) {
        return pollRooms.length;
    }
}
