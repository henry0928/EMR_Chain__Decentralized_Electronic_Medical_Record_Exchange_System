const PersonalIdentity = artifacts.require("PersonalIdentity");
const truffleAssert = require('truffle-assertions');

contract("PersonalIdentity", accounts => {
    const owner = accounts[0];
    const newOwner = accounts[1];
    const supervisor = accounts[2];
    const org = "org1";
    const encryptKey = "U2FsdGVkX1/ni1aRYvvJQyXjF7Ffs0oDCIlcZc7CAYs=";

    let personalIdentity;

    before(async () => {
        personalIdentity = await PersonalIdentity.deployed();
    });

    it("should deploy the PersonalIdentity contract", async () => {
        assert(personalIdentity.address !== '');
    });

    it("should set the correct owner", async () => {
        let contractOwner = await personalIdentity.Owner();
        assert.equal(contractOwner, owner, "Owner is not set correctly");
    });

    it("should transfer ownership", async () => {
        await personalIdentity.transferOwnership(newOwner, { from: owner });
        let contractOwner = await personalIdentity.Owner();
        assert.equal(contractOwner, newOwner, "Ownership was not transferred correctly");
    });

    // it("should allow the supervisor to set app", async () => {
    //     await personalIdentity.transferOwnership(supervisor, { from: newOwner });
    //     await personalIdentity.set_app(org, { from: supervisor });
    //     let apps = await personalIdentity.get_app({ from: supervisor });
    //     assert.equal(apps.length, 1, "App was not set correctly");
    //     assert.equal(apps[0], org, "App value is incorrect");
    // });

    it("should allow the owner to set and get private app", async () => {
        result = await personalIdentity.set_app_private(org, encryptKey, { from: newOwner });
        const gasUsed = result.receipt.gasUsed;
        console.log(`Gas used for set_app_private: ${gasUsed}`);
        let retrievedKey = await personalIdentity.get_app_private(org, { from: newOwner });
        assert.equal(retrievedKey, encryptKey, "Private app key is incorrect");
    });

    // it("should not allow non-owner to set private app", async () => {
    //     await truffleAssert.reverts(
    //         personalIdentity.set_app_private(org, encryptKey, { from: newOwner }),
    //         "Ownable: caller is not the owner"
    //     );
    // });

    // it("should not allow non-supervisor to set app", async () => {
    //     await truffleAssert.reverts(
    //         personalIdentity.set_app(org, { from: newOwner }),
    //         "Supervisorable: caller is not the supervisor"
    //     );
    // });

    // it("should not allow non-owner to get private app", async () => {
    //     await truffleAssert.reverts(
    //         personalIdentity.get_app_private(org, { from: newOwner }),
    //         "Ownable: caller is not the owner"
    //     );
    // });
});
