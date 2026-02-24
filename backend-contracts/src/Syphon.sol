//SPDX-License-Identifier: MIT

pragma solidity ^0.8.18;

import {MarketParams, Position, Market, ISyphonBase} from "./interfaces/ISyphon.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {MockIrm} from "./mocks/MockIrm.sol";
import {console} from "forge-std/Test.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";

contract Syphon is ISyphonBase {
    using Math for uint256;
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
    error Syphon__CollateralTransferFailed();
    error Syphon__InvalidWithdrawAmount();

    /************ Events ******************/
    event MarketCreated(bytes32 indexed id, MarketParams marketParams);
    event Supplied(bytes32 id, address supplyToken, uint256 indexed amountToSupply);
    event withdrawn(bytes32 id, address withdrawToken, uint256 indexed amountToWithdraw);
    event collateralSupplied(bytes32 id, address collateralToken, uint256 indexed collateralAmount);

    /*************** variables *********************/
    address private owner;
    mapping(bytes32 id => Market) sMarket;
    mapping(bytes32 id => MarketParams marketParams) sIdToMarketParam;
    mapping(bytes32 id => mapping(address => Position)) sPositions;
    bytes32[] sMarketIds;
    uint256 constant SHARE_PRECISION = 1e18;

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
    function supply(MarketParams memory marketParams, bytes32 id, uint256 amountToSupply)
        external
        idMatchesParams(marketParams, id)
        amountIsZero(amountToSupply)
    {
        _accrueInterest(marketParams, id);
        if (sMarket[id].totalSupplyAssets == 0) {
            // First ever supply
            uint256 shares = amountToSupply == 0 ? 0 : SHARE_PRECISION; // or amountToSupply, or 1e18, etc.
            sMarket[id].totalSupplyShares = shares;
            sMarket[id].totalSupplyAssets = amountToSupply;
            sPositions[id][msg.sender].supplyShares = shares;
        } else {
            // Your original (but still wrong long-term) logic
            uint256 shares = amountToSupply.mulDiv(SHARE_PRECISION, sMarket[id].totalSupplyAssets);
            sMarket[id].totalSupplyShares += shares;
            sMarket[id].totalSupplyAssets += amountToSupply;
            sPositions[id][msg.sender].supplyShares += shares;
        }

        sMarket[id].lastUpdate = block.timestamp;

        bool success = IERC20(marketParams.loanToken).transferFrom(msg.sender, address(this), amountToSupply);
        if (!success) {
            revert Syphon__SupplyTransferFailed();
        }
        emit Supplied(id, marketParams.loanToken, amountToSupply);
    }

    function withdraw(MarketParams memory marketParams, bytes32 id, uint256 amountToWithdraw, uint256 sharesToWithdraw)
        external
        idMatchesParams(marketParams, id)
        checkMarketSupply(id, amountToWithdraw)
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
            sharesToBurn =
            ((sPositions[id][msg.sender].supplyShares * amountToWithdraw) / sMarket[id].totalSupplyAssets);
        }
        amountToGive = Math.mulDiv(sharesToBurn, sMarket[id].totalSupplyAssets, sMarket[id].totalSupplyShares);
        console.log("user supply shares while withdraw:", sPositions[id][msg.sender].supplyShares);
        console.log("shares to burn:", sharesToBurn);
        sMarket[id].totalSupplyAssets -= amountToGive;
        sPositions[id][msg.sender].supplyShares -= sharesToBurn;
        sMarket[id].totalSupplyShares -= sharesToBurn;
        IERC20(marketParams.loanToken).transfer(msg.sender, amountToGive);

        emit withdrawn(id, marketParams.loanToken, amountToWithdraw);
    }

    /**
     * borrowers functions
     */

    function supplyCollateral(MarketParams memory marketParams, bytes32 id, uint256 collateralAmount)
        external
        idMatchesParams(marketParams, id)
        invalidToken(collateralToken)
        amountIsZero(collateralAmount)
    {}
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

    function _accrueInterest(MarketParams memory marketParams, bytes32 id) public {
        uint256 elapsed = block.timestamp - sMarket[id].lastUpdate;
        uint256 borrowRate = MockIrm(marketParams.irm).borrowRate(sMarket[id]);
        uint256 dailyBorrowRate = borrowRate / 365;
        uint256 interest = dailyBorrowRate * sMarket[id].totalBorrowAssets * elapsed;

        sMarket[id].totalSupplyAssets += interest;
        sMarket[id].totalBorrowAssets += interest;
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
