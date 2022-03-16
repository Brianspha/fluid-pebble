pragma solidity >=0.6.2;
pragma experimental ABIEncoderV2;

import "./Initializable.sol";
import "./interfaces/FluidPebbleInterface.sol";
import "./TokenContract.sol";
import "./SafeMathV2.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./ReentrancyGuard.sol";

import "./Pausable.sol";
import "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperfluid.sol";

import "@superfluid-finance/ethereum-contracts/contracts/interfaces/agreements/IConstantFlowAgreementV1.sol";

//"SPDX-License-Identifier: UNLICENSED"

/**
*@dev contract represents the functionality required by OneCanvas 
*@notice mostly likey not optimised for gas will fix as i develop
*@notice implements the IOneCanvas interface 
 @dev has bugs 
 @notice poorly formatted code

 */
contract FluidPebble is
    FluidPebbleInterface,
    Initializable,
    Ownable,
    ReentrancyGuard,
    Pausable
{
    using SafeMathV2 for uint256;

    /*==========================================================Modifier definition start==========================================================*/

    /*==========================================================Event definition start==========================================================*/
    /*==========================================================Variable definition start==========================================================*/
    uint256 private fundIndexIds;
    ISuperfluid private _host; // host
    IConstantFlowAgreementV1 private _cfa; // the stored constant flow agreement class address
    ISuperToken private _acceptedToken; // accepted token
    uint256 public transactionFees = 0;
    uint256 public minMintCost = 0.00001 ether;
    uint256 public contractCut = 3500;
    uint256 minDividendsPerExperience = 100;
    address payable contractOwner;
    TokenContract fluidpebble;
    uint256[] public leasedTokenIds;
    uint256 public totalLeased;
    address[] mintersIds;
    mapping(uint256 => int96) public flowRates;
    mapping(uint256 => FluidPebble) currentFluidPebbles;
    mapping(address => Minter) minters;

    /*==========================================================Function definition start==========================================================*/
    constructor(
        TokenContract tokenAddress,
        ISuperfluid host,
        IConstantFlowAgreementV1 cfa,
        ISuperToken acceptedToken
    ) initializer onlyOwner {
        require(msg.sender != address(0), "Invalid sender address");
        require(address(tokenAddress) != address(0), "Invalid token address");
        require(address(host) != address(0), "Invalid host address");
        require(address(cfa) != address(0), "Invalid CFA address");
        require(
            address(acceptedToken) != address(0),
            "Invalid supertoken address"
        );
        _host = host;
        _cfa = cfa;
        _acceptedToken = acceptedToken;
        fluidpebble = tokenAddress;
        uint256 configWord = SuperAppDefinitions.APP_LEVEL_FINAL |
            SuperAppDefinitions.BEFORE_AGREEMENT_CREATED_NOOP |
            SuperAppDefinitions.BEFORE_AGREEMENT_UPDATED_NOOP |
            SuperAppDefinitions.BEFORE_AGREEMENT_TERMINATED_NOOP;
        _host.registerApp(configWord);
        contractOwner = msg.sender;
    }

    function withdrawFees() public payable override onlyOwner nonReentrant {
        require(transactionFees > 0, "Nothing to withdraw");
        uint256 fees = transactionFees;
        transactionFees = 0;
        require(contractOwner.send(fees), "Insufficient funds");
        emit adminFeeCollection(block.timestamp, fees);
    }

    function mintToken(
        string memory tokenURI,
        uint256 tokenPrice,
        bool delegate,
        uint256 maxLeaseDays
    ) public override whenNotPaused {
        require(msg.sender != address(0), "Invalid sender");
        require(tokenPrice > 0, "Invalid token price");
        require(maxLeaseDays > 0, "Max lease must be positive");
        if (!minters[msg.sender].active) {
            minters[msg.sender].id = msg.sender;
            minters[msg.sender].totalStaked = 0;
            minters[msg.sender].active = true;
            mintersIds.push(msg.sender);
        }
        uint256 tokenId;
        if (delegate) {
            tokenId = fluidpebble.mintToken(address(this), tokenURI);
        } else {
            tokenId = fluidpebble.mintToken(msg.sender, tokenURI);
        }
        minters[msg.sender].tokenIds.push(tokenId); //@dev even if user burns token we keep it bad
        require(fluidpebble.tokenExists(tokenId), "Token not minted");
        currentFluidPebbles[tokenId].maxRentableDays = maxLeaseDays;
        currentFluidPebbles[tokenId].delegated = delegate;
        currentFluidPebbles[tokenId].tokenId = tokenId;
        currentFluidPebbles[tokenId].originalPrice = tokenPrice;
        currentFluidPebbles[tokenId].price = tokenPrice;
        currentFluidPebbles[tokenId].exists = true;
        currentFluidPebbles[tokenId].owner = msg.sender;
        emit newTokenMinted(
            msg.sender,
            tokenId,
            currentFluidPebbles[tokenId].price
        );
    }

    function buyToken(uint256 tokenId)
        public
        payable
        override
        nonReentrant
        whenNotPaused
    {
        require(!currentFluidPebbles[tokenId].rentedOut, "Not possible to buy");
        require(currentFluidPebbles[tokenId].delegated, "Token not delegated");
        require(msg.sender != address(0), "Invalid sender");
        require(
            fluidpebble.tokenExists(tokenId) &&
                currentFluidPebbles[tokenId].exists,
            "Token not minted yet or not active"
        );
        require(
            msg.sender != currentFluidPebbles[tokenId].owner &&
                fluidpebble.ownerOf(tokenId) != msg.sender,
            "Owner not allowed to buy own nft"
        );
        require(
            msg.value > currentFluidPebbles[tokenId].price,
            "Invalid buying price"
        );
        require(currentFluidPebbles[tokenId].delegated, "token not delegated");
        uint256 soldPrice = msg.value;
        uint256 tempPrice = getContractCut(
            msg.value.sub(currentFluidPebbles[tokenId].price)
        );
        transactionFees = transactionFees.add(tempPrice);
        uint256 remaining = msg.value.sub(tempPrice);
        require(
            currentFluidPebbles[tokenId].owner.send(remaining),
            "Insufficient funds"
        );
        currentFluidPebbles[tokenId].price = soldPrice;
        minters[currentFluidPebbles[tokenId].owner].totalStaked = minters[
            currentFluidPebbles[tokenId].owner
        ].totalStaked.add(remaining);
        address previousOwner = currentFluidPebbles[tokenId].owner;
        currentFluidPebbles[tokenId].owner = msg.sender;
        currentFluidPebbles[tokenId].delegated = false;
        fluidpebble.transferFrom(address(this), msg.sender, tokenId);
        emit transferTokenOwnerShip(
            msg.sender,
            previousOwner,
            msg.value,
            tokenId,
            tempPrice
        );
    }

    function revokeDelegatedNFT(uint256 tokenId) public override {
        require(msg.sender != address(0), "Invalid sender address");
        require(
            currentFluidPebbles[tokenId].exists &&
                fluidpebble.tokenExists(tokenId),
            "Token not listed or exists"
        );
        require(
            fluidpebble.ownerOf(tokenId) == address(this),
            "Contract Not Owner"
        );
        require(currentFluidPebbles[tokenId].delegated, "Token not delegated");
        fluidpebble.transferFrom(address(this), msg.sender, tokenId);
        currentFluidPebbles[tokenId].delegated = false;

        emit revokedDelegatedToken(tokenId);
    }

    function delegateNFT(uint256 tokenId) public override {
        require(msg.sender != address(0), "Invalid sender address");
        require(
            currentFluidPebbles[tokenId].exists &&
                fluidpebble.tokenExists(tokenId),
            "Token not listed or exists"
        );
        require(
            fluidpebble.ownerOf(tokenId) == address(this),
            "Contract Not Owner"
        );
        require(
            !currentFluidPebbles[tokenId].delegated,
            "Token already delegated"
        );
        currentFluidPebbles[tokenId].delegated = true;
        emit delegatedToken(tokenId);
    }

    function rentNFT(
        uint256 tokenId,
        uint256 duration,
        int96 flowRate
    ) public override nonReentrant whenNotPaused {
        require(msg.sender != address(0), "Invalid sender address");
        require(
            currentFluidPebbles[tokenId].exists &&
                fluidpebble.tokenExists(tokenId) &&
                currentFluidPebbles[tokenId].delegated,
            "Token not listed or exists or delegated"
        );
        require(!currentFluidPebbles[tokenId].rentedOut, "Token not available");
        require(
            currentFluidPebbles[tokenId].owner != msg.sender,
            "Owner Cannot rent"
        );
        require(
            duration > 0 &&
                currentFluidPebbles[tokenId].maxRentableDays >= duration,
            "Invalid duration"
        );
        currentFluidPebbles[tokenId].delegated = false;
        currentFluidPebbles[tokenId].borrowedAt = block.timestamp;
        currentFluidPebbles[tokenId].currentBorrower.duration = duration; //@dev in days
        currentFluidPebbles[tokenId].currentBorrower.owner = msg.sender;
        currentFluidPebbles[tokenId].currentBorrower.exists = true;
        currentFluidPebbles[tokenId].rentedOut = true;
        leasedTokenIds.push(tokenId);
        totalLeased=totalLeased.add(1);
        fluidpebble.transferFrom(address(this), msg.sender, tokenId);
        _createFlow(currentFluidPebbles[tokenId].owner, flowRate); //@dev create flow to user
        emit nftRentedOut(msg.sender, duration, tokenId);
    }

    function returnNFT(uint256 tokenId) public override nonReentrant {
        require(
            currentFluidPebbles[tokenId].exists &&
                fluidpebble.tokenExists(tokenId),
            "Token not listed or exists "
        );
        require(
            currentFluidPebbles[tokenId].currentBorrower.owner == msg.sender,
            "not borrower"
        );
        uint256 durationInDays = block
            .timestamp
            .sub(currentFluidPebbles[tokenId].borrowedAt)
            .div(86400);
        require(
            durationInDays <= currentFluidPebbles[tokenId].maxRentableDays,
            "Cannot return nft duration exceeded"
        );
        require(
            fluidpebble.ownerOf(tokenId) == currentFluidPebbles[tokenId].owner,
            "Token not returned"
        );
        int256 availableBalance;
        uint256 deposit;
        uint256 owedDeposit;
        (availableBalance, deposit, owedDeposit) = getNFTRealTimeBalance(
            tokenId
        );
        _deleteFlow(address(this), currentFluidPebbles[tokenId].owner);
        _acceptedToken.transferFrom(address(this), msg.sender, owedDeposit);
        currentFluidPebbles[tokenId].rentedOut = false;
        delete currentFluidPebbles[tokenId].currentBorrower;
        emit nftReturned(msg.sender, tokenId, block.timestamp);
    }

    function getMinterDetails(address id)
        public
        view
        override
        returns (uint256, bool)
    {
        return (minters[id].totalStaked, minters[id].active);
    }

    function getTokenDetails(uint256 tokenId)
        public
        view
        override
        returns (
            address,
            uint256,
            uint256,
            bool,
            bool,
            bool,
            uint256
        )
    {
        return (
            currentFluidPebbles[tokenId].owner,
            currentFluidPebbles[tokenId].price,
            currentFluidPebbles[tokenId].originalPrice,
            currentFluidPebbles[tokenId].exists,
            currentFluidPebbles[tokenId].delegated,
            currentFluidPebbles[tokenId].rentedOut,
            currentFluidPebbles[tokenId].borrowedAt
        );
    }

    function burnToken(uint256 tokenId) public whenNotPaused {
        fluidpebble.burnToken(tokenId);
    }

    function getContractCut(uint256 value) internal view returns (uint256) {
        uint256 roundValue = value.ceil(100);
        uint256 cut = roundValue.mul(contractCut).div(10000);
        return cut;
    }

    /*==============================Superfluid ============================*/

    function _createFlow(address to, int96 flowRate) internal {
        if (to == address(this) || to == address(0)) return;
        _host.callAgreement(
            _cfa,
            abi.encodeWithSelector(
                _cfa.createFlow.selector,
                _acceptedToken,
                to,
                flowRate,
                new bytes(0)
            ),
            new bytes(0)
        );
    }

    function _deleteFlow(address from, address to) internal {
        _host.callAgreement(
            _cfa,
            abi.encodeWithSelector(
                _cfa.deleteFlow.selector,
                _acceptedToken,
                from,
                to,
                new bytes(0) // placeholder
            ),
            new bytes(0)
        );
    }

    function getNFTRealTimeBalance(uint256 tokenId)
        public
        view
        returns (
            int256,
            uint256,
            uint256
        )
    {
        require(
            currentFluidPebbles[tokenId].exists &&
                fluidpebble.tokenExists(tokenId),
            "Token not listed or exists"
        );
        int256 availableBalance;
        uint256 deposit;
        uint256 owedDeposit;
        uint256 timestamp;
        (availableBalance, deposit, owedDeposit, timestamp) = _acceptedToken
            .realtimeBalanceOfNow(currentFluidPebbles[tokenId].owner);
        return (availableBalance, deposit, owedDeposit);
    }
}
