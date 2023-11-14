const { task } = require("hardhat/config");
require('dotenv').config();

async function getSigner() {
    const privateKey = process.env.PRIVATE_KEY;
    const signer = new ethers.Wallet(privateKey, ethers.provider);
    return signer;
}

async function getContract() {
    const contractAddress = "0x1cA9ae0DDC2AF6A625a2524d5B8AFC3e4cd4bD10";
    const contract = await hre.ethers.getContractAt("SimpleNFT", contractAddress);
    return contract;
}

task("open-mint", "smart contract owner open mint functionality")
    .setAction(async (taskArgs) => {
        const contract = await getContract();
        const signer = await getSigner();

        const transaction = await contract.connect(signer).openMint();
        await transaction.wait();

        console.log("mint was successfully open");
    });