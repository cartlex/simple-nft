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

task("user-mint", "user mint an NFT to specific address")
    .setAction(async (taskArgs, hre) => {
        const contract = await getContract();
        const user = await getSigner();
        await contract.connect(user).userMint();

        console.log("user was successfully minted an NFT");
    });

task("user-mint-eth", "user mint an NFT for 0.01 eth")
    .setAction(async (taskArgs, hre) => {
        const contract = await getContract();
        const user = await getSigner();
        const amount = ethers.utils.parseEther("0.01");
        await contract.connect(user).userMint({value: amount});

        console.log(`user was successfully minted an NFT for ${amount}`);
    });