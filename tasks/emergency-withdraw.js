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

task("emergency-withdraw", "smart contract owner withdraw funds from contract")
    .setAction(async (taskArgs) => {
        const contract = await getContract();
        const signer = await getSigner();
        const transaction = await contract.connect(signer).emergencyWithdraw();
        await transaction.wait();

        console.log(`Owner successfully withdrawn funds`)
    });



