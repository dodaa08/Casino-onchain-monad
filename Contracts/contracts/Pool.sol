
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Pool {
    address public owner;

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

    // Transfer ownership to new address
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid address");
        require(newOwner != owner, "Same owner");
        
        owner = newOwner;
    }
}

