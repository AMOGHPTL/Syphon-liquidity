// //SPDX-License-Identifier: MIT

// pragma solidity ^0.8.18;

// import {IIrm, Market} from "../interfaces/IIrm.sol";

// contract MockIrm is IIrm {
//     function borrowRate(Market memory market) external pure returns (uint256) {
//         uint256 optimalUtilization = 80e16;
//         if (market.totalBorrowAssets == 0) return 0;
//         if (market.totalSupplyAssets == 0) return 80e16;

//         uint256 utilization = market.totalBorrowAssets * 1e18 / market.totalSupplyAssets;

//         if (utilization > optimalUtilization) {
//             return 80e16;
//         } else {
//             return 20e16;
//         }
//     }
// }

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import {IIrm, Market} from "../interfaces/IIrm.sol";

/// @title MockIrm
/// @notice Two-slope linear IRM inspired by Morpho's AdaptiveCurveIrm base logic.
///         Below optimal utilization: rate scales linearly from BASE_RATE to RATE_AT_TARGET.
///         Above optimal utilization: rate scales linearly from RATE_AT_TARGET to MAX_RATE.
contract MockIrm is IIrm {
    /// @dev 80% optimal utilization (WAD-scaled)
    uint256 public constant OPTIMAL_UTILIZATION = 80e16;

    /// @dev Minimum borrow rate at 0% utilization: 1% APR
    uint256 public constant BASE_RATE = 1e16;

    /// @dev Borrow rate at optimal utilization: 20% APR
    uint256 public constant RATE_AT_TARGET = 20e16;

    /// @dev Maximum borrow rate at 100% utilization: 150% APR
    uint256 public constant MAX_RATE = 150e16;

    /// @dev WAD (1e18) used for fixed-point math
    uint256 internal constant WAD = 1e18;

    function borrowRate(Market memory market) external pure returns (uint256) {
        if (market.totalBorrowAssets == 0) return BASE_RATE;
        if (market.totalSupplyAssets == 0) return MAX_RATE;

        uint256 utilization = market.totalBorrowAssets * WAD / market.totalSupplyAssets;

        if (utilization <= OPTIMAL_UTILIZATION) {
            // Normal slope: BASE_RATE → RATE_AT_TARGET over [0, OPTIMAL_UTILIZATION]
            // rate = BASE_RATE + (RATE_AT_TARGET - BASE_RATE) * utilization / OPTIMAL_UTILIZATION
            return BASE_RATE + (RATE_AT_TARGET - BASE_RATE) * utilization / OPTIMAL_UTILIZATION;
        } else {
            // Steep slope: RATE_AT_TARGET → MAX_RATE over (OPTIMAL_UTILIZATION, WAD]
            // rate = RATE_AT_TARGET + (MAX_RATE - RATE_AT_TARGET) * (utilization - OPTIMAL) / (WAD - OPTIMAL)
            return RATE_AT_TARGET + (MAX_RATE - RATE_AT_TARGET) * (utilization - OPTIMAL_UTILIZATION)
                / (WAD - OPTIMAL_UTILIZATION);
        }
    }
}
