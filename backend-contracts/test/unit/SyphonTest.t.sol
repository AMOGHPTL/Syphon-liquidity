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
    uint256 constant PRECISION_MARKET_SUPPLY = 10 ether;

    function setUp() public {
        vm.startPrank(OWNER);
        syphon = new Syphon(OWNER);
        irm = new MockIrm();
        oracle = new MockOracle(1e18);
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
        loanToken.mint(USER2, 100 ether);
        loanToken.mint(USER, 100 ether);
        vm.stopPrank();
    }

    modifier createdMarket() {
        bytes32 id = syphon.createId(marketParams);
        syphon.createMarket(marketParams, id);
        _;
    }

    /******************** Create Market tests ******************/

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

    function testUserCantCreateMarketWhichAlredyExist() public createdMarket {
        bytes32 id = syphon.createId(marketParams);
        vm.expectRevert();
        syphon.createMarket(marketParams, id);
    }

    function testUserCantCreateMarketWithInvalidMarketParams() public {
        bytes32 id = syphon.createId(marketParams);
        vm.expectRevert();
        syphon.createMarket(MarketParams(address(1), address(1), address(1), address(0), 90), id);
    }

    /***************** Supply tests **************/

    function testLiquidityProviderCanSupply() public createdMarket {
        //accquire
        bytes32 id = syphon.createId(marketParams);
        Market memory beforeMarket = syphon.getMarketInfo(id);
        Position memory beforePositions = syphon.getUserPosition(id, USER);
        console.log("user shares before:", beforePositions.supplyShares);
        console.log("before supply market assests:", beforeMarket.totalSupplyAssets);
        //act
        vm.startPrank(USER);
        IERC20(loanToken).approve(address(syphon), 20 ether);
        syphon.supply(marketParams, id, 20 ether);
        vm.stopPrank();
        //assert
        Market memory afterMarket = syphon.getMarketInfo(id);
        Position memory afterPositions = syphon.getUserPosition(id, USER);
        console.log("user shares after:", afterPositions.supplyShares);
        console.log("after supply market assets:", afterMarket.totalSupplyAssets);
        console.log("total market shares:", afterMarket.totalSupplyShares);
        assertEq(afterMarket.totalSupplyAssets, beforeMarket.totalSupplyAssets + 20 ether);
        assert(afterPositions.supplyShares > beforePositions.supplyShares);
    }

    function testSupplyingMoreIncreasesUserSupplyShare() public createdMarket {
        //accquire
        bytes32 id = syphon.createId(marketParams);
        Market memory beforeMarket = syphon.getMarketInfo(id);
        Position memory beforePositions = syphon.getUserPosition(id, USER);
        console.log("user shares before:", beforePositions.supplyShares);
        console.log("before supply market assests:", beforeMarket.totalSupplyAssets);
        //act
        vm.startPrank(USER);
        IERC20(loanToken).approve(address(syphon), 20 ether);
        syphon.supply(marketParams, id, 20 ether);
        vm.stopPrank();
        //assert
        Market memory afterMarket = syphon.getMarketInfo(id);
        Position memory afterPositions = syphon.getUserPosition(id, USER);
        console.log("user shares after:", afterPositions.supplyShares);
        console.log("after supply market assets:", afterMarket.totalSupplyAssets);
        console.log("total market shares:", afterMarket.totalSupplyShares);
        assert(afterPositions.supplyShares > beforePositions.supplyShares);

        vm.startPrank(USER);
        IERC20(loanToken).approve(address(syphon), 20 ether);
        syphon.supply(marketParams, id, 20 ether);
        vm.stopPrank();

        Market memory afterMarket2 = syphon.getMarketInfo(id);
        Position memory afterPositions2 = syphon.getUserPosition(id, USER);
        console.log("user shares after 2:", afterPositions2.supplyShares);
        console.log("after supply market assets 2:", afterMarket2.totalSupplyAssets);
        console.log("total market shares 2:", afterMarket2.totalSupplyShares);
        assert(afterPositions2.supplyShares > beforePositions.supplyShares);
    }

    function testMultipleUsersCanSupply() public createdMarket {
        //accquire
        bytes32 id = syphon.createId(marketParams);
        Market memory beforeMarket = syphon.getMarketInfo(id);
        Position memory beforePositions = syphon.getUserPosition(id, USER);
        console.log("user shares before:", beforePositions.supplyShares);
        console.log("before supply market assests:", beforeMarket.totalSupplyAssets);
        //act
        vm.startPrank(USER);
        IERC20(loanToken).approve(address(syphon), 20 ether);
        syphon.supply(marketParams, id, 20 ether);
        vm.stopPrank();
        vm.startPrank(USER2);
        IERC20(loanToken).approve(address(syphon), 20 ether);
        syphon.supply(marketParams, id, 20 ether);
        vm.stopPrank();
        //assert
        Market memory afterMarket = syphon.getMarketInfo(id);
        Position memory afterPositions = syphon.getUserPosition(id, USER);
        console.log("user shares after:", afterPositions.supplyShares);
        console.log("after supply market assets:", afterMarket.totalSupplyAssets);
        console.log("total market shares:", afterMarket.totalSupplyShares);
        assert(afterPositions.supplyShares > beforePositions.supplyShares);
    }

    function testLiquiditySupplyCantBeZero() public createdMarket {
        bytes32 id = syphon.createId(marketParams);
        vm.startPrank(USER);
        IERC20(loanToken).approve(address(syphon), 20 ether);
        vm.expectRevert();
        syphon.supply(marketParams, id, 0 ether);
        vm.stopPrank();
    }

    /*************** Withdraw funds *************** */

    function testLiquidityProvidersCanWithdrawFunds() public createdMarket {
        //accquire
        bytes32 id = syphon.createId(marketParams);
        Market memory beforeMarket = syphon.getMarketInfo(id);
        Position memory beforePositions = syphon.getUserPosition(id, USER);
        console.log("user positon before:", beforePositions.supplyShares);
        console.log("before supply:", beforeMarket.totalSupplyAssets);
        //act
        vm.startPrank(USER);
        IERC20(loanToken).approve(address(syphon), 20 ether);
        syphon.supply(marketParams, id, 20 ether);
        vm.stopPrank();
        //assert
        Market memory afterMarket = syphon.getMarketInfo(id);
        Position memory afterPositions = syphon.getUserPosition(id, USER);
        console.log("user positon after:", afterPositions.supplyShares);
        console.log("after supply:", afterMarket.totalSupplyAssets);
        assertEq(afterPositions.supplyShares, afterMarket.totalSupplyShares);

        vm.startPrank(USER);
        syphon.withdraw(marketParams, id, 10 ether, 0);
        vm.stopPrank();
        Market memory withdrawMarket = syphon.getMarketInfo(id);
        Position memory withdrawPositions = syphon.getUserPosition(id, USER);
        console.log("user shares after withdraw:", withdrawPositions.supplyShares);
        console.log("after withdraw market supply assets:", withdrawMarket.totalSupplyAssets);
        console.log("after withdraw market supply shares:", withdrawMarket.totalSupplyShares);

        assert(IERC20(loanToken).balanceOf(USER) >= 10 ether);
    }

    function testUserCanWithDrawUsingSharesInput() public createdMarket {
        //accquire
        bytes32 id = syphon.createId(marketParams);
        Market memory beforeMarket = syphon.getMarketInfo(id);
        Position memory beforePositions = syphon.getUserPosition(id, USER);
        console.log("user positon before:", beforePositions.supplyShares);
        console.log("before supply:", beforeMarket.totalSupplyAssets);
        //act
        vm.startPrank(USER);
        IERC20(loanToken).approve(address(syphon), 20 ether);
        syphon.supply(marketParams, id, 20 ether);
        vm.stopPrank();
        //assert
        Market memory afterMarket = syphon.getMarketInfo(id);
        Position memory afterPositions = syphon.getUserPosition(id, USER);
        console.log("user positon after:", afterPositions.supplyShares);
        console.log("after supply:", afterMarket.totalSupplyAssets);
        assertEq(afterPositions.supplyShares, afterMarket.totalSupplyShares);

        vm.startPrank(USER);
        syphon.withdraw(marketParams, id, 0, 1e18);
        vm.stopPrank();
        Market memory withdrawMarket = syphon.getMarketInfo(id);
        Position memory withdrawPositions = syphon.getUserPosition(id, USER);
        console.log("user shares after withdraw:", withdrawPositions.supplyShares);
        console.log("after withdraw market supply assets:", withdrawMarket.totalSupplyAssets);
        console.log("after withdraw market supply shares:", withdrawMarket.totalSupplyShares);

        assert(IERC20(loanToken).balanceOf(USER) >= 10 ether);
    }

    function testUserCantWithdrawWithInvalidWithdrawParams() public createdMarket {
        bytes32 id = syphon.createId(marketParams);
        vm.startPrank(USER);
        IERC20(loanToken).approve(address(syphon), 20 ether);
        syphon.supply(marketParams, id, 20 ether);
        vm.stopPrank();
        vm.startPrank(USER);
        vm.expectRevert();
        syphon.withdraw(marketParams, id, 0, 0);
        vm.stopPrank();
    }

    function testLiquidityProvidersCanWithdrawFundsWithMultipleLiquidityProviders() public createdMarket {
        //accquire
        console.log("user1 initial balance:", IERC20(loanToken).balanceOf(USER));
        bytes32 id = syphon.createId(marketParams);
        Market memory beforeMarket = syphon.getMarketInfo(id);
        Position memory beforePositions = syphon.getUserPosition(id, USER);
        console.log("user positon before:", beforePositions.supplyShares);
        console.log("before supply:", beforeMarket.totalSupplyAssets);
        //act
        vm.startPrank(USER);
        IERC20(loanToken).approve(address(syphon), 20 ether);
        syphon.supply(marketParams, id, 20 ether);
        vm.stopPrank();
        vm.startPrank(USER2);
        IERC20(loanToken).approve(address(syphon), 10 ether);
        syphon.supply(marketParams, id, 10 ether);
        vm.stopPrank();
        vm.startPrank(USER);
        IERC20(loanToken).approve(address(syphon), 20 ether);
        syphon.supply(marketParams, id, 20 ether);
        vm.stopPrank();
        //assert
        console.log("user1 balance after 2 deposits:", IERC20(loanToken).balanceOf(USER));
        Market memory afterMarket = syphon.getMarketInfo(id);
        Position memory afterPositions = syphon.getUserPosition(id, USER);
        Position memory afterPositions2 = syphon.getUserPosition(id, USER2);
        console.log("user1 shares after:", afterPositions.supplyShares);
        console.log("user2 shares after:", afterPositions2.supplyShares);
        console.log("after supply assets:", afterMarket.totalSupplyAssets);
        console.log("after supply shares", afterMarket.totalSupplyShares);

        vm.warp(block.timestamp + 1);
        vm.startPrank(USER);
        syphon.withdraw(marketParams, id, 0, 1e18);
        vm.stopPrank();
        Market memory withdrawMarket = syphon.getMarketInfo(id);
        Position memory withdrawPositions = syphon.getUserPosition(id, USER);
        console.log("user shares after withdraw:", withdrawPositions.supplyShares);
        console.log("after withdraw market supply assets:", withdrawMarket.totalSupplyAssets);
        console.log("after withdraw market supply shares:", withdrawMarket.totalSupplyShares);
        console.log("user1 balance after withdraw:", IERC20(loanToken).balanceOf(USER));
    }

    function testUserCantWithdrawMoreThanTheirSupply() public createdMarket {
        bytes32 id = syphon.createId(marketParams);
        vm.startPrank(USER);
        IERC20(loanToken).approve(address(syphon), 20 ether);
        syphon.supply(marketParams, id, 20 ether);
        vm.stopPrank();
        vm.startPrank(USER);
        vm.expectRevert(Syphon.Syphon__InsufficientShares.selector);
        syphon.withdraw(marketParams, id, 30 ether, 0);
        vm.stopPrank();
    }

    /******************* Supply collateral tests ******************/

    function testBorrowerCanSupplyCollateral() public createdMarket {
        //accquire
        bytes32 id = syphon.createId(marketParams);
        Position memory usersinitialPosition = syphon.getUserPosition(id, USER);
        console.log("user inital collateral:", usersinitialPosition.collateral);
        //Act
        vm.startPrank(USER);
        IERC20(collateralToken).approve(address(syphon), 20 ether);
        syphon.supplyCollateral(marketParams, id, 20 ether);
        vm.stopPrank();
        //assert
        Position memory usersPositionAfterCollateralSupply = syphon.getUserPosition(id, USER);
        console.log("user collateral after collateral supply:", usersPositionAfterCollateralSupply.collateral);
        assertEq(usersinitialPosition.collateral + 20 ether, usersPositionAfterCollateralSupply.collateral);
    }

    /******* Withdraw with no borrows *******/

    function testBorrowerCanWithdrawCollateralWhenNoBorrows() public createdMarket {
        //accquire
        bytes32 id = syphon.createId(marketParams);
        Position memory usersinitialPosition = syphon.getUserPosition(id, USER);
        console.log("user inital collateral:", usersinitialPosition.collateral);
        //Act
        vm.startPrank(USER);
        IERC20(collateralToken).approve(address(syphon), 20 ether);
        syphon.supplyCollateral(marketParams, id, 20 ether);
        vm.stopPrank();
        Position memory usersPositionAfterCollateralSupply = syphon.getUserPosition(id, USER);
        console.log("user collateral after collateral supply:", usersPositionAfterCollateralSupply.collateral);
        vm.startPrank(USER);
        syphon.withdrawCollateral(marketParams, id, 20 ether);
        vm.stopPrank();
        Position memory usersPositionAfterCollateralWithdraw = syphon.getUserPosition(id, USER);
        console.log("user collateral after collateral Withdraw:", usersPositionAfterCollateralWithdraw.collateral);
        //assert
        assertEq(usersinitialPosition.collateral, usersPositionAfterCollateralWithdraw.collateral);
    }

    /********************** Borrow tests **********************/

    function testBorrowersCanBorrow() public createdMarket {
        bytes32 id = syphon.createId(marketParams);
        vm.startPrank(USER);
        IERC20(loanToken).approve(address(syphon), 20 ether);
        syphon.supply(marketParams, id, 20 ether);
        vm.stopPrank();
        vm.startPrank(USER);
        IERC20(collateralToken).approve(address(syphon), 20 ether);
        syphon.supplyCollateral(marketParams, id, 20 ether);
        syphon.borrow(marketParams, id, 10 ether);
        vm.stopPrank();
        Position memory position = syphon.getUserPosition(id, USER);
        Market memory market = syphon.getMarketInfo(id);
        console.log("user supply shares:", position.supplyShares);
        console.log("user borrow shares:", position.borrowShares);
        console.log("user collateral:", position.collateral);
        console.log("market supply assets:", market.totalSupplyAssets);
        console.log("market supply shares:", market.totalSupplyShares);
        console.log("market borrow assets:", market.totalBorrowAssets);
        console.log("market borrow shares:", market.totalBorrowShares);
    }

    function testBorrowsCantBorrowWithoutCollateral() public createdMarket {
        bytes32 id = syphon.createId(marketParams);
        vm.startPrank(USER);
        IERC20(loanToken).approve(address(syphon), 20 ether);
        syphon.supply(marketParams, id, 20 ether);
        vm.stopPrank();
        vm.startPrank(USER);
        IERC20(collateralToken).approve(address(syphon), 20 ether);
        vm.expectRevert(Syphon.Syphon__UnderCollateralized.selector);
        syphon.borrow(marketParams, id, 10 ether);
        vm.stopPrank();
    }

    function testBorrowsCantHappenWhenThereIsNoOrLessLoanTokenSupply() public createdMarket {
        bytes32 id = syphon.createId(marketParams);
        vm.startPrank(USER);
        IERC20(collateralToken).approve(address(syphon), 20 ether);
        syphon.supplyCollateral(marketParams, id, 20 ether);
        vm.expectRevert(Syphon.Syphon__InsufficientLoanSupply.selector);
        syphon.borrow(marketParams, id, 10 ether);
        vm.stopPrank();
    }

    /****************** Repay tests ******************/

    function testBorrowersCanRepayLoan() public createdMarket {
        bytes32 id = syphon.createId(marketParams);
        vm.startPrank(USER);
        IERC20(loanToken).approve(address(syphon), 20 ether);
        syphon.supply(marketParams, id, 20 ether);
        vm.stopPrank();
        vm.startPrank(USER);
        IERC20(collateralToken).approve(address(syphon), 20 ether);
        syphon.supplyCollateral(marketParams, id, 20 ether);
        syphon.borrow(marketParams, id, 10 ether);
        vm.stopPrank();
        vm.startPrank(USER2);
        IERC20(collateralToken).approve(address(syphon), 20 ether);
        syphon.supplyCollateral(marketParams, id, 20 ether);
        syphon.borrow(marketParams, id, 10 ether);
        vm.stopPrank();
        vm.startPrank(USER);
        IERC20(marketParams.loanToken).approve(address(syphon), 5 ether);
        syphon.repay(marketParams, id, 2 ether, 0);
        vm.stopPrank();
        Position memory position = syphon.getUserPosition(id, USER);
        Market memory market = syphon.getMarketInfo(id);
        console.log("user borrow shares:", position.borrowShares);
        console.log("market borrow assets:", market.totalBorrowAssets);
        console.log("market borrow shares:", market.totalBorrowShares);
    }

    function testBorrowersRepayWithInterest() public createdMarket {
        bytes32 id = syphon.createId(marketParams);
        vm.startPrank(USER);
        IERC20(loanToken).approve(address(syphon), 80 ether);
        syphon.supply(marketParams, id, 80 ether);
        vm.stopPrank();
        vm.startPrank(USER);
        IERC20(collateralToken).approve(address(syphon), 20 ether);
        syphon.supplyCollateral(marketParams, id, 20 ether);
        syphon.borrow(marketParams, id, 10 ether);
        vm.stopPrank();
        vm.startPrank(USER2);
        IERC20(collateralToken).approve(address(syphon), 20 ether);
        syphon.supplyCollateral(marketParams, id, 20 ether);
        syphon.borrow(marketParams, id, 10 ether);
        vm.stopPrank();
        vm.warp(block.timestamp + 365 days);
        vm.startPrank(USER);
        IERC20(marketParams.loanToken).approve(address(syphon), 5 ether);
        syphon.repay(marketParams, id, 2 ether, 0);
        vm.stopPrank();
        Position memory position = syphon.getUserPosition(id, USER);
        Market memory market = syphon.getMarketInfo(id);
        console.log("user borrow shares:", position.borrowShares);
        console.log("market borrow assets:", market.totalBorrowAssets);
        console.log("market borrow shares:", market.totalBorrowShares);
    }

    function testInvalidRepayAmount() public createdMarket {
        bytes32 id = syphon.createId(marketParams);
        vm.startPrank(USER);
        IERC20(loanToken).approve(address(syphon), 20 ether);
        syphon.supply(marketParams, id, 20 ether);
        vm.stopPrank();
        vm.startPrank(USER);
        IERC20(collateralToken).approve(address(syphon), 20 ether);
        syphon.supplyCollateral(marketParams, id, 20 ether);
        syphon.borrow(marketParams, id, 10 ether);
        vm.stopPrank();
        vm.startPrank(USER);
        IERC20(marketParams.loanToken).approve(address(syphon), 5 ether);
        vm.expectRevert(Syphon.Syphon__InvalidRepayAmount.selector);
        syphon.repay(marketParams, id, 0 ether, 0);
        vm.stopPrank();
    }

    function testAmbiguousRepayInput() public createdMarket {
        bytes32 id = syphon.createId(marketParams);
        vm.startPrank(USER);
        IERC20(loanToken).approve(address(syphon), 20 ether);
        syphon.supply(marketParams, id, 20 ether);
        vm.stopPrank();
        vm.startPrank(USER);
        IERC20(collateralToken).approve(address(syphon), 20 ether);
        syphon.supplyCollateral(marketParams, id, 20 ether);
        syphon.borrow(marketParams, id, 10 ether);
        vm.stopPrank();
        vm.startPrank(USER);
        IERC20(marketParams.loanToken).approve(address(syphon), 5 ether);
        vm.expectRevert(Syphon.Syphon__AmbiguousRepayInput.selector);
        syphon.repay(marketParams, id, 1 ether, 1);
        vm.stopPrank();
    }

    /********************* Liquidation tests ***************************/

    function testCannotLiquidateHealthyUser() public createdMarket {
        bytes32 id = syphon.createId(marketParams);
        vm.startPrank(USER);
        IERC20(loanToken).approve(address(syphon), 20 ether);
        syphon.supply(marketParams, id, 20 ether);
        vm.stopPrank();
        vm.startPrank(USER);
        IERC20(collateralToken).approve(address(syphon), 24 ether);
        syphon.supplyCollateral(marketParams, id, 24 ether);
        syphon.borrow(marketParams, id, 20 ether);
        vm.stopPrank();
        uint256 userHealthFactor = syphon._healthFactor(marketParams, id, USER);
        console.log("user health factor:", userHealthFactor);
        vm.startPrank(USER2);
        IERC20(marketParams.loanToken).approve(address(syphon), 20 ether);
        vm.expectRevert();
        syphon.liquidate(marketParams, id, USER);
        vm.stopPrank();
    }

    function testBadUserCanBeLiquidated() public createdMarket {
        bytes32 id = syphon.createId(marketParams);
        vm.startPrank(USER);
        IERC20(loanToken).approve(address(syphon), 20 ether);
        syphon.supply(marketParams, id, 20 ether);
        vm.stopPrank();
        vm.startPrank(USER);
        IERC20(collateralToken).approve(address(syphon), 24 ether);
        syphon.supplyCollateral(marketParams, id, 24 ether);
        syphon.borrow(marketParams, id, 20 ether);
        vm.stopPrank();
        uint256 userHealthFactorBeforeSetPrice = syphon._healthFactor(marketParams, id, USER);
        console.log("user health factor before set:", userHealthFactorBeforeSetPrice);
        vm.startPrank(USER2);
        MockOracle(marketParams.oracle).setPrice(2e18);
        vm.stopPrank();
        uint256 userHealthFactorAfterSetPrice = syphon._healthFactor(marketParams, id, USER);
        console.log("user health factor after set:", userHealthFactorAfterSetPrice);

        vm.startPrank(USER2);
        IERC20(marketParams.loanToken).approve(address(syphon), 20 ether);
        syphon.liquidate(marketParams, id, USER);
        vm.stopPrank();
        Position memory positonAfterLiquidating = syphon.getUserPosition(id, USER);
        Market memory marketAfterLiquidation = syphon.getMarketInfo(id);
        console.log("users collateral after liquiadtion:", positonAfterLiquidating.collateral);
        console.log("users borrow shares after liquidation:", positonAfterLiquidating.borrowShares);
        console.log("market borrow assets after liquidation:", marketAfterLiquidation.totalBorrowAssets);
        console.log("market borrow shares after liquidation:", marketAfterLiquidation.totalBorrowShares);
    }
}
