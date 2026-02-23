//SPDX-License-Identifier: MIT

pragma solidity ^0.8.18;

import {Test, console} from "forge-std/Test.sol";
import {Syphon, MarketParams, Market, Position} from "../../src/Syphon.sol";
import {MockIrm} from "../../src/mocks/MockIrm.sol";
import {MockOracle} from "../../src/mocks/MockOracle.sol";
import {ERC20Mock} from "@openzeppelin/contracts/mocks/token/ERC20Mock.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract SyphonTest is Test {
    MarketParams marketParams;

    Syphon syphon;
    MockIrm irm;
    MockOracle oracle;
    ERC20Mock loanToken;
    ERC20Mock collateralToken;
    uint256 lltv;
    address OWNER = makeAddr("owner");
    address USER = makeAddr("user");
    address USER2 = makeAddr("user2");

    function setUp() public {
        vm.startPrank(OWNER);
        syphon = new Syphon(OWNER);
        irm = new MockIrm();
        oracle = new MockOracle(1800);
        collateralToken = new ERC20Mock();
        loanToken = new ERC20Mock();
        marketParams = MarketParams({
            collateralToken: address(collateralToken),
            loanToken: address(loanToken),
            oracle: address(oracle),
            irm: address(irm),
            lltv: 916e15
        });
        collateralToken.mint(USER, 100 ether);
        collateralToken.mint(USER2, 100 ether);
        loanToken.mint(USER, 100 ether);
        vm.stopPrank();
    }

    function testCreateMarket() public {
        //acquire
        uint256 initialMarkets = syphon.getMarkets().length;
        console.log("initial markets:", initialMarkets);
        //act
        bytes32 id = syphon.createId(marketParams);
        syphon.createMarket(marketParams, id);
        //assert
        uint256 markets = syphon.getMarkets().length;
        console.log("markets:", markets);
    }

    function testLiquidityProviderCanSupply() public {
        //accquire
        bytes32 id = syphon.createId(marketParams);
        Market memory beforeMarket = syphon.getMarketInfo(id);
        Position memory beforePositions = syphon.getUserPosition(id, USER);
        console.log("user positon before:", beforePositions.supplyShares);
        console.log("before supply:", beforeMarket.totalSupplyAssets);
        //act
        vm.startPrank(USER);
        IERC20(collateralToken).approve(address(syphon), 20 ether);
        syphon.supply(marketParams, id, address(collateralToken), 20 ether);
        vm.stopPrank();
        //assert
        Market memory afterMarket = syphon.getMarketInfo(id);
        Position memory afterPositions = syphon.getUserPosition(id, USER);
        console.log("user positon after:", afterPositions.supplyShares);
        console.log("after supply:", afterMarket.totalSupplyAssets);
        console.log("position created at:", afterPositions.lastUpdatedAt);
        assertEq(afterMarket.totalSupplyAssets, beforeMarket.totalSupplyAssets + 20 ether);
        assertEq(afterPositions.supplyShares, beforePositions.supplyShares + 20 ether);
    }

    function testCalculateInterset() public {
        bytes32 id = syphon.createId(marketParams);
        vm.startPrank(USER);
        IERC20(collateralToken).approve(address(syphon), 20e18);
        syphon.supply(marketParams, id, address(collateralToken), 20e18);
        vm.stopPrank();
        vm.warp(block.timestamp + 1);
        vm.roll(block.number + 1);
        uint256 interest = syphon.calculateInterest(marketParams, id, USER);
        console.log("interest:", interest);
        Position memory afterPositions = syphon.getUserPosition(id, USER);
        console.log("user positon after:", afterPositions.supplyShares);
        console.log("last updated at:", afterPositions.lastUpdatedAt);
    }

    function testLiquidityProvidersCanWithdrawFunds() public {
        //accquire
        bytes32 id = syphon.createId(marketParams);
        Market memory beforeMarket = syphon.getMarketInfo(id);
        Position memory beforePositions = syphon.getUserPosition(id, USER);
        console.log("user positon before:", beforePositions.supplyShares);
        console.log("before supply:", beforeMarket.totalSupplyAssets);
        //act
        vm.startPrank(USER);
        IERC20(collateralToken).approve(address(syphon), 20 ether);
        syphon.supply(marketParams, id, address(collateralToken), 20 ether);
        vm.stopPrank();
        //assert
        Market memory afterMarket = syphon.getMarketInfo(id);
        Position memory afterPositions = syphon.getUserPosition(id, USER);
        console.log("user positon after:", afterPositions.supplyShares);
        console.log("after supply:", afterMarket.totalSupplyAssets);
        console.log("supply time:", afterPositions.lastUpdatedAt);
        assertEq(afterMarket.totalSupplyAssets, beforeMarket.totalSupplyAssets + 20 ether);
        assertEq(afterPositions.supplyShares, beforePositions.supplyShares + 20 ether);

        vm.startPrank(USER);
        syphon.withdraw(marketParams, id, address(collateralToken), 20 ether);
        vm.stopPrank();
        Market memory withdrawMarket = syphon.getMarketInfo(id);
        Position memory withdrawPositions = syphon.getUserPosition(id, USER);
        console.log("user positon after withdraw:", withdrawPositions.supplyShares);
        console.log("after withdraw supply:", withdrawMarket.totalSupplyAssets);
        console.log("withdraw time:", withdrawPositions.lastUpdatedAt);
        assertEq(IERC20(collateralToken).balanceOf(USER), 100 ether);
    }

    function testLiquidityProvidersCanWithdrawFundsWithInterest() public {
        //accquire
        bytes32 id = syphon.createId(marketParams);
        Market memory beforeMarket = syphon.getMarketInfo(id);
        Position memory beforePositions = syphon.getUserPosition(id, USER);
        console.log("user positon before:", beforePositions.supplyShares);
        console.log("before supply:", beforeMarket.totalSupplyAssets);
        //act
        vm.startPrank(USER);
        IERC20(collateralToken).approve(address(syphon), 20 ether);
        syphon.supply(marketParams, id, address(collateralToken), 20 ether);
        vm.stopPrank();
        //assert
        Market memory afterMarket = syphon.getMarketInfo(id);
        Position memory afterPositions = syphon.getUserPosition(id, USER);
        console.log("user positon after:", afterPositions.supplyShares);
        console.log("after supply:", afterMarket.totalSupplyAssets);
        console.log("supply time:", afterPositions.lastUpdatedAt);
        assertEq(afterMarket.totalSupplyAssets, beforeMarket.totalSupplyAssets + 20 ether);
        assertEq(afterPositions.supplyShares, beforePositions.supplyShares + 20 ether);

        vm.startPrank(USER2);
        IERC20(collateralToken).approve(address(syphon), 20 ether);
        syphon.supply(marketParams, id, address(collateralToken), 20 ether);
        vm.stopPrank();

        vm.warp(block.timestamp + 1);
        vm.roll(block.number + 1);

        vm.startPrank(USER);
        syphon.withdraw(marketParams, id, address(collateralToken), 20 ether);
        vm.stopPrank();
        Market memory withdrawMarket = syphon.getMarketInfo(id);
        Position memory withdrawPositions = syphon.getUserPosition(id, USER);
        console.log("user positon after withdraw:", withdrawPositions.supplyShares);
        console.log("after withdraw supply:", withdrawMarket.totalSupplyAssets);
        console.log("withdraw time:", withdrawPositions.lastUpdatedAt);
        assert(IERC20(collateralToken).balanceOf(USER) > 100 ether);
    }
}
