//SPDX-License-identifier: MIT

pragma solidity ^0.8.18;

import {Market} from "../interfaces/ISyphon.sol";

interface IIrm {
    function borrowRate(Market memory market) external returns (uint256);
}
