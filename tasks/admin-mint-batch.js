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

task("admin-mint-batch", "smart contract owner to mint an NFT to specific address")
    .addParam("user", "Address to mint NFT to")
    .addParam("amounts", "Amount of tokens to mint")
    .setAction(async (taskArgs) => {
        const contract = await getContract();
        const signer = await getSigner();
        const transaction = await contract.connect(signer).adminMintBatch(taskArgs.user, taskArgs.amounts);
        await transaction.wait();

        console.log(`${taskArgs.amounts} tokens successfully minted to ${taskArgs.user}`);
    });



