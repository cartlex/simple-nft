const {
    time,
    loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");

describe("SimpleNFT", function () {
    async function deployOneYearLockFixture() {
        const [owner, user1, user2, royaltyReceiver] = await ethers.getSigners();

        const SimpleNFT = await ethers.getContractFactory("SimpleNFT");
        const simpleNFT = await SimpleNFT.deploy("Simple", "SMPL", 10000, 5, royaltyReceiver.address, 500, "https://x.y.z/");

        return { simpleNFT, owner, user1, user2 };
    }

    describe("Deployment", function () {
        it("Should set the right NFT collection name", async function () {
            const { simpleNFT } = await loadFixture(deployOneYearLockFixture);

            expect(await simpleNFT.name()).to.equal("Simple");
        });

        it("Should set the right NFT collection symbol", async function () {
            const { simpleNFT } = await loadFixture(deployOneYearLockFixture);

            expect(await simpleNFT.symbol()).to.equal("SMPL");
        });

        it("Should set the right NFT collection owner", async function () {
            const { simpleNFT, owner } = await loadFixture(deployOneYearLockFixture);

            expect(await simpleNFT.owner()).to.equal(owner.address);
        });

        it("Should set the `mintStatus` to 1", async function () {
            const { simpleNFT } = await loadFixture(deployOneYearLockFixture);

            expect(await simpleNFT.getMintStatus()).to.equal(1);
        });

        it("Should set constants", async function () {
            const { simpleNFT } = await loadFixture(deployOneYearLockFixture);

            const constants = await simpleNFT.retrieveConstants();
            [MINT_OPEN, MINT_CLOSED, IN_ALLOWLIST, MINT_PRICE, FEE_DENOMINATOR] = constants;
            expect(MINT_OPEN).to.eq(1);
            expect(MINT_CLOSED).to.eq(2);
            expect(IN_ALLOWLIST).to.eq(1);

            const mintPrice = ethers.utils.parseEther("0.01");
            expect(MINT_PRICE).to.eq(mintPrice);
            expect(FEE_DENOMINATOR).to.eq(10_000);
        });
    });

    describe("Owner functionality", function () {
        it("Admin can transfer ownership", async function () {
            const { simpleNFT, owner, user1, user2 } = await loadFixture(deployOneYearLockFixture);

            await simpleNFT.transferOwnership(user1.address);
            expect(await simpleNFT.owner()).to.eq(owner.address);
            expect(await simpleNFT.pendingOwner()).to.eq(user1.address);
            await expect(simpleNFT.connect(user2).acceptOwnership()).to.be.revertedWithCustomError(simpleNFT, "OwnableUnauthorizedAccount");

            await simpleNFT.connect(user1).acceptOwnership();
            expect(await simpleNFT.owner()).to.eq(user1.address);
            expect(await simpleNFT.owner()).to.not.eq(owner.address);
        });

        it("Admin can't renounce ownership", async function () {
            const { simpleNFT } = await loadFixture(deployOneYearLockFixture);

            await expect(simpleNFT.renounceOwnership()).to.be.revertedWithCustomError(simpleNFT, "OperationNotAllowed");
        });

        it("Admin can add users to allowlist", async function () {
            const { simpleNFT, user1 } = await loadFixture(deployOneYearLockFixture);
            expect(await simpleNFT.allowlist(user1.address)).to.eq(0);
            let addTx = await simpleNFT.addToAllowlist(user1.address);
            await expect(addTx).to.emit(simpleNFT, "AddedToAllowlsit").withArgs(user1.address);
            expect(await simpleNFT.allowlist(user1.address)).to.eq(1);
        });

        it("Admin can remove users to allowlist", async function () {
            const { simpleNFT, user1 } = await loadFixture(deployOneYearLockFixture);
            expect(await simpleNFT.allowlist(user1.address)).to.eq(0);
            await simpleNFT.addToAllowlist(user1.address);
            expect(await simpleNFT.allowlist(user1.address)).to.eq(1);
            let removeTx = await simpleNFT.removeFromAllowlist(user1.address);
            await expect(removeTx).to.emit(simpleNFT, "RemovedFromAllowlsit").withArgs(user1.address);
            expect(await simpleNFT.allowlist(user1.address)).to.eq(2);
        });

        it("Admin can close mint", async function () {
            const { simpleNFT, owner } = await loadFixture(deployOneYearLockFixture);
            let closeMintTx = await simpleNFT.closeMint();
            const currentBlock = await ethers.provider.getBlock('latest');
            await expect(closeMintTx).to.emit(simpleNFT, "MintClosed").withArgs(owner.address, currentBlock.timestamp);
        });

        it("Admin can open mint after it was closed", async function () {
            const { simpleNFT, owner, user1 } = await loadFixture(deployOneYearLockFixture);

            await simpleNFT.closeMint();
            await ethers.provider.send("evm_increaseTime", [25]);
            await expect(simpleNFT.connect(user1).openMint()).to.be.revertedWithCustomError(simpleNFT, "OwnableUnauthorizedAccount");
            let openMintTx = await simpleNFT.openMint();
            const currentBlock = await ethers.provider.getBlock('latest');
            await expect(openMintTx).to.emit(simpleNFT, "MintOpened").withArgs(owner.address, currentBlock.timestamp);
        });

        it("Admin can't open mint when it is open", async function () {
            const { simpleNFT } = await loadFixture(deployOneYearLockFixture);
            await expect(simpleNFT.openMint()).to.be.revertedWithCustomError(simpleNFT, "MintIsOpen");
        });

        it("Admin can mint when mint is open", async function () {
            const { simpleNFT, user1 } = await loadFixture(deployOneYearLockFixture);
            await simpleNFT.adminMint(user1.address);
        });

        it("Admin can't mint when mint is closed", async function () {
            const { simpleNFT, user1 } = await loadFixture(deployOneYearLockFixture);
            await simpleNFT.closeMint();
            await expect(simpleNFT.adminMint(user1.address)).to.be.revertedWithCustomError(simpleNFT, "MintIsClosed");
        });

        it("Admin can use `emergencyWithdraw` to withdraw funds from contracts", async function () {
            const { simpleNFT, owner, user1 } = await loadFixture(deployOneYearLockFixture);
            const ethToSend = ethers.utils.parseEther("0.01");
            await simpleNFT.connect(user1).userMint({ value: ethToSend });
            let simpleNFTBalance = await ethers.provider.getBalance(simpleNFT.address);
            let emergencyWithdrawTx = await simpleNFT.emergencyWithdraw();
            await expect(emergencyWithdrawTx).to.emit(simpleNFT, "Withdraw").withArgs(owner.address, simpleNFTBalance);
        });

        it("Allows admin to mint batch of NFT to users", async function () {
            const { simpleNFT, owner, user1, user2 } = await loadFixture(deployOneYearLockFixture);
            await simpleNFT.adminMintBatch(user1.address, 3);
            expect(await simpleNFT.balanceOf(user1.address)).to.eq(3);
            expect(await simpleNFT.ownerOf(0)).to.eq(user1.address);
            expect(await simpleNFT.ownerOf(1)).to.eq(user1.address);
            expect(await simpleNFT.ownerOf(2)).to.eq(user1.address);

        })
    })

    describe("User functionality", function () {
        it("User can mint only for 0.01 ETH", async function () {
            const { simpleNFT, user1 } = await loadFixture(deployOneYearLockFixture);
            const incorrectEthToSend = ethers.utils.parseEther("0.02");
            const ethToSend = ethers.utils.parseEther("0.01");
            await expect(simpleNFT.connect(user1).userMint({ value: incorrectEthToSend })).to.be.revertedWithCustomError(simpleNFT, "InvalidETHAmount");
            expect(await simpleNFT.balanceOf(user1.address)).to.eq(0);
            await simpleNFT.connect(user1).userMint({ value: ethToSend });
            expect(await simpleNFT.balanceOf(user1.address)).to.eq(1);
        });

        it("User in allowlist can mint for free", async function () {
            const { simpleNFT, user1 } = await loadFixture(deployOneYearLockFixture);
            await simpleNFT.addToAllowlist(user1.address);
            const ethToSend = ethers.utils.parseEther("0.01");
            await expect(simpleNFT.connect(user1).userMint({ value: ethToSend })).to.be.revertedWithCustomError(simpleNFT, "MintForETHNotAllowed");
            expect(await simpleNFT.balanceOf(user1.address)).to.eq(0);
            await simpleNFT.connect(user1).userMint();
            expect(await simpleNFT.balanceOf(user1.address)).to.eq(1);
        });

        it("User can't mint when mint is closed", async function () {
            const { simpleNFT, user1 } = await loadFixture(deployOneYearLockFixture);
            await simpleNFT.closeMint();
            await expect(simpleNFT.adminMint(user1.address)).to.be.revertedWithCustomError(simpleNFT, "MintIsClosed");
        });

        it("User can transfer NFT after mint to another user", async function () {
            const { simpleNFT, user1, user2 } = await loadFixture(deployOneYearLockFixture);
            const ethToSend = ethers.utils.parseEther("0.01");
            await simpleNFT.connect(user1).userMint({ value: ethToSend });
            expect(await simpleNFT.balanceOf(user1.address)).to.eq(1);
            await simpleNFT.connect(user1).transfer(user2.address, 1);
            expect(await simpleNFT.balanceOf(user1.address)).to.eq(0);
            expect(await simpleNFT.balanceOf(user2.address)).to.eq(1);
        })
    });

    describe("Default contract functionality", async function () {
        it("It return tokenURI", async function () {
            const { simpleNFT, owner, user1 } = await loadFixture(deployOneYearLockFixture);
            const ethToSend = ethers.utils.parseEther("0.01");
            await simpleNFT.connect(user1).userMint({ value: ethToSend });

            let tokenURI = await simpleNFT.tokenURI(1);
            expect(tokenURI).to.eq("https://x.y.z/1");

        })
    });
});
