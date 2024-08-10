const { Contract } = require("fabric-contract-api");
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// const shim = require('fabric-shim');

class ACLContract extends Contract {
  constructor() {
    super("ACLContract");
  }

  async instantiate() {
    // function that will be invoked on chaincode instantiation
  }

  async beforeTransaction(ctx){  // To verify the identity who commit the transaction
    const input = ctx.stub.getFunctionAndParameters() ;
    const commit_id = ctx.clientIdentity.getAttributeValue("user_id") ;
    const peer_id = ctx.clientIdentity.getAttributeValue("peer") ;
    if ( input["fcn"] === "create_patient_instance" ) { // Only supervisor can create instance
      const response = await ctx.stub.invokeChaincode("IDM", ["verify_role", commit_id], "identity-management");
      let role = response.payload ;
      role = role.toString() ;
      if ( role != "supervisor" ) {
        const log = "Only admin can create the instance ( Wrong role: " + role + " ) " + " (" + input["fcn"] + ")" ;
        throw new Error(log) ;   
      } // if 
    } // if 
    else if ( input["fcn"] === "consent_access" || input["fcn"] === "revoke_access" ) {
      if ( commit_id != input["params"][0] ) { // input["params"][0] == patient_id
        const log = "User_ID is NOT MATCH, Reject transaction!!! ( Wrong commit_id: " + commit_id + " ) " + " (" + input["fcn"] + ")" ;
        throw new Error(log) ;    
      } // if     
    } // if
    else if ( input["fcn"] === "update_hash" || input["fcn"] === "update_instance" ) { // Only health-provider(doctor) can update
      const response = await ctx.stub.invokeChaincode("IDM", ["verify_role", commit_id], "identity-management");
      let role = response.payload ;
      role = role.toString() ;
      if ( role != "doctor" ) {
        const log = "Hospital_ID is NOT MATCH, Reject transaction!!! ( Wrong role: " + role + " ) " +  "(" + input["fcn"] + ")" ;
        throw new Error(log) ;    
      } // if
    } // else if 
      
  } // beforeTransaction()

  async get_public(ctx, key) {
    const buffer = await ctx.stub.getState(key);
    if (!buffer || !buffer.length) return { error: "get NOT_FOUND" };
    return buffer.toString();
  } // for testing the ledger 

  async get(ctx, key) {
    const buffer = await ctx.stub.getState(key);
    if (!buffer || !buffer.length) return { error: "get NOT_FOUND" };
    let buffer_object = JSON.parse(buffer.toString()) ;
    //buffer_object["success"] = "OK" ; 
    console.log(buffer_object) ; 
    return buffer_object;
  } // for testing the ledger 
  
  async create_patient_instance(ctx, patient_id) {
    const buffer = await ctx.stub.getState(patient_id);
    if ( buffer.length ) return { error: "(create_patient_instance)Patient EXIST" };;  
    // const transient = ctx.stub.getTransient();
    // const _pointer = transient.get("pointer").toString("base64");  // need to fix the url problem // remember that the upload url will be encrypt!!!!
    // const level = 4 ; // to get the hospital-level from did chain

    // THE DATA-STRUCTURE of Access Control instance !!! 

    // key : { patient }
    // value : { hospital_id : hospital_info_object }

    // Hospital level from low to high will be 4, 3, 2, 1
    // 1 -> 醫學中心
    // 2 -> 區域醫院
    // 3 -> 地區醫院
    // 4 -> 基層診所

    // const hospital_info_object = {
    //   level : _level,
    //   open_access : false,
    //   pointer : _pointer,
    //   hash : _hash
    // } ;
    // let value = {
    //   [hospital_id] : hospital_info_object //  hospital_DID -> info_object
    // } ;

    // const _creater = ctx.stub.getMspID() ; // use getMspID() may get the another mspID(i guess because the transaction is
    // commit by another org)
    const _creater = ctx.clientIdentity.getAttributeValue("user_id") ; 
    let value = {
      Creater : _creater // To record the creator of access control instance 
    } ;

    await ctx.stub.putState(patient_id, Buffer.from(JSON.stringify(value)));
    return { success: "OK (create_patient_instance)", 
             DataOwner: patient_id,
           } ;   
  } // create_patient_instance()

