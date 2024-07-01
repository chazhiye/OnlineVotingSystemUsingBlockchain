const Migrations = artifacts.require("Migrations");
const Voting = artifacts.require("Voting");

const EventEmitter = require('events');
EventEmitter.defaultMaxListeners = 30; // Increase the limit as needed
module.exports = function (deployer) {
  deployer.deploy(Migrations);
  deployer.deploy(Voting);

};
