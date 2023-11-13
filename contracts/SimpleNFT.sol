// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.21;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract SimpleNFT is ERC721, Ownable2Step {
    error OperationNotAllowed();
    error InvalidETHAmount();
    error AlreadyInAllowlist();
    error NotInAllowlist();
    error InvalidAddress();
    error MintIsClosed();
    error MintIsOpen();
    error OperationNotSucced();
    error MintNotFree();

    event Withdraw(address indexed recient, uint256 indexed amount);

    uint256 private constant MINT_OPEN = 1;
    uint256 private constant MINT_CLOSED = 2;
    uint256 private constant IN_ALLOWLIST = 1;
    uint256 mintStatus = 1;

    mapping(address user => uint256 isAdded) public allowlist;

    constructor(string memory name_, string memory symbol_) ERC721(name_, symbol_) Ownable(msg.sender) {

    }

    modifier whenNotClosed() {
        if(mintStatus == MINT_CLOSED) revert MintIsClosed();
        _;
    }

    modifier whenClosed() {
        if(mintStatus == MINT_OPEN) revert MintIsOpen();
        _;
    }

    function userMint(address to, uint256 tokenId) external payable whenNotClosed {
        if (allowlist[msg.sender] == IN_ALLOWLIST) {
            if (msg.value != 0) revert MintNotFree();
            _safeMint(msg.sender, tokenId);
        } else {
            if (msg.value != 0.01 ether) revert InvalidETHAmount();
            _safeMint(to, tokenId);
        }
    }

    function adminMint(address to, uint256 tokenId) external onlyOwner whenNotClosed {
        _safeMint(to, tokenId);
    }

    function renounceOwnership() public view override onlyOwner {
        revert OperationNotAllowed();
    }

    function addToAllowlist(address user) external onlyOwner whenNotClosed {
        if(user == address(0)) revert InvalidAddress();
        if(allowlist[user] == 1) revert AlreadyInAllowlist();
        allowlist[user] = 1;
    }

    function removeToAllowlist(address user) external onlyOwner whenNotClosed {
        if(user == address(0)) revert InvalidAddress();
        if(allowlist[user] == 2) revert NotInAllowlist();
        allowlist[user] = 2;
    }

    function closeMint() external onlyOwner whenNotClosed {
        mintStatus = MINT_CLOSED;
    }

    function openMint() external onlyOwner whenClosed {
        mintStatus = MINT_OPEN;
    }

    function emergencyWithdraw() external onlyOwner {
        address admin = owner();
        (bool success,) = owner().call{value: address(this).balance}("");
        if (!success) revert OperationNotSucced();
        emit Withdraw(admin, address(this).balance);
    }

}
