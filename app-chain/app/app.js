/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Gateway, Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');
const { buildCAClient, registerAndEnrollUser, enrollAdmin} = require('./CAUtil.js');
const { buildCCPOrg1, buildCCPOrg2, buildWallet } = require('./AppUtil.js');
const { assert } = require('console');

const channelName = process.env.CHANNEL_NAME || 'my-channel1';
const chaincodeName = process.env.CHAINCODE_NAME || 'chaincode1';
const AccessControl = "access-control" ;
const ACL = "ACL" ;
const TransactionRecord = "transaction-record" ; 
const TSR = "TSR" ;
const IdentityManagement = "identity-management" ; 
const IDM = "IDM" ;

const mspOrg1 = 'Org1MSP';
const mspOrg2 = 'Org2MSP';
const walletPath = path.join(__dirname, 'wallet');
const walletPath2 = path.join(__dirname, 'wallet2');
const org1UserId = 'henry';
const supervisorId = 'supervisor';

const cycu_url = "https://cycu.com.tw" ;
const nycu_url = "https://nycu.com,tw" ;

function prettyJSONString(inputString) {
	return JSON.stringify(JSON.parse(inputString), null, 2);
}

// pre-requisites:
// - fabric-sample two organization test-network setup with two peers, ordering service,
//   and 2 certificate authorities
//         ===> from directory /fabric-samples/test-network
//         ./network.sh up createChannel -ca
// - Use any of the asset-transfer-basic chaincodes deployed on the channel "mychannel"
//   with the chaincode name of "basic". The following deploy command will package,
//   install, approve, and commit the javascript chaincode, all the actions it takes
//   to deploy a chaincode to a channel.
//         ===> from directory /fabric-samples/test-network
//         ./network.sh deployCC -ccn basic -ccp ../asset-transfer-basic/chaincode-javascript/ -ccl javascript
// - Be sure that node.js is installed
//         ===> from directory /fabric-samples/asset-transfer-basic/application-javascript
//         node -v
// - npm installed code dependencies
//         ===> from directory /fabric-samples/asset-transfer-basic/application-javascript
//         npm install
// - to run this test application
//         ===> from directory /fabric-samples/asset-transfer-basic/application-javascript
//         node app.js

// NOTE: If you see  kind an error like these:
/*
    2020-08-07T20:23:17.590Z - error: [DiscoveryService]: send[mychannel] - Channel:mychannel received discovery error:access denied
    ******** FAILED to run the application: Error: DiscoveryService: mychannel error: access denied

   OR

   Failed to register user : Error: fabric-ca request register failed with errors [[ { code: 20, message: 'Authentication failure' } ]]
   ******** FAILED to run the application: Error: Identity not found in wallet: appUser
*/
// Delete the /fabric-samples/asset-transfer-basic/application-javascript/wallet directory
// and retry this application.
//
// The certificate authority must have been restarted and the saved certificates for the
// admin and application user are not valid. Deleting the wallet store will force these to be reset
// with the new certificate authority.
//

/**
 *  A test application to show basic queries operations with any of the asset-transfer-basic chaincodes
 *   -- How to submit a transaction
 *   -- How to query and check the results
 *
 * To see the SDK workings, try setting the logging to show on the console before running
 *        export HFC_LOGGING='{"debug":"console"}'
 */

