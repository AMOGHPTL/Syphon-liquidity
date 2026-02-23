//SPDX-License-Identifier: MIT

pragma solidity ^0.8.18;

import {IOracle} from "../interfaces/IOracle.sol";

contract MockOracle is IOracle {
    uint256 mockPrice;
    address owner;

    constructor(uint256 initialPrice) {
        owner = msg.sender;
        mockPrice = initialPrice;
    }

    function price() external view returns (uint256) {
        return mockPrice;
    }

    function setPrice(uint256 newPrice) public returns (uint256) {
        mockPrice = newPrice;
        return mockPrice;
    }
}
