const fs = require('node:fs');
const dir = "/home/henry/EMR-sharing Dapp/did-chain/build/contracts/" ;
module.exports = function (contract) {
    const data = fs.readFileSync(dir+contract+".json") ;
    const data_object = JSON.parse(data) ;
    return data_object["abi"] ;
}