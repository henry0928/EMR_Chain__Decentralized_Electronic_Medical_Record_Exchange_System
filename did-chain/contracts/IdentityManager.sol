//SPDX-License-Identifier: MIT
// pragma solidity >=0.4.22 <=0.8.20;
pragma solidity ^0.8.0;
import "./PersonalIdentity.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
// import "@openzeppelin/contracts/utils/Address.sol";
// import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
pragma experimental ABIEncoderV2;

contract IdentityManager {
    using ECDSA for bytes32;
    // using Address for address;
    // using MessageHashUtils for bytes32;
    constructor() {
        admin = msg.sender ;
        Orgs[admin] = true ;
    }
    modifier onlyOrg {
        require(Orgs[msg.sender],"Only Organization can call.");
        _;
    }

    modifier onlyAdmin {
        require(msg.sender == admin, "Only Administrator can call.");
        _; 
    }

    event ContractCreate(address indexed contractAddress);

    struct UserInfo {
        address personalIdentityAddress; // address of access control manager 
        address userAddress;             // binding addrss, this also is user's public key
    } // Userinfo

    struct BindInfo {
        string DID;  // user DID
        uint userType; // usertype
    } // BingInfo

    address admin ;
    mapping(address => bool) Orgs ;
    mapping(string => UserInfo) IdentityInfo ; // DID map to userinfo
    mapping(address => BindInfo) BindingInfo ; // wallet address map to DID
    mapping(string => bool) RegistDID ; // Record the regist DID
    mapping(address => bool) RegistAddress ; // Record the regist wallet address
    // mapping(string => string ) private NationalIdList; // the record of NationalId and DID

    function addUser(string memory DID) external onlyAdmin{
        if( !RegistDID[DID] ) {
            RegistDID[DID] = true ;
            UserInfo memory info = UserInfo(
                                        address(0),
                                        address(0)
                                    ) ;
            IdentityInfo[DID] = info ;
        } // if 
        
    } // addUser()

    function bindWallet(string memory DID, address _userAddress, uint _userType) external onlyAdmin {
      require(RegistDID[DID] == true, "DID was not resgist!!") ; // DID need to be register first
      require(RegistAddress[_userAddress] == false, "The userAddress was bound before!!") ; // _userAddress can not be bound before
      require(IdentityInfo[DID].userAddress == address(0), "DID already bound!!") ; // bound DID can not bind again
      
      RegistAddress[_userAddress] = true ;
      BindingInfo[_userAddress].DID = DID ;
      BindingInfo[_userAddress].userType = _userType ;
      // create contract and transfer ownership to user himself
      PersonalIdentity personalIdentity = new PersonalIdentity() ;
      personalIdentity.transferOwnership(_userAddress) ;
      emit ContractCreate(address(personalIdentity));
        
      // update user info
      IdentityInfo[DID].personalIdentityAddress = address(personalIdentity) ;
      IdentityInfo[DID].userAddress = _userAddress ;

    } // bindWallet()

    function addOrg(address org_address) external onlyAdmin {
      Orgs[org_address] = true ; 
    } // addOrg()

    function authentication(string calldata DID, 
                            bytes memory messageHash,
                            bytes memory signature) external view returns(bool) {
      address expectedSigner = IdentityInfo[DID].userAddress ;
      bytes32 ethSignedMessageHash = keccak256(
        abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash)
      );
      bool res = ECDSA.recover(ethSignedMessageHash, signature) == expectedSigner;
    //   if (res) {
    //     address addr = IdentityInfo[DID].personalIdentityAddress ;
    //     PersonalIdentity(addr).set_app(app);
    //   } // if 
      return res ;
    } // authentication()

    function getAccessManagerAddress(address userAddress) external view returns (address) {
        return IdentityInfo[BindingInfo[userAddress].DID].personalIdentityAddress ;
    } // getAccessManagerAddress() helper function

    function getId() external view returns (string memory) {
        return BindingInfo[msg.sender].DID ;
    } // getId() helper function

    function getUserType() external view returns (uint){
        return BindingInfo[msg.sender].userType ; 
    } // getUserType() helper function
}
