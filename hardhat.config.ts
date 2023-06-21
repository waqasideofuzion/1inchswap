import * as dotenv from "dotenv";
import { HardhatUserConfig } from "hardhat/config";
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-waffle";
import "@nomiclabs/hardhat-etherscan";


dotenv.config();

const {
  DEPLOYER_PRIVATE_KEY_1,
  INFURA_PROJECT_ID,
} = process.env;



const config: HardhatUserConfig = {
 
  solidity: {
    compilers: [
  
      {
        version: "0.8.10",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
  },
  
  networks: {
  
    bsc_mainnet: {
      url: `https://bsc-dataseed.binance.org/`,
      chainId: 56,
      accounts: [`0x${DEPLOYER_PRIVATE_KEY_1}`],
    },
  
    hardhat: {
      forking: {
        url: "https://bsc-dataseed.binance.org"
      },
      accounts: {
        count: 100,
      },
    },
  },
 
  etherscan: {
    apiKey: process.env.BSCSCAN_API_KEY,
  },
 
};

export default config;
