const { Contract } = require("fabric-contract-api");
const crypto = require("crypto");

class KVContract extends Contract {
  constructor() {
    super("KVContract");
  }

  async instantiate() {
    // function that will be invoked on chaincode instantiation
  }

  async put(ctx, key, value) {
    await ctx.stub.putState(key, Buffer.from(value));
    return { success: "ok" };
  } // for testing the ledger 

  async get(ctx, key) {
    const buffer = await ctx.stub.getState(key);
    if (!buffer || !buffer.length) return { error: "get NOT_FOUND" };
    let buffer_object = JSON.parse(buffer.toString()) ;
    buffer_object["success"] = "OK" ; 
    console.log(buffer_object) ; 
    return buffer_object;
  } // for testing the ledger 
  
  async create_patient_instance(ctx, patient_id, hospital_id, _hash) {
    // key : { patient }
    // value : { hospital_id : hospital_info_object }

    // Hospital level from low to high will be 4, 3, 2, 1
    // 1 -> 醫學中心
    // 2 -> 區域醫院
    // 3 -> 地區醫院
    // 4 -> 基層診所
    const transient = ctx.stub.getTransient();
    const _pointer = transient.get("pointer");  // need to fix the url problem // remember that the upload url will be encrypt!!!!
    const level = 4 ; // to get the hospital-level from did chain
    const hospital_info_object = {
      level : level,
      open_access : false,
      pointer : _pointer,
      hash : _hash
    } ;
    let value = {
      [hospital_id] : hospital_info_object //  hospital_DID -> info_object
    } ;

    await ctx.stub.putState(patient_id, Buffer.from(JSON.stringify(value)));
    return { success: "OK (create_patient_instance)", DataOwner: patient_id}
  } // create_patient_instance

  async update_instance(ctx, patient_id, hospital_id, _pointer, _hash) {
    const buffer = await ctx.stub.getState(patient_id);
    if (!buffer || !buffer.length) return { error: "(update_instance)Patient NOT_FOUND" };
    let buffer_object = JSON.parse(buffer.toString()) ;
    const level  = 2 ; // need to get the level from DID chain 
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

  async authorization(ctx, patient_id, hospital_id, signature, request_id) {
    // patient_id : 病患DID
    // hospital_id : 想要存取其他health-data的醫院DID
    // signature : hospital signature
    // request_id : object, hospital_id : hospital_name, 因無法使用array型傳遞 使用object取代
    let result = {} ;// must be a pair with hospital_id -> url ;

    // The hospital_id is for digital signature use !!!
    // check(signature, hospital_id) ; // authentication the singnature from DID chain  
    // if the signature is produced by patient, need to give the access without any rules
    let self_level = 3 ;// need to use did chain to verify hospital level
    const buffer = await ctx.stub.getState(patient_id) ;
    if (!buffer || !buffer.length) return { error: "(authorization)Patient NOT_FOUND" };
    const buffer_object = JSON.parse(buffer.toString()) ;
    let acl_keys = Object.keys(buffer_object) ;
    request_id = JSON.parse(request_id) ;
    for ( let attr in request_id ) {
      let key = acl_keys.find((e) => e == attr) ;
      if ( !key ) return { error : "(authorization)Request hospital_id NOT_FOUND" } ;
      let req_level = buffer_object[key]["level"] ;
      if ( buffer_object[key]["open_access"] === false ) {
        if ( self_level > Number(req_level) ) 
          result[key] = "Access Denied" ; // 因層級太低因此無法取得權限
        else {
          result[key] = buffer_object[key]["pointer"] ;
          console.log("first else") ;
        } // else   
      } // if
      else {
        result[key] = buffer_object[key]["pointer"] ; // the pointer for the requested hospital
        console.log("second else") ;
      } // else 
    } // for 

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

  async putPrivateMessage(ctx, collection) {
    const transient = ctx.stub.getTransient();
    const message = transient.get("message");
    await ctx.stub.putPrivateData(collection, "message", message);
    return { success: "OK" };
  }

  async getPrivateMessage(ctx, collection) {
    const message = await ctx.stub.getPrivateData(collection, "message");
    const messageString = message.toBuffer ? message.toBuffer().toString() : message.toString();
    return { success: messageString };
  }

  async verifyPrivateMessage(ctx, collection) {
    const transient = ctx.stub.getTransient();
    const message = transient.get("message");
    const messageString = message.toBuffer ? message.toBuffer().toString() : message.toString();
    const currentHash = crypto.createHash("sha256").update(messageString).digest("hex");
    const privateDataHash = (await ctx.stub.getPrivateDataHash(collection, "message")).toString("hex");
    if (privateDataHash !== currentHash) {
      return { error: "VERIFICATION_FAILED" };
    }
    return { success: "OK" };
  }
}

exports.contracts = [KVContract];
