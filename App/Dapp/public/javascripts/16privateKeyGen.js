module.exports = function (credentialObj) {
    let str = credentialObj["privateKey"] ;
    const lines = str.split('\r\n') ;
    const lineCopy = lines[2].split("") ;
    let privateKey16 = "" ;
    for ( let i = 0 ; i < 16 ; i++ ) 
      privateKey16 = privateKey16 + lineCopy[i] ;
    return privateKey16 ;
}