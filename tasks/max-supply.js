const { task } = require("hardhat/config");

async function main() {
    const contractAddress = "0x496E4Ff672290462138e20C486f676eD3B4E7300";
    const contract = await hre.ethers.getContractAt("SimpleNFT", contractAddress);
    return contract;
}

task("max-supply", "Retrive maximum totalSupply of NFT collection")
    .setAction(async (taskArgs, hre) => {
        const contract = await main();
        const maxTotalSupply = await contract.retrieveMaxTotalSupply();
        console.log("Maximum totalSupply of NFT collection:", maxTotalSupply)
    });