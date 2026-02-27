//SPDX-License-Identifier: MIT

pragma solidity ^0.8.18;

import {MarketParams, Position, Market, ISyphonBase} from "./interfaces/ISyphon.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {MockIrm} from "./mocks/MockIrm.sol";
import {console} from "forge-std/Test.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import {IOracle} from "./interfaces/IOracle.sol";

contract Syphon is ISyphonBase {
    using Math for uint256;
    /************* Errors ******************/
    error Syphon__InvalidMarketParams();
    error Syphon__MarketAlreadyExists();
    error Syphon__InvalidIdOrParams();
    error Syphon__InvalidTokenAddress();
    error Syphon__InvalidAmountEntered();
    error Syphon__SupplyTransferFailed();
    error Syphon__UserFoundWithNegativeIntereset();
    error Syphon__InsufficientUserSupply();
    error Syphon__InsufficientMarketSupply();
    error Syphon__CollateralTransferFailed();
    error Syphon__InvalidWithdrawAmount();
    error Syphon__WithdrwalFailed();
    error Syphon__CollateralWithdrawFailed();
    error Syphon__UnderCollateralized();
    error Syphon__MarketDoesNotExits();
    error Syphon__InsufficientLoanSupply();
    error Syphon__BorrowTransferFailed();
    error Syphon__InvalidRepayAmount();
    error Syphon__RepayTransferFailed();
    error Syphon__AmbiguousRepayInput();
    error Syphon__InsufficientShares();
    error Syphon__BadHealthFactor();
    error Syphon__HealthyPosition();
    error Syphon__LiquidationLoanFailed();
    error Syphon__IncentiveTransferFailed();

    /************ Events ******************/
    event MarketCreated(bytes32 indexed id, MarketParams marketParams);
    event Supplied(bytes32 id, address supplyToken, uint256 indexed amountToSupply);
    event withdrawn(bytes32 id, address withdrawToken, uint256 indexed amountToWithdraw);
    event collateralSupplied(bytes32 id, address collateralToken, uint256 indexed collateralAmount);
    event collateralWithdrawn(bytes32 id, address collateralToken, uint256 indexed collateralToWithdraw);
    event borrowed(bytes32 id, address loanToken, uint256 indexed borrowAmount);
    event repayed(bytes32 id, uint256 indexed sharesRepayed, uint256 repayAmount);
    event liquidated(address indexed liquidatedAddress, address liquidator, uint256 incentive);

    /*************** variables *********************/
    address private owner;
    mapping(bytes32 id => Market) sMarket;
    mapping(bytes32 id => MarketParams marketParams) sIdToMarketParam;
    mapping(bytes32 id => mapping(address => Position)) sPositions;
    bytes32[] sMarketIds;
    uint256 constant SHARE_PRECISION = 1e18;
    uint256 constant OVER_COLLATERALIZED_RATE = 120e15;
    uint256 constant OVER_COLLATERALIZED_PRECISION = 1e18;
    uint256 constant HEALTHFACTOR_PRECISION = 1e18;
    uint256 constant ORACLE_SCALE_PRECISION = 1e18;

    /****************** modifier *******************/
    modifier idMatchesParams(MarketParams memory marketParams, bytes32 id) {
        bytes32 expectedId = createId(marketParams);
        if (expectedId != id) {
            revert Syphon__InvalidIdOrParams();
        }
        _;
    }

    modifier marketExists(bytes32 id) {
        Market memory market = sMarket[id];
        if (market.lastUpdate == 0) {
            revert Syphon__MarketDoesNotExits();
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
            revert Syphon__MarketAlreadyExists();
        }

        sMarket[id].lastUpdate = uint128(block.timestamp);

        sIdToMarketParam[id] = marketParams;
        sMarketIds.push(id);

        emit MarketCreated(id, marketParams);
    }

    /**
     * lenders functions
     */
    function supply(MarketParams memory marketParams, bytes32 id, uint256 amountToSupply)
        external
        idMatchesParams(marketParams, id)
        amountIsZero(amountToSupply)
        marketExists(id)
    {
        _accrueInterest(marketParams, id);
        if (sMarket[id].totalSupplyAssets == 0) {
            // First ever supply
            uint256 shares = amountToSupply; // or amountToSupply, or 1e18, etc.
            sMarket[id].totalSupplyShares = shares;
            sMarket[id].totalSupplyAssets = amountToSupply;
            sPositions[id][msg.sender].supplyShares = shares;
        } else {
            uint256 shares = amountToSupply.mulDiv(sMarket[id].totalSupplyShares, sMarket[id].totalSupplyAssets);
            sMarket[id].totalSupplyShares += shares;
            sMarket[id].totalSupplyAssets += amountToSupply;
            sPositions[id][msg.sender].supplyShares += shares;
        }

        bool success = IERC20(marketParams.loanToken).transferFrom(msg.sender, address(this), amountToSupply);
        if (!success) {
            revert Syphon__SupplyTransferFailed();
        }
        emit Supplied(id, marketParams.loanToken, amountToSupply);
    }

    function withdraw(MarketParams memory marketParams, bytes32 id, uint256 amountToWithdraw, uint256 sharesToWithdraw)
        external
        idMatchesParams(marketParams, id)
        marketExists(id)
    {
        if (amountToWithdraw == 0 && sharesToWithdraw == 0) {
            revert Syphon__InvalidWithdrawAmount();
        }
        uint256 sharesToBurn;
        uint256 amountToGive;
        _accrueInterest(marketParams, id);

        if (amountToWithdraw == 0) {
            sharesToBurn = sharesToWithdraw;
        } else {
            sharesToBurn = Math.mulDiv(amountToWithdraw, sMarket[id].totalSupplyShares, sMarket[id].totalSupplyAssets);
        }

        if (sharesToBurn > sPositions[id][msg.sender].supplyShares) {
            revert Syphon__InsufficientShares();
        }
        amountToGive = Math.mulDiv(sharesToBurn, sMarket[id].totalSupplyAssets, sMarket[id].totalSupplyShares);
        console.log("user supply shares while withdraw:", sPositions[id][msg.sender].supplyShares);
        console.log("shares to burn:", sharesToBurn);
        sMarket[id].totalSupplyAssets -= amountToGive;
        sPositions[id][msg.sender].supplyShares -= sharesToBurn;
        sMarket[id].totalSupplyShares -= sharesToBurn;
        bool success = IERC20(marketParams.loanToken).transfer(msg.sender, amountToGive);
        if (!success) {
            revert Syphon__WithdrwalFailed();
        }

        emit withdrawn(id, marketParams.loanToken, amountToGive);
    }

    /**
     * borrowers functions
     */

    function supplyCollateral(MarketParams memory marketParams, bytes32 id, uint256 collateralAmount)
        external
        idMatchesParams(marketParams, id)
        amountIsZero(collateralAmount)
        marketExists(id)
    {
        sPositions[id][msg.sender].collateral += collateralAmount;
        bool succes = IERC20(marketParams.collateralToken).transferFrom(msg.sender, address(this), collateralAmount);
        if (!succes) {
            revert Syphon__CollateralTransferFailed();
        }

        emit collateralSupplied(id, marketParams.collateralToken, collateralAmount);
    }

    function withdrawCollateral(MarketParams memory marketParams, bytes32 id, uint256 collateralToWithdraw)
        external
        idMatchesParams(marketParams, id)
        amountIsZero(collateralToWithdraw)
        marketExists(id)
    {
        uint256 userHealthFactor = _healthFactor(marketParams, id, msg.sender);
        if (_healthFactor(marketParams, id, msg.sender) < HEALTHFACTOR_PRECISION) {
            revert Syphon__BadHealthFactor();
        }
        console.log("user health factor:", userHealthFactor);
        sPositions[id][msg.sender].collateral -= collateralToWithdraw;
        bool succes = IERC20(marketParams.collateralToken).transfer(msg.sender, collateralToWithdraw);
        if (!succes) {
            revert Syphon__CollateralWithdrawFailed();
        }

        emit collateralWithdrawn(id, marketParams.collateralToken, collateralToWithdraw);
    }

    function borrow(MarketParams memory marketParams, bytes32 id, uint256 amountToBorrow)
        external
        idMatchesParams(marketParams, id)
        amountIsZero(amountToBorrow)
        marketExists(id)
    {
        _accrueInterest(marketParams, id);
        Position memory position = sPositions[id][msg.sender];
        Market memory market = sMarket[id];

        uint256 collateralPrice = IOracle(marketParams.oracle).price();

        uint256 amountToBorrowInCollateralToken = Math.mulDiv(amountToBorrow, ORACLE_SCALE_PRECISION, collateralPrice);

        //check if the borrower is over collateralized
        uint256 requiredCollateral =
            (amountToBorrowInCollateralToken * OVER_COLLATERALIZED_RATE) / OVER_COLLATERALIZED_PRECISION;
        console.log("required collateral :", requiredCollateral);
        if (position.collateral < requiredCollateral) {
            revert Syphon__UnderCollateralized();
        }
        if (amountToBorrow > market.totalSupplyAssets) {
            revert Syphon__InsufficientLoanSupply();
        }

        if (sMarket[id].totalBorrowAssets == 0) {
            // First ever borrow
            uint256 shares = amountToBorrow; // or amountToBorrow, or 1e18, etc.
            sMarket[id].totalBorrowShares = shares;
            sMarket[id].totalBorrowAssets = amountToBorrow;
            sPositions[id][msg.sender].borrowShares = shares;
        } else {
            uint256 shares = amountToBorrow.mulDiv(SHARE_PRECISION, sMarket[id].totalBorrowAssets);
            sMarket[id].totalBorrowShares += shares;
            sMarket[id].totalBorrowAssets += amountToBorrow;
            sPositions[id][msg.sender].borrowShares += shares;
        }

        sMarket[id].lastUpdate = block.timestamp;

        bool success = IERC20(marketParams.loanToken).transfer(msg.sender, amountToBorrow);
        if (!success) {
            revert Syphon__BorrowTransferFailed();
        }

        emit borrowed(id, marketParams.loanToken, amountToBorrow);
    }

    function repay(MarketParams memory marketParams, bytes32 id, uint256 amountToRepay, uint256 sharesToRepay)
        external
        idMatchesParams(marketParams, id)
        marketExists(id)
    {
        if (amountToRepay == 0 && sharesToRepay == 0) {
            revert Syphon__InvalidRepayAmount();
        }
        if (amountToRepay != 0 && sharesToRepay != 0) {
            revert Syphon__AmbiguousRepayInput();
        }
        _accrueInterest(marketParams, id);
        uint256 sharesToBurn;
        uint256 repayAmount;
        Market memory market = sMarket[id];
        Position memory position = sPositions[id][msg.sender];

        if (amountToRepay == 0) {
            sharesToBurn = sharesToRepay;
        } else {
            sharesToBurn = Math.mulDiv(amountToRepay, market.totalBorrowShares, market.totalBorrowAssets);
        }
        console.log("user borrow shares:", position.borrowShares);
        console.log("shares to repay:", sharesToRepay);
        console.log("amount to repay:", amountToRepay);
        console.log("market total borrow shares:", market.totalBorrowShares);
        console.log("market total borrow assets:", market.totalBorrowAssets);
        console.log("shares to burn:", sharesToBurn);

        repayAmount = Math.mulDiv(sharesToBurn, market.totalBorrowAssets, market.totalBorrowShares);
        console.log("repayAmount:", repayAmount);

        sMarket[id].totalBorrowShares -= sharesToBurn;
        sMarket[id].totalBorrowAssets -= repayAmount;
        sPositions[id][msg.sender].borrowShares -= sharesToBurn;
        bool success = IERC20(marketParams.loanToken).transferFrom(msg.sender, address(this), repayAmount);
        if (!success) {
            revert Syphon__RepayTransferFailed();
        }

        emit repayed(id, sharesToBurn, repayAmount);
    }

    /**
     * liquidation functions
     */
    function liquidate(MarketParams memory marketParams, bytes32 id, address toLiquidate)
        external
        idMatchesParams(marketParams, id)
        marketExists(id)
    {
        uint256 sharesToBurn;
        uint256 assetsToBurn;
        uint256 liquidationIncentive;
        _accrueInterest(marketParams, id);
        if (_healthFactor(marketParams, id, toLiquidate) >= HEALTHFACTOR_PRECISION) {
            revert Syphon__HealthyPosition();
        }
        Market memory market = sMarket[id];
        Position memory position = sPositions[id][toLiquidate];

        liquidationIncentive = position.collateral;
        console.log("liquidation incentive:", liquidationIncentive);
        sharesToBurn = position.borrowShares;
        console.log("shares to burn", sharesToBurn);
        assetsToBurn = Math.mulDiv(sharesToBurn, market.totalBorrowAssets, market.totalBorrowShares);
        console.log("assets to burn:", assetsToBurn);
        sMarket[id].totalBorrowShares -= sharesToBurn;
        sMarket[id].totalBorrowAssets -= assetsToBurn;
        sPositions[id][toLiquidate].borrowShares = 0;
        sPositions[id][toLiquidate].collateral = 0;

        bool loanPayback = IERC20(marketParams.loanToken).transferFrom(msg.sender, address(this), assetsToBurn);
        if (!loanPayback) {
            revert Syphon__LiquidationLoanFailed();
        }
        bool incentiveTransfer = IERC20(marketParams.collateralToken).transfer(msg.sender, liquidationIncentive);
        if (!incentiveTransfer) {
            revert Syphon__IncentiveTransferFailed();
        }

        emit liquidated(toLiquidate, msg.sender, liquidationIncentive);
    }

    function _accrueInterest(MarketParams memory marketParams, bytes32 id) public {
        uint256 elapsed = block.timestamp - sMarket[id].lastUpdate;
        uint256 borrowRate = MockIrm(marketParams.irm).borrowRate(sMarket[id]);
        uint256 dailyBorrowRate = borrowRate / 365;
        uint256 interest = dailyBorrowRate * sMarket[id].totalBorrowAssets * elapsed;

        sMarket[id].totalSupplyAssets += interest;
        sMarket[id].totalBorrowAssets += interest;
    }

    function _healthFactor(MarketParams memory marketParams, bytes32 id, address user) public view returns (uint256) {
        Market memory market = sMarket[id];
        Position memory position = sPositions[id][user];

        if (market.totalBorrowShares == 0) return type(uint256).max;

        uint256 collateralPrice = IOracle(marketParams.oracle).price();
        console.log("collateral price:", collateralPrice);

        uint256 userSharesValue = Math.mulDiv(position.borrowShares, market.totalBorrowAssets, market.totalBorrowShares);
        console.log("user shares value:", userSharesValue);
        uint256 collateralValueInLoanToken = Math.mulDiv(position.collateral, ORACLE_SCALE_PRECISION, collateralPrice);
        console.log("collateral value in loan token:", collateralValueInLoanToken);
        uint256 healthFactor = Math.mulDiv(collateralValueInLoanToken, HEALTHFACTOR_PRECISION, userSharesValue);
        return healthFactor;
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