async function main() {
	try {
		// build an in memory object with the network configuration (also known as a connection profile)
        const ccp = buildCCPOrg1();
		const ccp2 = buildCCPOrg2();

		// build an instance of the fabric ca services client based on
		// the information in the network configuration

		const caClient = buildCAClient(FabricCAServices, ccp, 'ca.org1.example.com');
		const ca2Client = buildCAClient(FabricCAServices, ccp2, 'ca.org2.example.com');
		// const caClient = buildCAClient(FabricCAServices, ccp, 'ca.org2.example.com');

		// setup the wallet to hold the credentials of the application user
		const wallet = await buildWallet(Wallets, walletPath);
		const wallet2 = await buildWallet(Wallets, walletPath2);

		// in a real application this would be done on an administrative flow, and only once
		await enrollAdmin(caClient, wallet, mspOrg1);
		await enrollAdmin(ca2Client, wallet2, mspOrg2);

		// in a real application this would be done only when a new user was required to be added
		// and would be part of an administrative flow
		await registerAndEnrollUser(caClient, wallet, mspOrg1, org1UserId);
		await registerAndEnrollUser(caClient, wallet, mspOrg1, supervisorId); // Enroll the supervisor

		await registerAndEnrollUser(ca2Client, wallet2, mspOrg2, supervisorId); // Enroll the supervisor

		// Create a new gateway instance for interacting with the fabric network.
		// In a real application this would be done as the backend server session is setup for
		// a user that has been verified.
		let gateway = new Gateway();
		try {
			await gateway.connect(ccp, {
				wallet,
				identity: supervisorId,
				discovery: { enabled: true, asLocalhost: true } // using asLocalhost as this gateway is using a fabric network deployed locally
			});

			// Build a network instance based on the channel where the smart contract is deployed
			const network = await gateway.getNetwork(AccessControl);

			// Get the contract from the network.
			const contract = network.getContract(ACL);

			let info = await contract.submitTransaction('create_patient_instance', 'henry');
			console.log(JSON.parse(info.toString())) ;
            info = await contract.submitTransaction('get', 'henry');
			console.log(JSON.parse(info.toString()));
			console.log("create_patient_instance Success!");
			
		} // try
		finally {
			// Disconnect from the gateway when the application is closing
			// This will close all connections to the network
			gateway.disconnect();
			// gateway = new Gateway() ;
		} // finally
		
		gateway = new Gateway() ;
		try {
			// setup the gateway instance
			// The user will now be able to create connections to the fabric network and be able to
			// submit transactions and query. All transactions submitted by this gateway will be
			// signed by this user using the credentials stored in the wallet.
			await gateway.connect(ccp, {
				wallet,
				identity: org1UserId,
				discovery: { enabled: true, asLocalhost: true } // using asLocalhost as this gateway is using a fabric network deployed locally
			});

			// Build a network instance based on the channel where the smart contract is deployed
			const network = await gateway.getNetwork(AccessControl);

			// Get the contract from the network.
			const contract = network.getContract(ACL);

			// Initialize a set of asset data on the channel using the chaincode 'InitLedger' function.
			// This type of transaction would only be run once by an application the first time it was started after it
			// deployed the first time. Any updates to the chaincode deployed later would likely not need to run
			// an "init" type function.

			// info = await contract.createTransaction("create_patient_instance").setTransient({"pointer" : cycu_url}).submit("emma","cycu", "0x1204");
			// console.log(JSON.parse(info.toString())) ;
            // info = await contract.submitTransaction('get', 'emma');
			// console.log("create_patient_instance Success!");
			// console.log(JSON.parse(info.toString())) ;

			let info = await contract.createTransaction("update_instance").setTransient({"pointer" : nycu_url}).submit("henry", mspOrg1, "0x0928");
			console.log(JSON.parse(info.toString())) ;
			info = await contract.createTransaction("update_instance").setTransient({"pointer" : cycu_url}).submit("henry", mspOrg1, "0x1111");
			console.log(JSON.parse(info.toString())) ;
			info = await contract.submitTransaction("get", "henry") ;
			console.log(JSON.parse(info.toString())) ;
			console.log("update_instance Success!");

			info = await contract.submitTransaction("update_hash", "henry", mspOrg1, "0x1105") ;
			console.log(JSON.parse(info.toString())) ;
			info = await contract.submitTransaction("get", "henry") ;
			console.log(JSON.parse(info.toString())) ;
			console.log("update_hash Success!");

			info = await contract.submitTransaction("consent_access", "henry", mspOrg1) ;
			console.log(JSON.parse(info.toString())) ;
			info = await contract.submitTransaction("get", "henry") ;
			console.log(JSON.parse(info.toString())) ;
			console.log("consent_access Success!");

			// info = await contract.submitTransaction("authorization", "henry", "test", "test", req) ;
			// console.log("authorization Success!");
			// console.log(info.toString()) ;
			
		} // try 
		finally {
			// Disconnect from the gateway when the application is closing
			// This will close all connections to the network
			gateway.disconnect();
		} // finally
		gateway = new Gateway() ;
		try {
			// setup the gateway instance
			// The user will now be able to create connections to the fabric network and be able to
			// submit transactions and query. All transactions submitted by this gateway will be
			// signed by this user using the credentials stored in the wallet.
			await gateway.connect(ccp, {
				wallet,
				identity: org1UserId,
				discovery: { enabled: true, asLocalhost: true } // using asLocalhost as this gateway is using a fabric network deployed locally
			});

			// Build a network instance based on the channel where the smart contract is deployed
			const network = await gateway.getNetwork(TransactionRecord);

			// Get the contract from the network.
			const contract = network.getContract(TSR);
			
			console.log("TransactionRecord channel......") ;
			let info = await contract.submitTransaction("record", "henry", "nycu", "cycu", "observation", "health", "approve") ;
			console.log(JSON.parse(info.toString())) ;
			info = await contract.submitTransaction("record", "henry", "nycu", "ntu", "condition", "insurance", "approve") ;
			console.log(JSON.parse(info.toString())) ;
			info = await contract.submitTransaction("get", "henry") ;
			console.log(JSON.parse(info.toString())) ;
			
		} // try 
		finally {
			// Disconnect from the gateway when the application is closing
			// This will close all connections to the network
			gateway.disconnect();
		} // finally
		gateway = new Gateway() ;
		try {
			// setup the gateway instance
			// The user will now be able to create connections to the fabric network and be able to
			// submit transactions and query. All transactions submitted by this gateway will be
			// signed by this user using the credentials stored in the wallet.
			await gateway.connect(ccp2, {
				wallet : wallet2,
				identity: supervisorId,
				discovery: { enabled: true, asLocalhost: true } // using asLocalhost as this gateway is using a fabric network deployed locally
			});

			// Build a network instance based on the channel where the smart contract is deployed
			const network = await gateway.getNetwork(IdentityManagement);

			// Get the contract from the network.
			const contract = network.getContract(IDM);
			
			console.log("IdentityManagement channel......") ;
			let info = await contract.submitTransaction("create_identity", "henry", "henry0928", "123456789", "0000") ;
			console.log(JSON.parse(info.toString())) ;
			info = await contract.submitTransaction("create_identity", "emma", "emma1204", "98765432111", "1111") ;
			console.log(JSON.parse(info.toString())) ;
			info = await contract.submitTransaction("consent_doc_role", "123456789") ;
			console.log(JSON.parse(info)) ;
			info = await contract.submitTransaction("consent_sup_role", "98765432111") ;
			console.log(JSON.parse(info)) ;
			info = await contract.submitTransaction("get", "henry") ;
			console.log(JSON.parse(info.toString())) ;
			info = await contract.submitTransaction("get", "emma") ;
			console.log(JSON.parse(info.toString())) ;
			
		} // try 
		finally {
			// Disconnect from the gateway when the application is closing
			// This will close all connections to the network
			gateway.disconnect();
		} // finally

	} catch (error) {
		console.error(`******** FAILED to run the application: ${error}`);
		process.exit(1);
	}
}

main();
