//SPDX-License-Identifier: MIT

pragma solidity ^0.8.18;

import {IIrm, Market} from "../interfaces/IIrm.sol";

contract MockIrm is IIrm {
    function borrowRate(Market memory market) external pure returns (uint256) {
        uint256 optimalUtilization = 80;
        if (market.totalSupplyAssets == 0) return 0;
        if (100 * (market.totalBorrowAssets / market.totalSupplyAssets) > optimalUtilization) {
            return 80e16;
        } else {
            return 20e16;
        }
    }
}
