/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Gateway, Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');
const { buildCAClient, registerAndEnrollUser, enrollAdmin, registerAndEnrollUserV2} = require('../../../app-chain/app/CAUtil.js');
const { buildCCPOrg1, buildCCPOrg2, buildWallet } = require('../../../app-chain/app/AppUtil.js');
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
const org1ADMIN = 'org1ADMIN';
const org2ADMIN = 'org2ADMIN';
const cgmhPublicKey = "0x3E014E5c311a7D6F652CA4F8bb016f4338A44118" ;



function prettyJSONString(inputString) {
	return JSON.stringify(JSON.parse(inputString), null, 2);
}

async function main() {
	try {
		// build an in memory object with the network configuration (also known as a connection profile)
        const ccp = buildCCPOrg1();
		// const ccp2 = buildCCPOrg2();

		// build an instance of the fabric ca services client based on
		// the information in the network configuration

		const caClient = buildCAClient(FabricCAServices, ccp, 'ca.org1.example.com');
		// const ca2Client = buildCAClient(FabricCAServices, ccp2, 'ca.org2.example.com');
		// const caClient = buildCAClient(FabricCAServices, ccp, 'ca.org2.example.com');

		// setup the wallet to hold the credentials of the application user
		const wallet = await buildWallet(Wallets, walletPath);
		// const wallet2 = await buildWallet(Wallets, walletPath2);

		// in a real application this would be done on an administrative flow, and only once
		await enrollAdmin(caClient, wallet, mspOrg1);
		// await enrollAdmin(ca2Client, wallet2, mspOrg2);

		// in a real application this would be done only when a new user was required to be added
		// and would be part of an administrative flow
		await registerAndEnrollUser(caClient, wallet, mspOrg1, org1ADMIN); // Enroll the org1ADMIN
		await registerAndEnrollUser(caClient, wallet, mspOrg1, "cgmh"); // Enroll the 長庚醫院
		// await registerAndEnrollUser(ca2Client, wallet2, mspOrg2, org2ADMIN); // Enroll the org2ADMIN

		// Create a new gateway instance for interacting with the fabric network.
		// In a real application this would be done as the backend server session is setup for
		// a user that has been verified.
		let gateway = new Gateway();
		try {
			// setup the gateway instance
			// The user will now be able to create connections to the fabric network and be able to
			// submit transactions and query. All transactions submitted by this gateway will be
			// signed by this user using the credentials stored in the wallet.
			await gateway.connect(ccp, {
				wallet : wallet,
				identity: org1ADMIN,
				discovery: { enabled: true, asLocalhost: true } // using asLocalhost as this gateway is using a fabric network deployed locally
			});

			// Build a network instance based on the channel where the smart contract is deployed
			const network = await gateway.getNetwork(IdentityManagement);

			// Get the contract from the network.
			const contract = network.getContract(IDM);
			
			console.log("IdentityManagement channel......") ;
			let info = await contract.submitTransaction("create_identity", cgmhPublicKey, "cgmh", "none", "none") ;
			console.log(JSON.parse(info.toString())) ;
			info = await contract.submitTransaction("consent_sup_role", "none") ;
			console.log(JSON.parse(info)) ;
			info = await contract.submitTransaction("get", cgmhPublicKey) ;
			console.log(JSON.parse(info.toString())) ;
			info = await contract.submitTransaction("verify_role", "cgmh") ;
			console.log(info.toString()) ;
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
