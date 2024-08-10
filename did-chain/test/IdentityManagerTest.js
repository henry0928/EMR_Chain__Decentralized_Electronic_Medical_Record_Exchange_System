const IdentityManager = artifacts.require("IdentityManager");
const truffleAssert = require('truffle-assertions');
const PersonalIdentity = artifacts.require("PersonalIdentity");

contract("IdentityManager", accounts => {
    const admin = accounts[0];
    // const org = accounts[1];
    const user = "0x2C46BcB6dA3ae85dA881edeEd4eC2fE92670f90F";
    const DID = "2753fb3e2880179e78416286320f82a02e57fe4c88c0cdcdd8255c7289235662";

    let identityManager;

    before(async () => {
        identityManager = await IdentityManager.deployed();
    });

    it("should deploy the IdentityManager contract", async () => {
        assert(identityManager.address !== '');
    });

    // it("should add an organization", async () => {
    //     let result = await identityManager.addOrg(org, { from: admin });
    //     truffleAssert.eventEmitted(result, 'ContractCreate');
    //     const gasUsed = result.receipt.gasUsed;
    //     console.log(`Gas used for addOrg: ${gasUsed}`);
    // });

    it("should add a user", async () => {
        let result = await identityManager.addUser(DID, { from: admin });
        const gasUsed = result.receipt.gasUsed;
        console.log(`Gas used for addUser: ${gasUsed}`);
    });

    it("should bind a wallet to the user", async () => {
        let result = await identityManager.bindWallet(DID, user, 1, { from: admin });
        truffleAssert.eventEmitted(result, 'ContractCreate');
        const gasUsed = result.receipt.gasUsed;
        console.log(`Gas used for bindWallet: ${gasUsed}`);
    });

    it("should authenticate the user", async () => {
        // Create message hash and sign it
        let messageHash = web3.utils.soliditySha3({ type: 'string', value: DID });
        let signature = await web3.eth.sign(messageHash, user);

        let result = await identityManager.authentication(DID, messageHash, signature, { from: user });
        const gasUsed = result.receipt.gasUsed;
        console.log(`Gas used for authentication: ${gasUsed}`);

        let isAuthenticated = await identityManager.authentication.call(DID, messageHash, signature);
        assert.isTrue(isAuthenticated, "Authentication failed");
    });
});
