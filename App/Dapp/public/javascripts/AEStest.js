var AES = require("crypto-js/aes") ;
var encUtf8 = require('crypto-js/enc-utf8');
let obj = {"credentials":{"certificate":"-----BEGIN CERTIFICATE-----\nMIICUDCCAfagAwIBAgIUCkTolJeUd3WeRkCpvIePQn+RVBIwCgYIKoZIzj0EAwIw\nczELMAkGA1UEBhMCVVMxEzARBgNVBAgTCkNhbGlmb3JuaWExFjAUBgNVBAcTDVNh\nbiBGcmFuY2lzY28xGTAXBgNVBAoTEG9yZzEuZXhhbXBsZS5jb20xHDAaBgNVBAMT\nE2NhLm9yZzEuZXhhbXBsZS5jb20wHhcNMjQwNTAxMTAwMDAwWhcNMjUwNTAxMTAx\nMDAwWjApMQ8wDQYDVQQLEwZjbGllbnQxFjAUBgNVBAMTDTE3MTQ1NTgxNzg2MzEw\nWTATBgcqhkjOPQIBBggqhkjOPQMBBwNCAAS+NJwWhbYRlmbpxwNC9oPY3J7UW3Wz\n1pAzcyK30gKqrinvRw+lnLK215NRVgfoKCiClOQw6IHK40w7FzN3qi+Yo4GxMIGu\nMA4GA1UdDwEB/wQEAwIHgDAMBgNVHRMBAf8EAjAAMB0GA1UdDgQWBBSvlIywSLUf\nUVHnIZq45sQxUyM4nDArBgNVHSMEJDAigCCIKZfZNgxCxMgmMfUqzrb7Zemtp6Rx\nxw+zAnyh5wb4zzBCBggqAwQFBgcIAQQ2eyJhdHRycyI6eyJwZWVyIjoiT3JnMU1T\nUCIsInVzZXJfaWQiOiIxNzE0NTU4MTc4NjMxIn19MAoGCCqGSM49BAMCA0gAMEUC\nIQC8NWsQdZ0z7a51YmLlRO6sOUJTPHhj3CVOzVMaO3LpBwIgYuvnn181Xyz3umb1\nRzO54zl6JaTRI2/LWY+62LnO0KY=\n-----END CERTIFICATE-----\n","privateKey":"-----BEGIN PRIVATE KEY-----\r\nMIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgiBGz2qUxMYMWe+D6\r\naSnwB3JMJ8QpMBaFC9TIlyNLZjKhRANCAAS+NJwWhbYRlmbpxwNC9oPY3J7UW3Wz\r\n1pAzcyK30gKqrinvRw+lnLK215NRVgfoKCiClOQw6IHK40w7FzN3qi+Y\r\n-----END PRIVATE KEY-----\r\n"},"mspId":"Org1MSP","type":"X.509","version":1} ;

// 加密
var ciphertext = AES.encrypt(JSON.stringify(obj), '1234567891234567').toString() ;
console.log(ciphertext) ;

// 解密
var bytes  = AES.decrypt(ciphertext, '1234567891234567') ;
var originalObj = JSON.parse(bytes.toString(encUtf8)) ;

console.log(originalObj) ;