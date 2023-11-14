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

task("admin-mint", "smart contract owner to mint an NFT to specific address")
    .addParam("user", "Address to mint NFT")
    .setAction(async (taskArgs) => {
        const contract = await getContract();
        const signer = await getSigner();
        const transaction = await contract.connect(signer).adminMint(taskArgs.user);
        await transaction.wait();

        console.log(`NFT successfully minted to ${taskArgs.user}`)
    });



