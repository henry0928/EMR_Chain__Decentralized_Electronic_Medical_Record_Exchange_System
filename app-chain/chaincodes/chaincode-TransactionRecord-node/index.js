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

  async record_publicKey(ctx, patient_id, publicKey) {
    const mixId = patient_id + "public" ;
    await ctx.stub.putState(mixId, Buffer.from(publicKey));
    return "record_publicKey() Successfully" ;
  } // record_publicKey()
  
  async record(ctx, patient_id, dp, dc, resource, purpose, status) {
    // THE DATA-STRUCTURE of Identity mapping !!! 

    // key : { Data Subject }
    // value : { Dp : access_info[]  }

    // access_info : {  Dc : string,
    //                  Resource type: string, 
    //                  Purpose: string, 
    //                  Status: string,
    //                  time: string                 
    //               }
    let now = new Date() ;
    now.setUTCHours(now.getUTCHours() + 8);
    let month = Number(now.getMonth()) + 1 ;
    const time = now.getFullYear() + "/" + month + "/" + now.getDate() + "  " + now.getHours() + ":" + now.getMinutes() ;
    let access_info = {
      Dc : dc,
      Resource : resource,
      Purpose : purpose,
      Status : status,
      Time : time
    } ;
    let value ;
    const buffer = await ctx.stub.getState(patient_id);
    if (!buffer || !buffer.length) {
      let access_info_array = new Array() ;
      access_info_array.push(access_info) ;
      value = { [dp] : access_info_array } ;
    } // if 
    else {
      let buffer_object = JSON.parse(buffer.toString()) ;
      buffer_object[dp].push(access_info) ;
      value = buffer_object ; 
    } // else 
    await ctx.stub.putState(patient_id, Buffer.from(JSON.stringify(value)));
    return { Success : "ok",
             Time : time }
  } // record()
} // TSRContract()

exports.contracts = [TSRContract];
