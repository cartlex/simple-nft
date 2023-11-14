const { task } = require("hardhat/config");
require('dotenv').config();

async function getSigner() {
    const privateKey = process.env.PRIVATE_KEY;
    const signer = new ethers.Wallet(privateKey, ethers.provider);
    return signer;
}

async function getContract() {
    const contractAddress = "0x1cA9ae0DDC2AF6A625a2524d5B8AFC3e4cd4bD10";
    const contract = await ethers.getContractAt("SimpleNFT", contractAddress);
    return contract;
}

task("remove-from-allowlist", "smart contract owner remove specific address from allowlist")
    .addParam("user", "Address to add to allowlist")
    .setAction(async (taskArgs) => {
        const contract = await getContract();
        const signer = await getSigner();

        const transaction = await contract.connect(signer).removeFromAllowlist(taskArgs.user);
        await transaction.wait();

        console.log(`User ${taskArgs.user} was successfully removed from allowlist`);
    });



