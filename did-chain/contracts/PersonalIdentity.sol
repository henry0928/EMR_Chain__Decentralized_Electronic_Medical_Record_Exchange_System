// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <=0.8.20;

contract PersonalIdentity {
    // reference: https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/access/Ownable.sol
    address private owner;
    address private supervisor;
    string[] app;
    mapping(string=>string) app_private ;
    
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event setEncryptMaterialEvent(string Material, address org, string EncryptObject);
    
    // remember to change public to internal
    constructor () {
        address msgSender = msg.sender;
        owner = msgSender;
        supervisor = msgSender;
        emit OwnershipTransferred(address(0), msgSender);
    }
    
    function Owner() public view returns (address) {
        return owner;
    }

    function Supervisor() public view returns (address) {
        return supervisor;
    }
    
    modifier onlyOwner() {
        require(Owner() == msg.sender, "Ownable: caller is not the owner");
        _;
    }

    modifier onlySupervisor() {
        require(Supervisor() == msg.sender, "Supervisorable: caller is not the supervisor");
        _;
    }

    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0), "Ownable: new owner is the zero address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    } // transferOwnership()

    function set_app(string calldata org) public onlySupervisor {
        app.push(org) ;
    } // set_app()

    function get_app() external view onlyOwner returns(string[] memory) {
        return app ;
    } // set_app()

    function set_app_private(string calldata org, string calldata encrypt_key) external onlyOwner {
        app_private[org] = encrypt_key ;
    } // set_app_private()

    function get_app_private(string calldata org) external view onlyOwner returns(string memory) {
        return app_private[org] ;
    } // set_app_private()

    // function setEncryptMaterial(string memory Material, address org, string memory EncryptObject) public onlyOwner{
    //     _encryptMaterial[Material] = EncryptObject;
    //     emit setEncryptMaterialEvent(Material,org,EncryptObject);
    // }

    // function getEncryptMaterial(string memory Material) public view returns(string memory) {
    //     return _encryptMaterial[Material];
    // }
}