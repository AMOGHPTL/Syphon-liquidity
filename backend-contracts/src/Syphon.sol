//SPDX-License-Identifier: MIT

pragma solidity ^0.8.18;

import {MarketParams, Position, Market, ISyphonBase} from "./interfaces/ISyphon.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {MockIrm} from "./mocks/MockIrm.sol";
import {console} from "forge-std/Test.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import {IOracle} from "./interfaces/IOracle.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract Syphon is ISyphonBase, ReentrancyGuard {
    using Math for uint256;
    using SafeERC20 for IERC20;

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

    event MarketCreated(bytes32 indexed id, MarketParams marketParams);
    event Supplied(bytes32 id, address supplyToken, uint256 indexed amountToSupply);
    event withdrawn(bytes32 id, address withdrawToken, uint256 indexed amountToWithdraw);
    event collateralSupplied(bytes32 id, address collateralToken, uint256 indexed collateralAmount);
    event collateralWithdrawn(bytes32 id, address collateralToken, uint256 indexed collateralToWithdraw);
    event borrowed(bytes32 id, address loanToken, uint256 indexed borrowAmount);
    event repayed(bytes32 id, uint256 indexed sharesRepayed, uint256 repayAmount);
    event liquidated(address indexed liquidatedAddress, address liquidator, uint256 incentive);

    address private owner;
    mapping(bytes32 id => Market) sMarket;
    mapping(bytes32 id => MarketParams marketParams) sIdToMarketParam;
    mapping(bytes32 id => mapping(address => Position)) sPositions;
    bytes32[] sMarketIds;
    uint256 constant SHARE_PRECISION = 1e18;
    uint256 constant OVER_COLLATERALIZED_RATE = 120e16;
    uint256 constant OVER_COLLATERALIZED_PRECISION = 1e18;
    uint256 constant HEALTHFACTOR_PRECISION = 1e18;
    uint256 constant ORACLE_SCALE_PRECISION = 1e18;
    uint256 constant INTEREST_PRECISION = 1e18;

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

    constructor(address initialOwner) {
        owner = initialOwner;
    }

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

    function supply(MarketParams memory marketParams, bytes32 id, uint256 amountToSupply)
        external
        nonReentrant
        idMatchesParams(marketParams, id)
        amountIsZero(amountToSupply)
        marketExists(id)
    {
        _accrueInterest(marketParams, id);
        if (sMarket[id].totalSupplyAssets == 0) {
            uint256 shares = amountToSupply;
            sMarket[id].totalSupplyShares = shares;
            sMarket[id].totalSupplyAssets = amountToSupply;
            sPositions[id][msg.sender].supplyShares = shares;
        } else {
            uint256 shares = amountToSupply.mulDiv(sMarket[id].totalSupplyShares, sMarket[id].totalSupplyAssets);
            sMarket[id].totalSupplyShares += shares;
            sMarket[id].totalSupplyAssets += amountToSupply;
            sPositions[id][msg.sender].supplyShares += shares;
        }

        IERC20(marketParams.loanToken).safeTransferFrom(msg.sender, address(this), amountToSupply);

        emit Supplied(id, marketParams.loanToken, amountToSupply);
    }

    function withdraw(MarketParams memory marketParams, bytes32 id, uint256 amountToWithdraw, uint256 sharesToWithdraw)
        external
        nonReentrant
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
        IERC20(marketParams.loanToken).safeTransfer(msg.sender, amountToGive);

        emit withdrawn(id, marketParams.loanToken, amountToGive);
    }

    function supplyCollateral(MarketParams memory marketParams, bytes32 id, uint256 collateralAmount)
        external
        nonReentrant
        idMatchesParams(marketParams, id)
        amountIsZero(collateralAmount)
        marketExists(id)
    {
        _accrueInterest(marketParams, id);
        sPositions[id][msg.sender].collateral += collateralAmount;
        IERC20(marketParams.collateralToken).safeTransferFrom(msg.sender, address(this), collateralAmount);

        emit collateralSupplied(id, marketParams.collateralToken, collateralAmount);
    }

    function withdrawCollateral(MarketParams memory marketParams, bytes32 id, uint256 collateralToWithdraw)
        external
        nonReentrant
        idMatchesParams(marketParams, id)
        amountIsZero(collateralToWithdraw)
        marketExists(id)
    {
        _accrueInterest(marketParams, id);
        sPositions[id][msg.sender].collateral -= collateralToWithdraw;

        if (_healthFactor(marketParams, id, msg.sender) < HEALTHFACTOR_PRECISION) {
            revert Syphon__BadHealthFactor();
        }

        IERC20(marketParams.collateralToken).safeTransfer(msg.sender, collateralToWithdraw);

        emit collateralWithdrawn(id, marketParams.collateralToken, collateralToWithdraw);
    }

    function borrow(MarketParams memory marketParams, bytes32 id, uint256 amountToBorrow)
        external
        nonReentrant
        idMatchesParams(marketParams, id)
        amountIsZero(amountToBorrow)
        marketExists(id)
    {
        _accrueInterest(marketParams, id);
        Position memory position = sPositions[id][msg.sender];
        Market memory market = sMarket[id];

        uint256 collateralPrice = IOracle(marketParams.oracle).price();

        uint256 amountToBorrowInCollateralToken = Math.mulDiv(amountToBorrow, ORACLE_SCALE_PRECISION, collateralPrice);

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
            uint256 shares = amountToBorrow;
            sMarket[id].totalBorrowShares = shares;
            sMarket[id].totalBorrowAssets = amountToBorrow;
            sPositions[id][msg.sender].borrowShares = shares;
        } else {
            uint256 shares = amountToBorrow.mulDiv(sMarket[id].totalBorrowShares, sMarket[id].totalBorrowAssets);
            sMarket[id].totalBorrowShares += shares;
            sMarket[id].totalBorrowAssets += amountToBorrow;
            sPositions[id][msg.sender].borrowShares += shares;
        }

        sMarket[id].totalSupplyAssets -= amountToBorrow;
        sMarket[id].lastUpdate = block.timestamp;

        IERC20(marketParams.loanToken).safeTransfer(msg.sender, amountToBorrow);

        emit borrowed(id, marketParams.loanToken, amountToBorrow);
    }

    function repay(MarketParams memory marketParams, bytes32 id, uint256 amountToRepay, uint256 sharesToRepay)
        external
        nonReentrant
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
        sMarket[id].totalSupplyAssets += repayAmount;
        sPositions[id][msg.sender].borrowShares -= sharesToBurn;
        IERC20(marketParams.loanToken).safeTransferFrom(msg.sender, address(this), repayAmount);

        emit repayed(id, sharesToBurn, repayAmount);
    }

    function liquidate(MarketParams memory marketParams, bytes32 id, address toLiquidate)
        external
        nonReentrant
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
        sMarket[id].totalSupplyAssets += assetsToBurn;
        sPositions[id][toLiquidate].borrowShares = 0;
        sPositions[id][toLiquidate].collateral = 0;

        IERC20(marketParams.loanToken).safeTransferFrom(msg.sender, address(this), assetsToBurn);

        IERC20(marketParams.collateralToken).safeTransfer(msg.sender, liquidationIncentive);

        emit liquidated(toLiquidate, msg.sender, liquidationIncentive);
    }

    function _accrueInterest(MarketParams memory marketParams, bytes32 id) internal {
        uint256 elapsed = block.timestamp - sMarket[id].lastUpdate;
        if (elapsed == 0) return;
        if (sMarket[id].totalBorrowAssets == 0) {
            sMarket[id].lastUpdate = block.timestamp;
            return;
        }
        uint256 borrowRate = MockIrm(marketParams.irm).borrowRate(sMarket[id]);
        uint256 interest = borrowRate.mulDiv(sMarket[id].totalBorrowAssets * elapsed, 365 days * INTEREST_PRECISION);

        sMarket[id].totalSupplyAssets += interest;
        sMarket[id].totalBorrowAssets += interest;
        sMarket[id].lastUpdate = block.timestamp;
    }

    function _healthFactor(MarketParams memory marketParams, bytes32 id, address user) public view returns (uint256) {
        Market memory market = sMarket[id];
        Position memory position = sPositions[id][user];

        if (position.borrowShares == 0) return type(uint256).max;

        uint256 collateralPrice = IOracle(marketParams.oracle).price();
        console.log("collateral price:", collateralPrice);

        uint256 userSharesValue = Math.mulDiv(position.borrowShares, market.totalBorrowAssets, market.totalBorrowShares);
        console.log("user shares value:", userSharesValue);
        uint256 collateralValueInLoanToken = Math.mulDiv(position.collateral, ORACLE_SCALE_PRECISION, collateralPrice);
        console.log("collateral value in loan token:", collateralValueInLoanToken);
        uint256 healthFactor = Math.mulDiv(collateralValueInLoanToken, HEALTHFACTOR_PRECISION, userSharesValue);
        return healthFactor;
    }

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
