//SPDX-License-Identifier: MIT

pragma solidity ^0.8.18;

import {Script} from "forge-std/Script.sol";
import {Syphon} from "../src/Syphon.sol";
import {MockIrm} from "../src/mocks/MockIrm.sol";
import {MockOracle} from "../src/mocks/MockOracle.sol";
import {ERC20Mock} from "@openzeppelin/contracts/mocks/token/ERC20Mock.sol";
import {MarketParams} from "../src/interfaces/ISyphon.sol";

contract DeploySyphon is Script {
    ERC20Mock cbBTC;
    ERC20Mock usdc;
    ERC20Mock sUSDS;
    ERC20Mock usdt;
    ERC20Mock sUSDe;
    ERC20Mock pyusd;
    ERC20Mock wBTC;
    ERC20Mock wstETH;
    Syphon syphon;
    MockIrm mockIrm;
    MockOracle market1mockOracle;
    MockOracle market2mockOracle;
    MockOracle market3mockOracle;
    MockOracle market4mockOracle;
    MockOracle market5mockOracle;

    function run()
        public
        returns (Syphon, ERC20Mock, ERC20Mock, ERC20Mock, ERC20Mock, ERC20Mock, ERC20Mock, ERC20Mock, ERC20Mock)
    {
        vm.startBroadcast();
        syphon = new Syphon(msg.sender);
        mockIrm = new MockIrm();
        market1mockOracle = new MockOracle(69426e18);
        market2mockOracle = new MockOracle(108e16);
        market3mockOracle = new MockOracle(122e16);
        market4mockOracle = new MockOracle(69265e18);
        market5mockOracle = new MockOracle(2469e18);

        cbBTC = new ERC20Mock();
        usdc = new ERC20Mock();
        sUSDS = new ERC20Mock();
        usdt = new ERC20Mock();
        sUSDe = new ERC20Mock();
        pyusd = new ERC20Mock();
        wBTC = new ERC20Mock();
        wstETH = new ERC20Mock();

        //market IDs

        bytes32 market1Id = syphon.createId(
            MarketParams(address(cbBTC), address(usdc), address(market1mockOracle), address(mockIrm), 860e15)
        );

        bytes32 market2Id = syphon.createId(
            MarketParams(address(sUSDS), address(usdt), address(market2mockOracle), address(mockIrm), 833e15)
        );
        bytes32 market3Id = syphon.createId(
            MarketParams(address(sUSDe), address(pyusd), address(market3mockOracle), address(mockIrm), 899e15)
        );
        bytes32 market4Id = syphon.createId(
            MarketParams(address(wBTC), address(usdc), address(market4mockOracle), address(mockIrm), 940e15)
        );

        bytes32 market5Id = syphon.createId(
            MarketParams(address(wstETH), address(usdc), address(market5mockOracle), address(mockIrm), 860e15)
        );

        //markets

        syphon.createMarket(
            MarketParams(address(cbBTC), address(usdc), address(market1mockOracle), address(mockIrm), 860e15), market1Id
        );
        syphon.createMarket(
            MarketParams(address(sUSDS), address(usdt), address(market2mockOracle), address(mockIrm), 833e15), market2Id
        );
        syphon.createMarket(
            MarketParams(address(sUSDe), address(pyusd), address(market3mockOracle), address(mockIrm), 899e15),
            market3Id
        );
        syphon.createMarket(
            MarketParams(address(wBTC), address(usdc), address(market4mockOracle), address(mockIrm), 940e15), market4Id
        );
        syphon.createMarket(
            MarketParams(address(wstETH), address(usdc), address(market5mockOracle), address(mockIrm), 860e15),
            market5Id
        );

        vm.stopBroadcast();

        return (syphon, cbBTC, usdc, sUSDS, usdt, sUSDe, pyusd, wBTC, wstETH);
    }
}