  async update_instance(ctx, patient_id, hospital_id, _pointer, _hash) {
    const buffer = await ctx.stub.getState(patient_id);
    if (!buffer || !buffer.length) return { error: "(update_instance)Patient NOT_FOUND" };
    // const transient = ctx.stub.getTransient();
    // const _pointer = transient.get("pointer").toString("base64");  // need to fix the url problem // remember that the upload url will be encrypt!!!!
    let buffer_object = JSON.parse(buffer.toString()) ;
    const response = await ctx.stub.invokeChaincode("IDM", ["getHealthLevel", hospital_id], "identity-management");
    let _level = response.payload ;
    const level = _level.toString() ;
    const value = {
      level : level,
      open_access : false,
      pointer : _pointer,
      hash : _hash
    }
    buffer_object[hospital_id] = value ; // append a new hospital infomation for patient
    await ctx.stub.putState(patient_id, Buffer.from(JSON.stringify(buffer_object))) ;
    return { success : "OK (update_instance)" } ; 
  } // update_instance()

  async update_hash(ctx, patient_id, hospital_id, new_hash) {
    const buffer = await ctx.stub.getState(patient_id);
    if (!buffer || !buffer.length) return { error: "(update_hash)Patient NOT_FOUND" };
    let buffer_object = JSON.parse(buffer.toString()) ;
    buffer_object[hospital_id]["hash"] = new_hash ; 
    await ctx.stub.putState(patient_id, Buffer.from(JSON.stringify(buffer_object)));
    return { success : "OK (update_hash)" } ; 
  } // update_hash()

