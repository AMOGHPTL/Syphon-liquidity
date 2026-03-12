import { useNavigate, useParams } from "react-router-dom";
import { getReverseTokens } from "../utils/utils.js";
import Tokens from "../abi/tokenToAddress.json";
import {
  useGetMarketInfo,
  useGetMarketParams,
  useGetUserSuppliedAmount,
} from "../hooks/Syphon.js";
import { useGetOraclePrice } from "../hooks/Oracle.js";
import { useChainId } from "wagmi";
import syphonAddresses from "../abi/SyphonAddresses.json";
import { useGetBorrowRate } from "../hooks/Irm.js";
import arrow from "../assets/icons/arrow-down-3101.svg";
import { formatEther } from "viem";
import NavBtn from "../components/low-level/NavBtn.js";
import {
  useWithdraw,
  useGetUserPosition,
  useGetUserBorrowAmount,
  useGetLiquidity,
} from "../hooks/Syphon.js";
import MarketPositionTab from "../components/low-level/MarketPositionTab.js";

const MarketPage = () => {
  const { id } = useParams();
  console.log(id);

  const navigate = useNavigate();

  const addressToToken = getReverseTokens(Tokens);

  const chainId = useChainId();
  console.log("chainId:", chainId);

  const contractAddresses = syphonAddresses as Record<number, string>;

  const syphonAddress = contractAddresses[chainId];

  const {
    marketInfo,
    isLoading: isLoadingMarketInfo,
    error: errorMarketInfo,
  } = useGetMarketInfo(syphonAddress, id);

  const {
    marketParams,
    isLoading: isLoadingMarketParams,
    error: errorMarketParams,
  } = useGetMarketParams(syphonAddress, id);

  const {
    borrowRate,
    isLoading: isLoadingBorrowRate,
    error: errorBorrowRate,
  } = useGetBorrowRate(marketParams?.irm, marketInfo);

  const {
    position,
    isLoading: isLoadingPosition,
    error: errorPosition,
  } = useGetUserPosition(syphonAddress, id);

  const { userBorrowAmount, borrowAmountLoading, errorBorrowAmount } =
    useGetUserBorrowAmount(syphonAddress, id);

  const { userSuppliedAmount, suppliedAmountLoading, errorsuppliedAmount } =
    useGetUserSuppliedAmount(syphonAddress, id);

  const { oraclePrice, oraclePriceLoading, errorOraclePrice } =
    useGetOraclePrice(marketParams?.oracle);

  const { liquidity, isLoadingLiquidity, errorLiquidity } = useGetLiquidity(
    syphonAddress,
    id,
  );

  // Handle loading
  if (
    isLoadingMarketInfo ||
    isLoadingMarketParams ||
    isLoadingBorrowRate ||
    isLoadingPosition ||
    borrowAmountLoading ||
    suppliedAmountLoading ||
    oraclePriceLoading ||
    isLoadingLiquidity
  ) {
    return <div>.....Loading</div>;
  }

  // Handle errors separately so you can actually see what's wrong
  if (
    errorMarketInfo ||
    errorMarketParams ||
    errorBorrowRate ||
    errorBorrowAmount ||
    errorsuppliedAmount ||
    errorOraclePrice ||
    errorLiquidity
  ) {
    return (
      <div>
        {errorMarketInfo && <p>Market info error: {errorMarketInfo.message}</p>}
        {errorMarketParams && (
          <p>Market params error: {errorMarketParams.message}</p>
        )}
        {errorBorrowRate && <p>Borrow rate error: {errorBorrowRate.message}</p>}
        {errorPosition && <p>User position error: {errorPosition.message}</p>}
      </div>
    );
  }

  // Guard against undefined data after loading completes
  if (!marketInfo || !marketParams) {
    return <div>No market data found.</div>;
  }
  console.log("market info:", marketInfo);
  console.log("market params:", marketParams);
  console.log("borrow rate:", borrowRate);
  console.log("irm address:", marketParams.irm);
  console.log("user borrow amount:", userBorrowAmount);
  console.log("user supplied amount:", userSuppliedAmount);

  return (
    <div className="flex flex-col gap-[48px]">
      {/* navigate back part */}

      <div
        onClick={() => navigate("/markets")}
        className="flex items-center cursor-pointer gap-[8px]"
      >
        <img src={arrow} alt="" className="w-[12px] rotate-90" />
        <p className="text-[14px] text-gray-400">Markets </p>
      </div>

      {/* main part */}
      <div className="w-full flex flex-col gap-[56px]">
        {/* info part */}
        <div className="w-full flex flex-col gap-[48px]">
          <div className="flex items-center gap-[16px]">
            <div className="flex items-center gap-[10px]">
              <img
                src={`../../public/tokens/${addressToToken[marketParams.collateralToken]}.svg`}
                alt=""
                className="w-[48px]"
              />
              <p className="text-[24px]">
                {addressToToken[marketParams.collateralToken]}
              </p>
            </div>
            <p className="text-[36px] font-semibold">/</p>
            <div className="flex items-center gap-[10px]">
              <img
                src={`../../public/tokens/${addressToToken[marketParams.loanToken]}.svg`}
                alt=""
                className="w-[48px]"
              />
              <p className="text-[24px]">
                {addressToToken[marketParams.loanToken]}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-[12px]">
              <p className="text-[16px]">Total Market size</p>
              <p className="text-[24px]">
                ${Number(formatEther(marketInfo.totalSupplyAssets)).toFixed(2)}
              </p>
            </div>
            <div className="flex flex-col gap-[12px]">
              <p className="text-[16px]">Total liquidity</p>
              <p className="text-[24px]">
                ${liquidity ? Number(formatEther(liquidity)).toFixed(2) : 0.0}
              </p>
            </div>
            <div className="flex flex-col gap-[12px]">
              <p className="text-[16px]">Utilization</p>
              <p className="text-[24px]">
                {marketInfo.totalBorrowAssets
                  ? (marketInfo.totalBorrowAssets * 100n) /
                    marketInfo.totalSupplyAssets
                  : "0"}
                %
              </p>
            </div>
            <div className="flex flex-col gap-[12px]">
              <p className="text-[16px]">Rate</p>
              <p className="text-[24px]">
                {((Number(borrowRate) / 1e18) * 100).toFixed(2)}%
              </p>
            </div>
            <div className="flex flex-col gap-[12px]">
              <p className="text-[16px]">ltv</p>
              {/* <p className="text-[24px]">
                {(BigInt(marketParams.lltv) * BigInt(100)) / BigInt(1e18)}%
              </p> */}
              <p className="text-[24px]">
                {BigInt(marketParams.lltv) / BigInt(1e16)}%{" "}
              </p>
            </div>
          </div>
        </div>
        {/* more market info */}
        <div className="w-fit flex gap-[48px] py-[12px] px-[24px]  bg-white/5 rounded-2xl">
          <div className="flex w-[330px] flex-col gap-[24px] pr-[24px] border-r-2 border-white/10">
            <div className="flex justify-between">
              <p>Collateral Token:</p>
              <div className="flex items-center gap-[6px]">
                <img
                  src={`../../public/tokens/${addressToToken[marketParams.collateralToken]}.svg`}
                  alt=""
                  className="w-[24px]"
                />
                <p>{addressToToken[marketParams.collateralToken]}</p>
              </div>
            </div>
            <div className="flex justify-between">
              <p>Loan Token:</p>
              <div className="flex items-center gap-[6px]">
                <img
                  src={`../../public/tokens/${addressToToken[marketParams.loanToken]}.svg`}
                  alt=""
                  className="w-[24px]"
                />
                <p>{addressToToken[marketParams.loanToken]}</p>
              </div>
            </div>
          </div>
          <div className="w-[300px] flex flex-col gap-[24px]">
            <div className="flex justify-between">
              <p>oracle price:</p>
              <p>
                {addressToToken[marketParams.collateralToken]} /{" "}
                {addressToToken[marketParams.loanToken]} ={" "}
                {formatEther(oraclePrice)}
              </p>
            </div>
          </div>
        </div>
        {/* borrow and supply part */}
        <div className="flex items-center gap-[48px]">
          {/* borrow */}
          <div>
            <div>
              <NavBtn to={`/markets/borrow/${id}`} text="borrow" />
            </div>
          </div>
          {/* supply */}
          <div>
            <div>
              <NavBtn to={`/markets/supply/${id}`} text="supply" />
            </div>
          </div>
        </div>
        {/* poistions */}
        <div className="flex flex-col gap-[32px]">
          <p className="text-[32px]">Positions</p>
          {!position.supplyShares && !position.collateral ? (
            <p className="text-[18px]">No positions....</p>
          ) : (
            <div className="flex flex-col gap-[24px] pr-[30%]">
              {position.supplyShares != 0n && (
                <div>
                  <MarketPositionTab
                    id={id}
                    token={addressToToken[marketParams.loanToken]}
                    path="withdraw"
                    title="Liquidity"
                    value={formatEther(
                      BigInt(
                        (position.supplyShares * marketInfo.totalSupplyAssets) /
                          marketInfo.totalSupplyShares,
                      ),
                    )}
                  />
                </div>
              )}
              {position.collateral != 0n && (
                <MarketPositionTab
                  id={id}
                  path="withdrawCollateral"
                  title="Collateral"
                  value={formatEther(position.collateral)}
                  token={addressToToken[marketParams.collateralToken]}
                />
              )}
              {position.borrowShares != 0n &&
                marketInfo.totalBorrowShares != 0 && (
                  <MarketPositionTab
                    id={id}
                    path="repay"
                    title="Borrow"
                    value={formatEther(
                      // BigInt(
                      //   (position.borrowShares * marketInfo.totalBorrowAssets) /
                      //     marketInfo.totalBorrowShares,
                      // ),
                      userBorrowAmount,
                    )}
                    token={addressToToken[marketParams.loanToken]}
                  />
                )}
            </div>
          )}
          {/* <MarketPositionTab id={id} path1="" path2="" title="" value="" />
          <MarketPositionTab id={id} path1="" path2="" title="" value="" /> */}
        </div>
      </div>
    </div>
  );
};

export default MarketPage;
