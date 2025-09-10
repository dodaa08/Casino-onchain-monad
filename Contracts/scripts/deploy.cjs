const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying Pool contract...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying from:", deployer.address);

  // Get the contract factory
  const Pool = await ethers.getContractFactory("Pool");

  // Deploy the contract
  console.log("⏳ Deploying...");
  const pool = await Pool.deploy();

  // Wait for deployment
  await pool.deployed();

  console.log("✅ Pool deployed to:", pool.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });