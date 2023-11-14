const { task } = require("hardhat/config");
require('dotenv').config();

async function getSigner() {
    const userPrivateKey = process.env.USER_PRIVATE_KEY;
    const user = new ethers.Wallet(userPrivateKey, ethers.provider);
    return user;
}

async function getContract() {
    const contractAddress = "0x496E4Ff672290462138e20C486f676eD3B4E7300";
    const contract = await ethers.getContractAt("SimpleNFT", contractAddress);
    return contract;
}

task("transfer", "user mint an NFT to specific address")
    .addParam("user", "address to transfer NFT to")
    .addParam("tokenId", "ID of token to transfer")
    .setAction(async (taskArgs, hre) => {
        const contract = await getContract();
        const user = await getSigner();
        await contract.connect(user).transfer(taskArgs.user, taskArgs.tokenId);

        console.log(`NFT ${taskArgs.tokenId} was successfully transferred to ${taskArgs.user}`);
    });