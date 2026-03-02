//SPDX-License-Identifier: MIT

pragma solidity ^0.8.18;

import {Script} from "forge-std/Script.sol";
import {Syphon} from "../src/Syphon.sol";
import {MockIrm} from "../src/mocks/MockIrm.sol";
import {MockOracle} from "../src/mocks/MockOracle.sol";
import {ERC20Mock} from "@openzeppelin/contracts/mocks/token/ERC20Mock.sol";

contract DeploySyphon is Script {
    ERC20Mock collateralToken;
    ERC20Mock loanToken;
    Syphon syphon;
    MockIrm mockIrm;
    MockOracle mockOracle;

    function run() public returns (Syphon, MockIrm, MockOracle, ERC20Mock, ERC20Mock) {
        syphon = new Syphon(msg.sender);
        mockIrm = new MockIrm();
        mockOracle = new MockOracle(1e18);
        collateralToken = new ERC20Mock();
        loanToken = new ERC20Mock();

        return (syphon, mockIrm, mockOracle, collateralToken, loanToken);
    }
}
