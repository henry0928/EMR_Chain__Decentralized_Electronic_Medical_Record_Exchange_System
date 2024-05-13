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
    if ( input["fcn"] === "record" ) { // Only supervisor can create identity
      const response = await ctx.stub.invokeChaincode("IDM", ["verify_role", commit_id], "identity-management");
      let role = response.payload ;
      role = role.toString() ;
      if ( role != "supervisor" ) {
        const log = "Only supervisor can record the transaction ( Wrong commit_id: " + commit_id + " ) " + " (" + input["fcn"] + ")" ;
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

  async get_record(ctx, publicKey) {
    const response = await ctx.stub.invokeChaincode("IDM", ["get_appId", publicKey], "identity-management");
    let appId = response.payload ;
    appId = appId.toString() ;
    const buffer = await ctx.stub.getState(appId);
    if (!buffer || !buffer.length) return { error: "get NOT_FOUND" };
    let buffer_object = JSON.parse(buffer.toString()) ;
    return buffer_object;
  } // get_record()
  
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
