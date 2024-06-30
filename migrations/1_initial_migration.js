const Migrations = artifacts.require("Migrations");
const Voting = artifacts.require("Voting");
const CreateVote = artifacts.require("CreateVote");

module.exports = function (deployer) {
  deployer.deploy(Migrations);
  deployer.deploy(Voting);
  deployer.deploy(CreateVote);
};
