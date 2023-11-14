
const hre = require("hardhat");

async function main() {

  const SimpleNFT = await hre.ethers.getContractFactory("SimpleNFT");
  const [royaltyReceiver] = await ethers.getSigners();

  const simpleNFT = await SimpleNFT.deploy("Simple", "SMPL", 10000, 5, royaltyReceiver.address, 500, "https://x.y.z/");

  await simpleNFT.deployed();

  console.log(
    `simpleNFT contract deployed to ${simpleNFT.address}`
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