  async authorization(ctx, patient_id, patient_p_key, doctor_p_key, patient_signature, doctor_signature, self_level, request_id, hospitalDID) {
    // patient_id : 病患app_id
    // doctor_p_key : 想要存取其他醫院health-data的doctor main identity public key
    // signature : patient and doctor signature
    // request_id : object, hospital_id : hospital_name, 因無法使用array型傳遞 使用object取代
    // hospitalDID : need to put in the JWT token to make share the token is using by hospital
    let result = {} ;// must be a pair with hospital_id -> url ;

    // The patient_signature, hospital_signature are for digital signature use !!!
    // also patient_p_key and doctor_p_key either
    // const appIdRes = await ctx.stub.invokeChaincode("IDM", ["get_appID", patient_p_key], "identity-management"); // 先去驗證簽名的人是否就是病患
    // let appId = appIdRes.payload ;
    // if ( appId.toString() != patient_id.toString() )
    //   return "You are not the identity holder of user!!!" ;

    const patientRes = await ctx.stub.invokeChaincode("IDM", ["authenticate_identity", patient_p_key, patient_signature, patient_id], "identity-management"); // 驗證簽名人角色是否是病患
    let pRole = patientRes.payload ;
    pRole = pRole.toString() ;
    if ( pRole != "patient" )
      return "You are not patient! (authorization)" ;
    const doctorRes = await ctx.stub.invokeChaincode("IDM", ["authenticate_identity", doctor_p_key, doctor_signature, "none"], "identity-management"); // 驗證提出交換病例之人的角色是否是醫生
    let dRole = doctorRes.payload ;
    dRole = dRole.toString() ;
    if ( dRole != "doctor" )
      return "You are not doctor! (authorization)" ; 

    const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', {
      namedCurve: 'prime256v1' // This curve is widely used for ECC
    });

    const publicKeyString = publicKey.export({
      type: 'spki',
      format: 'pem'
    });

    // Define the payload
    const payload = {
      iss: "EMRsharingSystem",
      sub: hospitalDID, 
    };

    const buffer = await ctx.stub.getState(patient_id) ;
    if (!buffer || !buffer.length) return { error: "(authorization)Patient NOT_FOUND" };
    const buffer_object = JSON.parse(buffer.toString()) ;
    let acl_keys = Object.keys(buffer_object) ;
    request_id = JSON.parse(request_id) ;
    for ( let attr in request_id ) {  // 是否通過授權規則
      let key = acl_keys.find((e) => e == attr) ; 
      if ( !key ) return { error : "(authorization)Request hospital_id NOT_FOUND" } ;
      let req_level = buffer_object[key]["level"] ;
      if ( buffer_object[key]["open_access"] === false ) {
        if ( self_level > Number(req_level) ) {
          result["result"] = "Access Denied( Authorization() Fail )" ; // 因層級太低因此無法取得權限
          return result ;
        } // if  
        else {
          result[key] = buffer_object[key]["pointer"] ;
          // console.log("first else") ;
        } // else   
      } // if
      else {
        result[key] = buffer_object[key]["pointer"] ; // the pointer for the requested hospital
        // console.log("second else") ;
      } // else 
    } // for 

    // Sign the JWT
    const token = jwt.sign(payload, privateKey, { algorithm: 'ES256', expiresIn: '1h' });
    const mixId = patient_id + "public" ;
    await ctx.stub.putState(mixId, Buffer.from(publicKeyString)); // set up the token publicKey
    result["recordInfo"] = "successful record publicKey" ;
    result["token"] = token ;
    result["result"] = "Authorization() ok!" ;
    return result ;
  } // authorzation()

  async consent_access(ctx, patient_id, hospital_id) {
    const buffer = await ctx.stub.getState(patient_id);
    if (!buffer || !buffer.length) return { error: "(consent_access)Patient NOT_FOUND" };
    let buffer_object = JSON.parse(buffer.toString()) ;
    let keys_array = Object.keys(buffer_object) ;
    let key = keys_array.find((e) => e == hospital_id) ;
    if ( !key )
      return { Error: "(consent_access)Hospital_id NOT_FOUND" } ;
    buffer_object[key]["open_access"] = true ; 
    await ctx.stub.putState(patient_id, Buffer.from(JSON.stringify(buffer_object)));
    return { success : "OK (consent_access)",
             warning : "The access is open for every level healthprovider" } ; 
  } // consent_access() 

  async revoke_access(ctx, patient_id, hospital_id) {
    const buffer = await ctx.stub.getState(patient_id);
    if (!buffer || !buffer.length) return { error: "(revoke_access)Patient NOT_FOUND" };
    let buffer_object = JSON.parse(buffer.toString()) ;
    let keys_array = Object.keys(buffer_object) ;
    let key = keys_array.find((e) => e == hospital_id) ;
    if ( !key )
      return { Error: "(revoke_access)Hospital_id NOT_FOUND" } ;
    buffer_object[key]["open_access"] = false ; 
    await ctx.stub.putState(patient_id, Buffer.from(JSON.stringify(buffer_object)));
    return { success : "OK (revoke_access)",
             warning : "The access is back to default" } ; 
  } // revoke_access() 

  async validate_hash(ctx, patient_id, hash_obj) {
    // hash_obj : { hospital_DID : hash } 上一次存取到的hash
    const buffer = await ctx.stub.getState(patient_id);
    let result = {} ;
    if (!buffer || !buffer.length) return { error: "(validate_hash)Patient NOT_FOUND" };
    let buffer_object = JSON.parse(buffer.toString()) ;
    hash_obj = JSON.parse(hash_obj) ;
    let hash_key_array = Object.keys(buffer_object) ; // 取出目前帳本上有紀錄的hospital did
    for ( let i = 0 ; i < hash_key_array.length ; i++ ) { // 與擁有的hash進行比對 若發現hash未更新或是未擁有此hash則進行註記
      let hospital_id = hash_key_array[i] ;
      if ( hash_obj.hasOwnProperty(hospital_id) ) {
        if ( hash_obj[hospital_id] != buffer_object[hospital_id]["hash"] ) // 表示需要更新hash值
          result[hospital_id] = "update" ;
      } // if
      else 
        result[hospital_id] = "update" ; 

    } // for 
    
    return result ; // return the hospital did which need to be update
    
  } // validate_hash()

}

exports.contracts = [ACLContract];
