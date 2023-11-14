const { task } = require("hardhat/config");

async function main() {
    const contractAddress = "0x1cA9ae0DDC2AF6A625a2524d5B8AFC3e4cd4bD10";
    const contract = await hre.ethers.getContractAt("SimpleNFT", contractAddress);
    return contract;
}

task("max-supply", "Retrive maximum totalSupply of NFT collection")
    .setAction(async (taskArgs, hre) => {
        const contract = await main();
        const maxTotalSupply = await contract.retrieveMaxTotalSupply();
        console.log("Maximum totalSupply of NFT collection:", maxTotalSupply)
    });