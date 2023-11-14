const { task } = require("hardhat/config");
require('dotenv').config();

async function getSigner() {
    // const privateKey = process.env.PRIVATE_KEY;
    const userPrivateKey = process.env.USER_PRIVATE_KEY;
    // const signer = new ethers.Wallet(privateKey, ethers.provider);
    const user = new ethers.Wallet(userPrivateKey, ethers.provider);
    return user;
}

async function getContract() {
    const contractAddress = "0x1cA9ae0DDC2AF6A625a2524d5B8AFC3e4cd4bD10";
    const contract = await ethers.getContractAt("SimpleNFT", contractAddress);
    return contract;
}

task("user-mint", "user mint an NFT to specific address")
    .setAction(async (taskArgs, hre) => {
        const contract = await getContract();
        const user = await getSigner();
        await contract.connect(user).userMint();

        console.log("user was successfully minted an NFT");
    });