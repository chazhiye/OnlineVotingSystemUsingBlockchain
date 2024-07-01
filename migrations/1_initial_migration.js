const Migrations = artifacts.require("Migrations");
const Voting = artifacts.require("Voting");

module.exports = function (deployer) {
  deployer.deploy(Migrations);
  deployer.deploy(Voting);

};
