// SPDX-License-Identifeir: MIT

pragma solidity ^0.8.18;

import {Test, console} from "forge-std/Test.sol";
import {MockIrm} from "../../src/mocks/MockIrm.sol";
import {Market} from "../../src/interfaces/ISyphon.sol";

contract MockIrmTest is Test {
    MockIrm mockIrm;

    function setUp() public {
        mockIrm = new MockIrm();
    }

    function testBorrowRateWhenNoSupplyAssets() public {
        uint256 borrowRate = mockIrm.borrowRate(Market(0, 1, 1, 1, 1, 1));
        console.log("borrow rate:", borrowRate);
        assertEq(borrowRate, 80e16);
    }

    function testBorowRateWhenNoBorrowAssets() public {
        uint256 borrowRate = mockIrm.borrowRate(Market(1, 1, 0, 1, 1, 1));
        console.log("borrow rate:", borrowRate);
        assertEq(borrowRate, 0);
    }

    function testBorowRateWhenHighUtilization() public {
        uint256 borrowRate = mockIrm.borrowRate(Market(1, 1, 1, 1, 1, 1));
        console.log("borrow rate:", borrowRate);
        assertEq(borrowRate, 80e16);
    }
}
