const IdentityManager = artifacts.require("IdentityManager");
const PersonalIdentity = artifacts.require("PersonalIdentity");

module.exports = function(deployer) {
  deployer.deploy(IdentityManager);
  deployer.deploy(PersonalIdentity);
};
