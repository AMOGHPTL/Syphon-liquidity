//SPDX-License-Identifier: MIT

pragma solidity ^0.8.18;

import {MarketParams, Position, Market, ISyphonBase} from "./interfaces/ISyphon.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {MockIrm} from "./mocks/MockIrm.sol";
import {console} from "forge-std/Test.sol";

contract Syphon is ISyphonBase {
    /************* Errors ******************/
    error Syphon__InvalidMarketParams();
    error Syphon__MarketAlredyExists();
    error Syphon__InvalidIdOrParams();
    error Syphon__InvalidTokenAddress();
    error Syphon__InvalidAmountEntered();
    error Syphon__SupplyTransferFailed();
    error Syphon_UserFoundWithNegativeIntereset();
    error Syphon__InsufficientUserSupply();
    error Syphon__InsufficientMarketSupply();

    /************ Events ******************/
    event MarketCreated(bytes32 indexed id, MarketParams marketParams);
    event Supplied(bytes32 id, address supplyToken, uint256 indexed amountToSupply);
    event withdrawn(bytes32 id, address withdrawToken, uint256 indexed amountToWithdraw);

    /***************** variables********** */
    address private owner;
    mapping(bytes32 id => Market) sMarket;
    mapping(bytes32 id => MarketParams marketParams) sIdToMarketParam;
    mapping(bytes32 id => mapping(address => Position)) sPositions;
    bytes32[] sMarketIds;

    /****************** modifier *******************/
    modifier idMatchesParams(MarketParams memory marketParams, bytes32 id) {
        bytes32 expectedId = createId(marketParams);
        if (expectedId != id) {
            revert Syphon__InvalidIdOrParams();
        }
        _;
    }

    modifier invalidToken(address token) {
        if (token == address(0)) {
            revert Syphon__InvalidTokenAddress();
        }
        _;
    }

    modifier amountIsZero(uint256 amount) {
        if (amount <= 0) {
            revert Syphon__InvalidAmountEntered();
        }
        _;
    }

    modifier checkWithdrawAmount(bytes32 id, address user, uint256 amountToWithdraw) {
        uint256 userSupplyShares = sPositions[id][user].supplyShares;
        if (userSupplyShares < amountToWithdraw) {
            revert Syphon__InsufficientUserSupply();
        }
        _;
    }

    modifier checkMarketSupply(bytes32 id, uint256 amountToWithdraw) {
        uint256 marketSupply = sMarket[id].totalSupplyAssets;
        if (marketSupply < amountToWithdraw) {
            revert Syphon__InsufficientMarketSupply();
        }
        _;
    }

    /***************** functions********** */

    /***************** constructor********** */
    constructor(address initialOwner) {
        owner = initialOwner;
    }

    /************* Exteranl functions *********/

    function createId(MarketParams memory marketParams) public pure returns (bytes32) {
        return keccak256(abi.encode(marketParams));
    }

    function createMarket(MarketParams memory marketParams, bytes32 id) public idMatchesParams(marketParams, id) {
        if (
            marketParams.collateralToken == address(0) || marketParams.loanToken == address(0)
                || marketParams.oracle == address(0) || marketParams.irm == address(0) || marketParams.lltv == 0
        ) {
            revert Syphon__InvalidMarketParams();
        } else if (sMarket[id].lastUpdate != 0) {
            revert Syphon__MarketAlredyExists();
        }

        sMarket[id].lastUpdate = uint128(block.timestamp);

        sIdToMarketParam[id] = marketParams;
        sMarketIds.push(id);

        emit MarketCreated(id, marketParams);
    }

    /**
     * lenders functions
     */
    function supply(MarketParams memory marketParams, bytes32 id, address supplyToken, uint256 amountToSupply)
        external
        idMatchesParams(marketParams, id)
        invalidToken(supplyToken)
        amountIsZero(amountToSupply)
    {
        sMarket[id].totalSupplyAssets += amountToSupply;
        sPositions[id][msg.sender] = Position(amountToSupply, 0, 0, block.timestamp);
        bool success = IERC20(supplyToken).transferFrom(msg.sender, address(this), amountToSupply);
        if (!success) {
            revert Syphon__SupplyTransferFailed();
        }
        sPositions[id][msg.sender].lastUpdatedAt = block.timestamp;
        emit Supplied(id, supplyToken, amountToSupply);
    }

    function withdraw(MarketParams memory marketParams, bytes32 id, address withdrawToken, uint256 amountToWithdraw)
        external
        idMatchesParams(marketParams, id)
        invalidToken(withdrawToken)
        amountIsZero(amountToWithdraw)
        checkWithdrawAmount(id, msg.sender, amountToWithdraw)
        checkMarketSupply(id, amountToWithdraw)
    {
        uint256 usersInterest = calculateInterest(marketParams, id, msg.sender);
        if (usersInterest < 0) revert Syphon_UserFoundWithNegativeIntereset();
        uint256 amountWithInterest = sPositions[id][msg.sender].supplyShares + usersInterest;

        sMarket[id].totalSupplyAssets -= amountToWithdraw;
        sPositions[id][msg.sender].supplyShares -= amountToWithdraw;
        IERC20(withdrawToken).transfer(msg.sender, amountWithInterest);

        sPositions[id][msg.sender].lastUpdatedAt = block.timestamp;

        emit withdrawn(id, withdrawToken, amountToWithdraw);
    }

    /**
     * borrowers functions
     */

    function supplyCollateral(
        MarketParams memory marketParams,
        bytes32 id,
        address collateralToken,
        uint256 amountToSupply
    ) external idMatchesParams(marketParams, id) {}
    function withdrawCollateral(
        MarketParams memory marketParams,
        bytes32 id,
        address collateralToken,
        uint256 amountToWithdraw
    ) external idMatchesParams(marketParams, id) {}
    function borrow(
        MarketParams memory marketParams,
        bytes32 id,
        address collateralToken,
        address loanToken,
        uint256 amountToSupply
    ) external idMatchesParams(marketParams, id) {}
    function repay(
        MarketParams memory marketParams,
        bytes32 id,
        address collateralToken,
        address loanToken,
        uint256 amountToRepay
    ) external idMatchesParams(marketParams, id) {}

    /**
     * liquidation functions
     */
    function liquidate(
        MarketParams memory marketParams,
        bytes32 id,
        address toLiquidate,
        address collateralToken,
        address loanToken,
        uint256 repayAmout
    ) external idMatchesParams(marketParams, id) {}

    /********************* External view functions ***********************/
    function calculateInterest(MarketParams memory marketParms, bytes32 id, address user)
        public
        view
        returns (uint256)
    {
        Position memory userPosition = sPositions[id][user];
        uint256 lastUpdate = userPosition.lastUpdatedAt;
        uint256 userSupply = userPosition.supplyShares;
        uint256 userBorrow = userPosition.borrowShares;
        console.log("syphon block timestamp:", block.timestamp);
        uint256 timeSpend = block.timestamp - lastUpdate;
        Market memory market = sMarket[id];
        uint256 interestRate = MockIrm(marketParms.irm).borrowRate(market);
        console.log("intersetRate:", interestRate);
        uint256 dailyInterst = interestRate / 365;
        console.log("daily interest:", dailyInterst);
        if (timeSpend == 0) return 0;
        uint256 interest =
            ((userSupply) * (dailyInterst * timeSpend)) / 1e18 - ((userBorrow) * (dailyInterst * timeSpend)) / 1e18;
        return interest;
    }

    ////////////////////**********************getter functions*********//////////////////////
    function getMarkets() public view returns (bytes32[] memory) {
        return sMarketIds;
    }

    function getMarketInfo(bytes32 id) public view returns (Market memory) {
        return sMarket[id];
    }

    function getUserPosition(bytes32 id, address user) public view returns (Position memory) {
        return sPositions[id][user];
    }
}
