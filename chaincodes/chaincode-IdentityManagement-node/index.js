const { Contract } = require("fabric-contract-api");
const { createSign, createVerify } = require('crypto');

class IDMContract extends Contract {
  constructor() {
    super("IDMContract");
  }

  async instantiate() {
    // function that will be invoked on chaincode instantiation
  }

  async beforeTransaction(ctx){  // To verify the identity who commit the transaction
    const input = ctx.stub.getFunctionAndParameters() ;
    const commit_id = ctx.clientIdentity.getAttributeValue("user_id") ;
    const msp_id = ctx.clientIdentity.getMSPID() ;
    if ( input["fcn"] === "create_identity" ) { // Only supervisor can create identity
      if ( commit_id != "supervisor" ) {
        const log = "Only supervisor can create the instance ( Wrong commit_id: " + commit_id + " ) " + " (" + input["fcn"] + ")" ;
        throw new Error(log) ;   
      } // if 
    } // if
    else if ( input["fcn"] === "consent_doc_role" || input["fcn"] === "revoke_doc_role" ) { // Only supervisor can create identity
      if ( msp_id != "Org2MSP" ) {
        const log = "Only HCA can create/revoke the doctor identity ( Wrong msp_id: " + msp_id + " ) " ;
        throw new Error(log) ;   
      } // if 
    } // else if
    else if ( input["fcn"] === "consent_sup_role" || input["fcn"] === "revoke_sup_role" ) { // Only supervisor can create identity
      if ( msp_id != "Org2MSP" ) {
        const log = "Only MHW can create/revoke the supervisor identity ( Wrong msp_id: " + msp_id + " ) " ;
        throw new Error(log) ;   
      } // if 
    } // else if
  } // beforeTransaction()

  async get(ctx, key) {
    const buffer = await ctx.stub.getState(key);
    if (!buffer || !buffer.length) return { error: "get NOT_FOUND" };
    let buffer_object = JSON.parse(buffer.toString()) ;
    console.log(buffer_object) ; 
    return buffer_object;
  } // for testing the ledger 
  
  async create_identity(ctx, p_key, app_id, did, x509) {
    const buffer = await ctx.stub.getState(p_key);
    if ( buffer.length ) return { error: "(create_identity)DID EXIST" };;  

    // THE DATA-STRUCTURE of Identity mapping !!! 

    // key : { main identity public key }
    // value : { AppId : app_id,
    //           Role : role, 
    //           DID : did, 
    //           x509Identity : x509 }

    let value = {
      AppId : app_id,
      Role : "patient",
      DID : did,
      x509Identity : x509
    } ;
    
    await ctx.stub.putState(p_key, Buffer.from(JSON.stringify(value)));
    return { success: "OK (create_identity)"} ;   
  } // create_identity()

  async consent_doc_role(ctx, did) {
    const mspId = ctx.clientIdentity.getMSPID() ;
    const iterator = await ctx.stub.getQueryResult("{\"selector\":{\"DID\":\"" + did + "\"}}");
    let res = await iterator.next();
    const key = res.value.key ;
    let value = JSON.parse(res.value.value.toString("utf8")) ;
    await iterator.close() ; // close the iterator
    value["Role"] = "doctor" ;
    await ctx.stub.putState(key, Buffer.from(JSON.stringify(value)));
    return { success: "OK (consent_doc_role)",
             MSP: mspId } ;   
  } // consent_doc_role()

  async consent_sup_role(ctx, did) {
    const mspId = ctx.clientIdentity.getMSPID() ;
    const iterator = await ctx.stub.getQueryResult("{\"selector\":{\"DID\":\"" + did + "\"}}");
    let res = await iterator.next();
    const key = res.value.key ;
    let value = JSON.parse(res.value.value.toString("utf8")) ;
    await iterator.close() ; // close the iterator
    value["Role"] = "supervisor" ;
    await ctx.stub.putState(key, Buffer.from(JSON.stringify(value)));
    return { success: "OK (consent_sup_role)",
             MSPID: mspId } ;   
  } // consent_sup_role()

  async revoke_doc_role(ctx, did) {
    const mspId = ctx.clientIdentity.getMSPID() ;
    const iterator = await ctx.stub.getQueryResult("{\"selector\":{\"DID\":\"" + did + "\"}}");
    let res = await iterator.next();
    const key = res.value.key ;
    let value = JSON.parse(res.value.value.toString("utf8")) ;
    await iterator.close() ; // close the iterator
    if ( value["Role"] != "doctor" )
      return { Error: did + " identity is not doctor!!" } ;
    value["Role"] = "patient" ; // revoke the identity, back to patient
    await ctx.stub.putState(key, Buffer.from(JSON.stringify(value)));
    return { success: "OK (revoke_doc_role)",
             MSP: mspId } ;   
  } // revoke_doc_role()

  async revoke_sup_role(ctx, did) {
    const mspId = ctx.clientIdentity.getMSPID() ;
    const iterator = await ctx.stub.getQueryResult("{\"selector\":{\"DID\":\"" + did + "\"}}");
    let res = await iterator.next();
    const key = res.value.key ;
    let value = JSON.parse(res.value.value.toString("utf8")) ;
    await iterator.close() ; // close the iterator
    if ( value["Role"] != "supervisor" )
      return { Error: did + " identity is not supervisor!!" } ;
    value["Role"] = "patient" ; // revoke the identity, back to patient
    await ctx.stub.putState(key, Buffer.from(JSON.stringify(value)));
    return { success: "OK (revoke_sup_role)",
             MSP: mspId } ;   
  } // revoke_doc_role()

  async login(ctx, p_key, signature, message) {
    // 使用公鑰verify
    const verifier = createVerify('rsa-sha256');
    verifier.update(message);
    const isVerified = verifier.verify(p_key, signature, 'hex');
    if ( isVerified ) { 
      const buffer = await ctx.stub.getState(p_key);
      if (!buffer || !buffer.length) return { error: "(login) Can't find the account, Please regist first!!" };
      return buffer.toString() ;
    } // if 

    return { Error : "Verify Failed! You are not the user!!"} ;
  } // login()
} // IDMContract()

exports.contracts = [IDMContract];
