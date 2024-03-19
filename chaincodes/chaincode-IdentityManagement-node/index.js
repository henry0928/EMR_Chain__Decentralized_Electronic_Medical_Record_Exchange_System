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
    const msp_id = ctx.clientIdentity.getAttributeValue("regist_msp") ;
    if ( input["fcn"] === "create_identity" ) { // Only supervisor can create identity
      if ( commit_id != "supervisor" ) {
        const log = "Only admin can create the instance ( Wrong commit_id: " + commit_id + " ) " + " (" + input["fcn"] + ")" ;
        throw new Error(log) ;   
      } // if 
    } // if    
  } // beforeTransaction()

  async get(ctx, key) {
    const buffer = await ctx.stub.getState(key);
    if (!buffer || !buffer.length) return { error: "get NOT_FOUND" };
    let buffer_object = JSON.parse(buffer.toString()) ;
    console.log(buffer_object) ; 
    return buffer_object;
  } // for testing the ledger 
  
  async create_identity(ctx, p_key, app_id) {
    const buffer = await ctx.stub.getState(p_key);
    if ( buffer.length ) return { error: "(create_identity)DID EXIST" };;  

    // THE DATA-STRUCTURE of Identity mapping !!! 

    // key : { DID }
    // value : { app_id }

    await ctx.stub.putState(p_key, Buffer.from(JSON.stringify(app_id)));
    return { success: "OK (create_identity)"} ;   
  } // create_identity()

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
