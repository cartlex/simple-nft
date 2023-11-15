// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.21;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC2981} from "@openzeppelin/contracts/token/common/ERC2981.sol";
import {Ownable, Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title simple NFT contract
 * @author cartlex
 * @notice You can use this contract for only the most basic simulation
 * @dev All function calls are currently implemented without side effects
 */ 
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
    error InvalidFeeAmount();
    error InvalidMintAmount();
    error ExceedMaxTotalSupply();

    // events
    event Withdraw(address indexed recient, uint256 indexed amount);
    event AddedToAllowlsit(address indexed user);
    event RemovedFromAllowlsit(address indexed user);
    event MintClosed(address indexed admin, uint256 timestamp);
    event MintOpened(address indexed admin, uint256 timestamp);
    event Minted(address indexed recipient, uint256 indexed tokenId);

    uint256 private constant MINT_OPEN = 1;
    uint256 private constant MINT_CLOSED = 2;
    uint256 private constant IN_ALLOWLIST = 1;
    uint256 private constant MINT_PRICE = 0.01 ether;
    uint96 private constant FEE_DENOMITATOR = 10_000;

    uint256 private immutable maxTotalSupply;
    uint256 private immutable maxMintAmount;

    uint256 private _nextTokenId;
    uint256 private _mintStatus;
    string private _tokenBaseURI;

    mapping(address user => uint256 isAdded) public allowlist;
    mapping(address user => uint256 amountMinted) public mintedTokensPerUser;

    constructor(
        string memory name_,
        string memory symbol_,
        uint256 _maxTotalSupply,
        uint256 _maxMintAmount,
        address royaltyReceiver,
        uint96 royaltyPersent,
        string memory tokenBaseURI_
    ) ERC721(name_, symbol_) Ownable(msg.sender) {
        _mintStatus = MINT_OPEN;
        maxTotalSupply = _maxTotalSupply;
        maxMintAmount = _maxMintAmount;
        _tokenBaseURI = tokenBaseURI_;

        if (royaltyReceiver == address(0)) revert InvalidAddress();
        if (royaltyPersent > FEE_DENOMITATOR) revert InvalidFeeAmount();
        _setDefaultRoyalty(royaltyReceiver, royaltyPersent);
    }

    modifier whenNotClosed() {
        if (_mintStatus == MINT_CLOSED) revert MintIsClosed();
        _;
    }

    modifier whenClosed() {
        if (_mintStatus == MINT_OPEN) revert MintIsOpen();
        _;
    }

    /**
     * @notice Function allows owner to mint an NFT to specific address.
     * @dev Can only be used by owner, mint must be open.
     * @param to Address of the user to mint NFT to.
     */ 
    function adminMint(address to) external nonReentrant onlyOwner whenNotClosed {
        if (mintedTokensPerUser[to] >= maxMintAmount) revert InvalidMintAmount();
        uint256 tokenId = ++_nextTokenId;

        if (tokenId > maxTotalSupply) revert ExceedMaxTotalSupply();
        mintedTokensPerUser[to]++;
        _safeMint(to, tokenId);
        emit Minted(to, tokenId);
    }

    /**
     * @notice Function allows user to mint an NFT to itself. User can mint for free if in allowlist,
     * or for 0.01 ETH if not.
     * @dev Function use `nonReentrant` modifier to prevent reentrancy via `onERC721Received` function.
     * Mint must be open.
     */ 
    function userMint() external payable nonReentrant whenNotClosed {
        if (mintedTokensPerUser[msg.sender] >= maxMintAmount) revert InvalidMintAmount();

        if (allowlist[msg.sender] == IN_ALLOWLIST) {
            if (msg.value != 0) revert MintForETHNotAllowed();

            uint256 tokenId = ++_nextTokenId;
            if (tokenId > maxTotalSupply) revert ExceedMaxTotalSupply();
            mintedTokensPerUser[msg.sender]++;

            _safeMint(msg.sender, tokenId);
            emit Minted(msg.sender, tokenId);

        } else {
            if (msg.value != MINT_PRICE) revert InvalidETHAmount();

            uint256 tokenId = ++_nextTokenId;
            if (tokenId > maxTotalSupply) revert ExceedMaxTotalSupply();
            mintedTokensPerUser[msg.sender]++;

            _safeMint(msg.sender, tokenId);
            emit Minted(msg.sender, tokenId);

        }
    }

    /**
     * @notice Function allows admin to mint a specific amount of NFT to specific user.
     * @dev Function use `nonReentrant` modifier to prevent reentrancy via `onERC721Received` function. Mint must be open.
     * @param to Address to mint NFT to.
     * @param amounts Amount of tokens to mint.
     */ 
    function adminMintBatch(
        address to,
        uint256 amounts
    ) external nonReentrant onlyOwner whenNotClosed {
        uint256 tokenId = _nextTokenId;
        uint256 num;
        if (amounts + mintedTokensPerUser[msg.sender] > maxMintAmount) revert InvalidMintAmount();

        for (uint i; i < amounts;) {
            if (tokenId > maxTotalSupply) revert ExceedMaxTotalSupply();
            mintedTokensPerUser[msg.sender] = mintedTokensPerUser[msg.sender] + amounts;
            _safeMint(to, tokenId);
            ++tokenId;

            unchecked {
                ++i;
            }

            num = tokenId;
        }

        _nextTokenId = num;
        emit Minted(to, amounts);
    }

    /**
     * @notice Function allows user to transfer its NFT to other user.
     * @dev Function use `nonReentrant` modifier to prevent reentrancy via `onERC721Received` function. Mint must be open.
     * @param to Address to send NFT to.
     * @param tokenId Id of NFT to send.
     */ 
    function transfer(address to, uint256 tokenId) external nonReentrant {
        _safeTransfer(msg.sender, to, tokenId);
    }

    /**
     * @notice Function allows owner to add user to allowlist.
     * @dev Can only be used by owner, mint must be open.
     * @param user Address of user which will be added to allowlist.
     */ 
    function addToAllowlist(address user) external onlyOwner whenNotClosed {
        if (user == address(0)) revert InvalidAddress();
        if (allowlist[user] == 1) revert AlreadyInAllowlist();
        allowlist[user] = 1;
        emit AddedToAllowlsit(user);
    }

    /**
     * @notice Function allows owner to remove user from allowlist.
     * @dev Can only be used by owner, mint must be open.
     * @param user Address of user which will be removed from allowlist.
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
     * @notice Function allows owner to close mint functionality.
     * @dev Mint must be open
     */ 
    function closeMint() external onlyOwner whenNotClosed {
        _mintStatus = MINT_CLOSED;
        emit MintClosed(msg.sender, block.timestamp);
    }

    /**
     * @notice Function allows owner to open mint functionality.
     * @dev Mint must be closed
     */ 
    function openMint() external onlyOwner whenClosed {
        _mintStatus = MINT_OPEN;
        emit MintOpened(msg.sender, block.timestamp);
    }

    /**
     * @notice Function allows owner to withdraw funds from contract.
     */ 
    function emergencyWithdraw() external onlyOwner {
        address admin = owner();
        uint256 amountToWithdraw = address(this).balance;
        (bool success, ) = owner().call{value: amountToWithdraw}("");
        if (!success) revert OperationNotSucced();
        emit Withdraw(admin, amountToWithdraw);
    }

    /**
     * @notice Helper function to check constant values.
     */ 
    function retrieveConstants() external pure returns (uint256, uint256, uint256, uint256, uint96) {
        return (MINT_OPEN, MINT_CLOSED, IN_ALLOWLIST, MINT_PRICE, FEE_DENOMITATOR);
    }

    /**
     * @dev Function to check which interfaces contract support.
     */ 
    function supportsInterface(bytes4 interfaceId) public view override(ERC2981, ERC721) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    /**
     * @dev Function overriden to not allow owner to renounce the ownership.
     */ 
    function renounceOwnership() public view override onlyOwner {
        revert OperationNotAllowed();
    }

    /**
     * @dev Function to check `_tokenBaseURI` parameter.
     */ 
    function _baseURI() internal view override returns (string memory) {
        return _tokenBaseURI;
    }

    /**
     * @dev Function to retrieve current `_mintStatus` value.
     */ 
    function retrieveMintStatus() external view returns (uint256) {
        return _mintStatus;
    }

    /**
     * @dev Function to retrieve current `maxTotalSupply` value.
     */ 
    function retrieveMaxTotalSupply() external view returns (uint256) {
        return maxTotalSupply;
    }

    /**
     * @dev Function to retrieve current `maxMintAmount` value.
     */
    function retrieveMaxMintAmount() external view returns (uint256) {
        return maxMintAmount;
    }
}
