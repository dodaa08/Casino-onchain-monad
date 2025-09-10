require("@nomiclabs/hardhat-ethers");
require("dotenv").config();

const PRIVATE_KEY = process.env.PRIVATE_KEY || "";
const RPC_URL = process.env.MONAD_TESTNET_RPC || "";

const config = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      metadata: {
        bytecodeHash: "none",
        useLiteralContent: true,
      },
    },
  },
  networks: {
    // Local development
    hardhat: {
      type: "edr-simulated",
      chainId: 10143,
    },
    
    // Monad testnet
    monadTestnet: {
      type: "http",
      url: RPC_URL,
      chainId: 10143,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      // gasPrice: 1000000000, // 1 gwei
    },
  },
  
  
};

module.exports = config;
