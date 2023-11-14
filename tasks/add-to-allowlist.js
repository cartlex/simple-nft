const { task } = require("hardhat/config");
require('dotenv').config();

async function getSigner() {
    const privateKey = process.env.PRIVATE_KEY;
    const signer = new ethers.Wallet(privateKey, ethers.provider);
    return signer;
}

async function getContract() {
    const contractAddress = "0x496E4Ff672290462138e20C486f676eD3B4E7300";
    const contract = await ethers.getContractAt("SimpleNFT", contractAddress);
    return contract;
}

task("add-to-allowlist", "smart contract owner add specific address to allowlist")
    .addParam("user", "Address to add to allowlist")
    .setAction(async (taskArgs) => {
        const contract = await getContract();
        const signer = await getSigner();

        const transaction = await contract.connect(signer).addToAllowlist(taskArgs.user);
        await transaction.wait();

        console.log(`User ${taskArgs.user} was successfully added to allowlist`);
    });



