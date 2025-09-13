
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Pool {
    address public owner;
    
    // Track user balances
    mapping(address => uint256) public userBalances;
    
    // Events
    event UserDeposited(address indexed user, uint256 amount);
    event UserWithdrawn(address indexed user, uint256 amount);

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    // Owner deposit function
    function ownerDeposit() external payable onlyOwner {
        require(msg.value > 0, "Must send ETH");
    }

    // User deposit function
    function userDeposit() external payable {
        require(msg.value > 0, "Must send ETH");
        userBalances[msg.sender] += msg.value;
        emit UserDeposited(msg.sender, msg.value);
    }

    // Payout function - transfer amount to address
    function payout(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "Invalid address");
        require(amount > 0, "Amount must be greater than 0");
        require(address(this).balance >= amount, "Not enough funds");
        
        (bool success, ) = to.call{value: amount}("");
        require(success, "Transfer failed");
    }

    // Get balance function
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    // Emergency owner withdrawal - withdraw all funds
    function emergencyWithdraw() external onlyOwner {
        require(address(this).balance > 0, "No funds to withdraw");
        
        (bool success, ) = owner.call{value: address(this).balance}("");
        require(success, "Withdraw failed");
    }
    // User withdrawal function

    // this function needs to be redeployed with the contract address 

    function userWithdraw(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        require(userBalances[msg.sender] >= amount, "Insufficient balance");
        require(address(this).balance >= amount, "Contract has insufficient funds");
        
        // Update user balance before transfer
        userBalances[msg.sender] -= amount;
        
        // Transfer to the user who called the function
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");
        
        emit UserWithdrawn(msg.sender, amount);
    }
    
    // Function to check user balance
    function getUserBalance(address user) external view returns (uint256) {
        return userBalances[user];
    }

    // Transfer ownership to new address
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid address");
        require(newOwner != owner, "Same owner");
        
        owner = newOwner;
    }
}

