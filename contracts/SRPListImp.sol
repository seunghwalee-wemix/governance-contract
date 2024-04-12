// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import "./GovChecker.sol";
import "./interface/IStaking.sol";
import "./interface/IEnvStorage.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";
import "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";

contract SRPListImp is     
    GovChecker,
    UUPSUpgradeable,
    ReentrancyGuardUpgradeable {

    address[] public srpList;
    address[] public subscriptionList;
    mapping(address /* user address */ => uint256 /* array index, start index: 1, 0 == null */) public srpListMap;
    mapping(address /* gov member address */ => uint256 /* array index, start index: 1, 0 == null */) public subscriptionListMap;
    uint256 public updatedBlock;

    event OwnerChanged(address indexed previousOwner, address indexed newOwner);
    receive() external payable {}

    /* =========== FUNCTIONS ===========*/
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }
    function initialize(address registry) external initializer {
        __Ownable_init();
        __ReentrancyGuard_init();
        setRegistry(registry);
        updatedBlock = block.number;
    }

    function changeOwner(address _newOwner) public onlyOwner {
        require(_newOwner != address(0), "Invalid new owner address");
        emit OwnerChanged(owner(), _newOwner);
        transferOwnership(_newOwner);
     }

    function addToSRPList(address _address) public onlyOwner {
        require(srpListMap[_address] == 0, "Already exists address");
        srpList.push(_address);
        srpListMap[_address] = srpList.length;
        updatedBlock = block.number;
    }

    function removeFromSRPList(address _address) public onlyOwner {
        require(srpListMap[_address] != 0, "Address is not in the srpList");
        uint256 removeIdx = srpListMap[_address] - 1;
        if (removeIdx != srpList.length - 1) {
          srpList[removeIdx] = srpList[srpList.length - 1]; // copy last address to removeIdx
          srpListMap[srpList[srpList.length - 1]] = removeIdx + 1;
        }
        srpList.pop();
        delete srpListMap[_address];
        updatedBlock = block.number;
    }

    function addToSRPListMulti(bytes memory encodedAddresses) public onlyOwner {
        uint256 startIdx = 0;
        uint256 endIdx;
        // word(per 32 bytes): var array memory, start offset, length, data 1, 2, 3...
        assembly {
            endIdx := mload(add(encodedAddresses, /*32 * 2*/ 0x40)) // read array length
        }
        uint256 ix;
        assembly {
            ix := add(encodedAddresses, /*32 * 3*/ 0x60)
        }
        for (uint256 i = startIdx; i < endIdx; i++) {
            address currentAddress;
            assembly {
                currentAddress := mload(ix)
                ix := add(ix, /*32 * 1*/ 0x20) // ix += 32 bytes
            }
            addToSRPList(currentAddress);
        }
    }

    function removeToSRPListMulti(bytes memory encodedAddresses) public onlyOwner {
        uint256 startIdx = 0;
        uint256 endIdx;
        assembly {
            endIdx := mload(add(encodedAddresses, 0x40))
        }
        uint256 ix;
        assembly {
            ix := add(encodedAddresses, 0x60)
        }
        for (uint256 i = startIdx; i < endIdx; i++) {
            address currentAddress;
            assembly {
                currentAddress := mload(ix)
                ix := add(ix, 0x20)
            }
            removeFromSRPList(currentAddress);
        }
    }

    function subscribe() public returns (uint256) {
        require(subscriptionListMap[msg.sender] == 0, "Already exists address");

        IStaking staking = IStaking(getStakingAddress());
        uint256 amount = staking.balanceOf(msg.sender);
        require(IGov(getGovAddress()).isMember(msg.sender) || amount >= getMinStaking(), "No Permission");

        subscriptionList.push(msg.sender);
        subscriptionListMap[msg.sender] = subscriptionList.length;

        updatedBlock = block.number;

        return updatedBlock;
    }

    function unsubscribe(address _address) public returns (uint256) {
        require(subscriptionListMap[_address] != 0, "Address is not in the subscriptionList");
        require(msg.sender == _address || msg.sender == owner(), "Only oneself or the owner can call this function.");
        
        uint256 removeIdx = subscriptionListMap[_address] - 1;
        if (removeIdx != subscriptionList.length - 1) {
          subscriptionList[removeIdx] = subscriptionList[subscriptionList.length - 1]; // copy last address to removeIdx
          subscriptionListMap[subscriptionList[subscriptionList.length - 1]] = removeIdx + 1;
        }
        subscriptionList.pop();
        delete subscriptionListMap[_address];
        updatedBlock = block.number;

        return updatedBlock;
    }

    function getSubscribtionList() public view returns (address[] memory) {
        return subscriptionList;
    }

    function getUpdatedBlock() public view returns (uint256) {
        return updatedBlock;
    }

    function getSRPListLength() public view returns (uint256) {
        return srpList.length;
    }

    function getSRPListAddressAtIndex(uint256 _index) public view returns (address) {
        require(_index < srpList.length, "Index out of bounds");
        return srpList[_index];
    }

    function getSRPList() public view returns (address[] memory) {
        return srpList;
    }

    function getSubscribtionListLength() public view returns (uint256) {
        return subscriptionList.length;
    }

    function getSubscriptionListAddressAtIndex(uint256 _index) public view returns (address) {
        require(_index < subscriptionList.length, "Index out of bounds");
        return subscriptionList[_index];
    }

    function getSubscriptionList() public view returns (address[] memory) {
        return subscriptionList;
    }

    function isAddressInSRPList(address _address) public view returns (bool) {
        return (srpListMap[_address] != 0);
    }

    function isAddressInSubscriptionList(address _address) public view returns (bool) {
        return (subscriptionListMap[_address] != 0);
    }

    function getMinStaking() public view returns (uint256) {
        return IEnvStorage(getEnvStorageAddress()).getStakingMin();
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyOwner
    {}

    function upgradeSRPList(address newImp) external onlyOwner {
        if (newImp != address(0)) {
            _authorizeUpgrade(newImp);
            _upgradeToAndCallUUPS(newImp, new bytes(0), false);
        }
    }
}