require("@nomicfoundation/hardhat-toolbox");
require('dotenv').config();
require("./tasks/user-mint");
require("./tasks/max-supply");
require("./tasks/admin-mint");
require("./tasks/admin-mint-batch");
require("./tasks/open-mint");
require("./tasks/close-mint");
require("./tasks/add-to-allowlist");
require("./tasks/remove-from-allowlist");
require("./tasks/transfer");
require("./tasks/emergency-withdraw");

module.exports = {
    solidity: "0.8.21",
    settings: {
        optimizer: {
            enabled: true,
            runs: 200
        }
    },
    networks: {
        hardhat: {
            forking: {
                url: process.env.MUMBAI_ALCHEMY_API,
            }
        },
        mumbai: {
            url: process.env.MUMBAI_ALCHEMY_API,
            accounts: [process.env.PRIVATE_KEY]
        }
    },
    etherscan: {
        apiKey: process.env.ETHERSCAN_API
    },
};
