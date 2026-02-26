//SPDX-License-Identifier: MIT

pragma solidity ^0.8.18;

struct MarketParams {
    address collateralToken;
    address loanToken;
    address oracle;
    address irm;
    uint256 lltv;
}

struct Position {
    uint256 supplyShares;
    uint256 borrowShares;
    uint256 collateral;
}

struct Market {
    uint256 totalSupplyAssets;
    uint256 totalSupplyShares;
    uint256 totalBorrowAssets;
    uint256 totalBorrowShares;
    uint256 lastUpdate;
    uint256 fee;
}

interface ISyphonBase {
    /**
     * creating market
     */
    function createMarket(MarketParams memory marketParams, bytes32 id) external;

    /**
     * lenders functions
     */
    function supply(MarketParams memory marketParams, bytes32 id, uint256 amountToSupply) external;
    function withdraw(MarketParams memory marketParams, bytes32 id, uint256 amountToWithdraw, uint256 shareToWithdraw)
        external;

    /**
     * borrowers functions
     */

    function supplyCollateral(MarketParams memory marketParams, bytes32 id, uint256 amountToSupply) external;
    function withdrawCollateral(MarketParams memory marketParams, bytes32 id, uint256 amountToWithdraw) external;
    function borrow(MarketParams memory marketParams, bytes32 id, uint256 amountToBorrow) external;
    function repay(MarketParams memory marketParams, bytes32 id, uint256 amountToRepay, uint256 sharesToRepay) external;

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
    ) external;
}
