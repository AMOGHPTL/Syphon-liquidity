//SPDX-License-Identifier: MIT

pragma solidity ^0.8.18;

import {Script} from "forge-std/Script.sol";
import {Syphon} from "../src/Syphon.sol";
import {MockIrm} from "../src/mocks/MockIrm.sol";
import {MockOracle} from "../src/mocks/MockOracle.sol";
import {ERC20Mock} from "@openzeppelin/contracts/mocks/token/ERC20Mock.sol";
import {MarketParams} from "../src/interfaces/ISyphon.sol";

contract DeploySyphon is Script {
    ERC20Mock usdt;
    ERC20Mock usdc;
    ERC20Mock dai;
    ERC20Mock usde;
    ERC20Mock tusd;
    ERC20Mock rlusd;
    ERC20Mock usdcrv;
    ERC20Mock pyusd;
    Syphon syphon;
    MockIrm mockIrm;
    MockOracle mockOracle;

    function run()
        public
        returns (
            Syphon,
            MockIrm,
            MockOracle,
            ERC20Mock,
            ERC20Mock,
            ERC20Mock,
            ERC20Mock,
            ERC20Mock,
            ERC20Mock,
            ERC20Mock,
            ERC20Mock
        )
    {
        vm.startBroadcast();
        syphon = new Syphon(msg.sender);
        mockIrm = new MockIrm();
        mockOracle = new MockOracle(1e18);
        usdt = new ERC20Mock();
        usdc = new ERC20Mock();
        dai = new ERC20Mock();
        usde = new ERC20Mock();
        tusd = new ERC20Mock();
        rlusd = new ERC20Mock();
        usdcrv = new ERC20Mock();
        pyusd = new ERC20Mock();
        bytes32 market1Id =
            syphon.createId(MarketParams(address(usdt), address(usdc), address(mockOracle), address(mockIrm), 916e15));

        bytes32 market2Id =
            syphon.createId(MarketParams(address(dai), address(usde), address(mockOracle), address(mockIrm), 916e15));
        bytes32 market3Id =
            syphon.createId(MarketParams(address(tusd), address(rlusd), address(mockOracle), address(mockIrm), 916e15));
        bytes32 market4Id = syphon.createId(
            MarketParams(address(usdcrv), address(pyusd), address(mockOracle), address(mockIrm), 916e15)
        );

        syphon.createMarket(
            MarketParams(address(usdt), address(usdc), address(mockOracle), address(mockIrm), 916e15), market1Id
        );
        syphon.createMarket(
            MarketParams(address(dai), address(usde), address(mockOracle), address(mockIrm), 916e15), market2Id
        );
        syphon.createMarket(
            MarketParams(address(tusd), address(rlusd), address(mockOracle), address(mockIrm), 916e15), market3Id
        );
        syphon.createMarket(
            MarketParams(address(usdcrv), address(pyusd), address(mockOracle), address(mockIrm), 916e15), market4Id
        );

        vm.stopBroadcast();

        return (syphon, mockIrm, mockOracle, usdt, usdc, dai, usde, tusd, rlusd, usdcrv, pyusd);
    }
}
