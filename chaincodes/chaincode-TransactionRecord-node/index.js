const { Contract } = require("fabric-contract-api");
const { createSign, createVerify } = require('crypto');

class TSRContract extends Contract {
  constructor() {
    super("TSRContract");
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
  
  async record(ctx, p_key, app_id) {
    const buffer = await ctx.stub.getState(p_key);
    if ( buffer.length ) return { error: "(create_identity)DID EXIST" };;  

    // THE DATA-STRUCTURE of Identity mapping !!! 

    // key : { Data Owner, Data Requester }
    // value : { Record }

    await ctx.stub.putState(p_key, Buffer.from(JSON.stringify(app_id)));
    return { success: "OK (create_identity)"} ;   
  } // record()
} // TSRContract()

exports.contracts = [TSRContract];
