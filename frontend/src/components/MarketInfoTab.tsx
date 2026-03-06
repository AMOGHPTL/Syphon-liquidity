import type { Market } from "../types/types";
import { useGetMarketInfo, useGetMarketParams } from "../hooks/Syphon.js";
import Tokens from "../abi/tokenToAddress.json";
import { getReverseTokens } from "../utils/utils.js";
import { useGetBorrowRate } from "../hooks/Irm.js";
import { formatEther, type Hex } from "viem";
import token from "../../public/tokens/pUSD.svg";
import arrow from "../assets/icons/arrow-down-3101.svg";
import { useNavigate } from "react-router-dom";

const MarketInfoTab = ({
  marketId,
  syphonAddress,
}: {
  marketId: Hex;
  syphonAddress: string;
}) => {
  const navigate = useNavigate();

  const addressToToken = getReverseTokens(Tokens);

  const {
    marketInfo,
    isLoading: isLoadingMarketInfo,
    error: errorMarketInfo,
  } = useGetMarketInfo(syphonAddress, marketId);

  const {
    marketParams,
    isLoading: isLoadingMarketParams,
    error: errorMarketParams,
  } = useGetMarketParams(syphonAddress, marketId);

  const {
    borrowRate,
    isLoading: isLoadingBorrowRate,
    error: errorBorrowRate,
  } = useGetBorrowRate(marketParams?.irm, marketInfo);

  // Handle loading
  if (isLoadingMarketInfo || isLoadingMarketParams || isLoadingBorrowRate) {
    return <div>.....Loading</div>;
  }

  // Handle errors separately so you can actually see what's wrong
  if (errorMarketInfo || errorMarketParams || errorBorrowRate) {
    return (
      <div>
        {errorMarketInfo && <p>Market info error: {errorMarketInfo.message}</p>}
        {errorMarketParams && (
          <p>Market params error: {errorMarketParams.message}</p>
        )}
        {errorBorrowRate && <p>Borrow rate error: {errorBorrowRate.message}</p>}
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

  return (
    <div
      onClick={() => navigate(`market/${marketId}`)}
      className="w-full flex flex-col gap-[24px] bg-black/30 hover:bg-black/90 px-[24px] py-[18px] rounded-2xl cursor-pointer"
    >
      <div className="flex items-center gap-[8px]">
        <div className="flex items-center gap-[8px]">
          <img
            src={`../../public/tokens/${addressToToken[marketParams.collateralToken]}.svg`}
            alt=""
            className="w-[32px]"
          />
          <p className="text-[24px]">
            {addressToToken[marketParams.collateralToken]}
          </p>
        </div>
        <p className="text-[24px] font-thin">/</p>
        <div className="flex items-center gap-[8px]">
          <img
            src={`../../public/tokens/${addressToToken[marketParams.loanToken]}.svg`}
            alt=""
            className="w-[32px]"
          />
          <p className="text-[24px]">
            {addressToToken[marketParams.loanToken]}
          </p>
        </div>
      </div>
      <div className="w-full flex flex-col gap-[12px]">
        <div className="w-full flex items-center justify-between">
          <div>
            <p>
              TVL : $
              {formatEther(
                marketInfo.totalSupplyAssets + marketInfo.totalBorrowAssets,
              )}
            </p>
          </div>
          <div>
            <p>
              Liquidity : $
              {formatEther(
                BigInt(
                  marketInfo.totalSupplyAssets - marketInfo.totalBorrowAssets,
                ),
              )}
            </p>
          </div>
        </div>
        <div className="w-full flex items-center justify-between">
          <div>
            <p>Borrow APR : {BigInt(borrowRate) / BigInt(1e16)}%</p>
          </div>

          <div>
            <p>LTV : {BigInt(marketParams.lltv) / BigInt(1e16)}%</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketInfoTab;
