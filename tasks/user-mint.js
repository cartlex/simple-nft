const { task } = require("hardhat/config");

async function main() {
    const contractAddress = "0x1cA9ae0DDC2AF6A625a2524d5B8AFC3e4cd4bD10";
    const contract = await hre.ethers.getContractAt("SimpleNFT", contractAddress);
    return contract;
}

// async function userMintNFT(signer) {
//     // const contract = new ethers.Contract(contractAddress, contractABI, signer);
//     const contract = await main();
//     const transaction = await contract.userMint();
//     await transaction.wait();

//     console.log(`NFT with ID to ${user} minted successfully.`);
// }

task("user-mint", "user mint an NFT to specific address")
    .setAction(async (taskArgs, hre) => {
        // const [signer] = await ethers.getSigners();
        const contract = await main();
        await contract.userMint();
    });