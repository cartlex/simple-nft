
const hre = require("hardhat");

async function main() {

    const SimpleNFT = await hre.ethers.getContractFactory("SimpleNFT");
    async function getSigner() {
        const privateKey = process.env.PRIVATE_KEY;
        const signer = new ethers.Wallet(privateKey, ethers.provider);
        return signer;
    }

    const signer = await getSigner();
    const simpleNFT = await SimpleNFT.connect(signer).deploy("Simple", "SMPL", 10_000, 5, signer.address, 500, "https://x.y.z/");
    await simpleNFT.deployed();

    console.log(
        `SimpleNFT contract deployed to ${simpleNFT.address}`
    );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
