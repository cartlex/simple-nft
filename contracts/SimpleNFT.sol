// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.21;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC2981} from "@openzeppelin/contracts/token/common/ERC2981.sol";
import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title simple NFT contract
/// @author cartlex
/// @notice You can use this contract for only the most basic simulation
/// @dev All function calls are currently implemented without side effects
contract SimpleNFT is ERC721, ERC2981, Ownable2Step, ReentrancyGuard {
    // errors
    error OperationNotAllowed();
    error InvalidETHAmount();
    error AlreadyInAllowlist();
    error NotInAllowlist();
    error InvalidAddress();
    error MintIsClosed();
    error MintIsOpen();
    error OperationNotSucced();
    error MintForETHNotAllowed();
    error InvalidArrayLength();
    error InvalidFeeAmount();
    error InvalidMintAmount();
    error ExceedMaxTotalSupply();

    // events
    event Withdraw(address indexed recient, uint256 indexed amount);
    event AddedToAllowlsit(address indexed user);
    event RemovedFromAllowlsit(address indexed user);
    event MintClosed(address indexed admin, uint256 timestamp);
    event MintOpened(address indexed admin, uint256 timestamp);

    uint256 private constant MINT_OPEN = 1;
    uint256 private constant MINT_CLOSED = 2;
    uint256 private constant IN_ALLOWLIST = 1;
    uint256 private constant MINT_PRICE = 0.01 ether;
    uint96 private constant FEE_DENOMITATOR = 10_000;
    uint256 public immutable maxTotalSupply;
    uint256 public immutable maxMintAmount;
    uint256 private _nextTokenId;
    string private baseURI;

    uint256 public mintStatus;

    mapping(address user => uint256 isAdded) public allowlist;

    constructor(
        string memory name_,
        string memory symbol_,
        uint256 _maxTotalSupply,
        uint256 _maxMintAmount,
        address royaltyReceiver,
        uint96 royaltyPersent
    ) ERC721(name_, symbol_) Ownable(msg.sender) {
        mintStatus = MINT_OPEN;
        maxTotalSupply = _maxTotalSupply;
        maxMintAmount = _maxMintAmount;

        if (royaltyReceiver == address(0)) revert InvalidAddress();
        if (royaltyPersent > FEE_DENOMITATOR) revert InvalidFeeAmount();
        _setDefaultRoyalty(royaltyReceiver, royaltyPersent);
    }

    modifier whenNotClosed() {
        if (mintStatus == MINT_CLOSED) revert MintIsClosed();
        _;
    }

    modifier whenClosed() {
        if (mintStatus == MINT_OPEN) revert MintIsOpen();
        _;
    }

    /**
     * @notice Function allows owner to mint an NFT to specific address
     * @dev Can only be used by owner, mint must be open
     * @param to Address of the user to mint NFT to 
     */ 
    function adminMint(address to) external nonReentrant onlyOwner whenNotClosed {
        if (balanceOf(to) >= maxMintAmount) revert InvalidMintAmount();
        uint256 tokenId = ++_nextTokenId;

        if (tokenId > maxTotalSupply) revert ExceedMaxTotalSupply();

        _safeMint(to, tokenId);
    }

    /**
     * @notice Function allows user to mint an NFT to itself. User can mint for free if in allowlist,
     * or for 0.01 ETH if not.
     * @dev Function use `nonReentrant` modifier to prevent reentrancy via `onERC721Received` function.
     * Mint must be open.
     */ 
    function userMint() external payable nonReentrant whenNotClosed {
        if (balanceOf(msg.sender) >= maxMintAmount) revert InvalidMintAmount();

        if (allowlist[msg.sender] == IN_ALLOWLIST) {
            if (msg.value != 0) revert MintForETHNotAllowed();

            uint256 tokenId = ++_nextTokenId;
            if (tokenId > maxTotalSupply) revert ExceedMaxTotalSupply();

            _safeMint(msg.sender, tokenId);
        } else {
            if (msg.value != MINT_PRICE) revert InvalidETHAmount();

            uint256 tokenId = ++_nextTokenId;
            if (tokenId > maxTotalSupply) revert ExceedMaxTotalSupply();

            _safeMint(msg.sender, tokenId);
        }
    }

    /**
     * @notice Function allows admin to mint an NFT to array of users with an specific amounts.
     * @dev Function use `nonReentrant` modifier to prevent reentrancy via `onERC721Received` function. Mint must be open.
     * @param users Array of user addresses that receive an a nft.
     * @param amounts Array of amounts of NFT that each user receive.
     */ 
    function adminMintBatch(
        address[] memory users,
        uint256[] memory amounts
    ) external nonReentrant onlyOwner whenNotClosed {
        uint256 arrayLength = users.length;
        if (amounts.length != arrayLength) revert InvalidArrayLength();

        uint256 tokenId = _nextTokenId;
        uint256 num;

        for (uint i; i < arrayLength; ) {
            if (amounts[i] + balanceOf(users[i]) > maxMintAmount) revert InvalidMintAmount();

            ++tokenId;
            if (tokenId > maxTotalSupply) revert ExceedMaxTotalSupply();
            _safeMint(users[i], tokenId);

            unchecked {
                ++i;
            }

            num = tokenId;
        }

        _nextTokenId = num;
    }

    /**
     * @notice Function allows owner to add user to allowlist
     * @dev Can only be used by owner, mint must be open
     * @param user Address of user which will be added to allowlist
     */ 
    function addToAllowlist(address user) external onlyOwner whenNotClosed {
        if (user == address(0)) revert InvalidAddress();
        if (allowlist[user] == 1) revert AlreadyInAllowlist();
        allowlist[user] = 1;
        emit AddedToAllowlsit(user);
    }

    /**
     * @notice Function allows owner to remove user from allowlist
     * @dev Can only be used by owner, mint must be open
     * @param user Address of user which will be removed from allowlist
     */ 
    function removeFromAllowlist(
        address user
    ) external onlyOwner whenNotClosed {
        if (user == address(0)) revert InvalidAddress();
        if (allowlist[user] == 2) revert NotInAllowlist();
        allowlist[user] = 2;
        emit RemovedFromAllowlsit(user);
    }

    /**
     * @notice Function allows owner to close mint functionality
     * @dev Mint must be open
     */ 
    function closeMint() external onlyOwner whenNotClosed {
        mintStatus = MINT_CLOSED;
        emit MintClosed(msg.sender, block.timestamp);
    }

    /**
     * @notice Function allows owner to open mint functionality
     * @dev Mint must be closed
     */ 
    function openMint() external onlyOwner whenClosed {
        mintStatus = MINT_OPEN;
        emit MintOpened(msg.sender, block.timestamp);
    }

    /**
     * @notice Function allows owner to withdraw funds from contract
     */ 
    function emergencyWithdraw() external onlyOwner {
        address admin = owner();
        uint256 amountToWithdraw = address(this).balance;
        (bool success, ) = owner().call{value: amountToWithdraw}("");
        if (!success) revert OperationNotSucced();
        emit Withdraw(admin, amountToWithdraw);
    }

    /**
     * @notice Helper function to check constant values
     */ 
    function retrieveConstants() external pure returns (uint256, uint256, uint256, uint256, uint96) {
        return (MINT_OPEN, MINT_CLOSED, IN_ALLOWLIST, MINT_PRICE, FEE_DENOMITATOR);
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC2981, ERC721) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    /**
     * @dev Function overriden to not allow owner to renounce the ownership
     */ 
    function renounceOwnership() public view override onlyOwner {
        revert OperationNotAllowed();
    }

    function _baseURI() internal view override returns (string memory) {
        return baseURI;
    }
}
