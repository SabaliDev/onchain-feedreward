// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IERC20 {
    function transfer(address recipient, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract DecentraformV1 {
    address public owner;
    IERC20 public usdt;
    uint256 public constant REWARD_AMOUNT = 100000000000000000; // 0.10 USDT reward based on 
    uint256 public constant MAX_SUBMISSIONS = 1; // Maximum feedback submission rewards allowed per address

    mapping(address => uint256) public submissionCount;
    mapping(bytes32 => bool) public validHashedTokens; // Mapping to store valid hashed tokens

    constructor(address _usdtAddress) {
        owner = msg.sender;
        usdt = IERC20(_usdtAddress);
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can call this function.");
        _;
    }

    function addValidHashedToken(bytes32 _hashedToken) public {
        validHashedTokens[_hashedToken] = true;
    }

    //make sure user cant keep getting rewards with same hash token
    function invalidateHashedToken(bytes32 _hashedToken) public {
    validHashedTokens[_hashedToken] = false;
    } 

    function rewardUser(address _user, bytes32 _hashedToken) public {
    require(validHashedTokens[_hashedToken], "Invalid or no interaction token provided.");
    require(submissionCount[_user] < MAX_SUBMISSIONS, "Submission limit reached.");
    require(usdt.transfer(_user, REWARD_AMOUNT), "Failed to transfer USDT.");
    submissionCount[_user] += 1; // Increment the submission count for the user
    invalidateHashedToken(_hashedToken); // Invalidate the hashedToken
    }

    //make sure hash is valid to confirm genuine user before reward
    function isHashedTokenValid(bytes32 _hashedToken) public view returns (bool) {
        return validHashedTokens[_hashedToken];
    }

    // Function to check the contract's USDT balance, restricted to the owner
    function checkUSDTBalance() public view onlyOwner returns (uint256) {
        return usdt.balanceOf(address(this));
    }

    // Function to change the owner
    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0), "New owner is the zero address.");
        owner = newOwner;
    }
}