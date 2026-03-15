import {
  useGetUserPosition,
  useGetMarketInfo,
  useGetMarketParams,
} from "../hooks/Syphon.js";
import { formatEther, formatUnits } from "viem";
import type { Hex } from "viem";
import { getReverseTokens } from "../utils/utils.js";
import Tokens from "../abi/tokenToAddress.json";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useGetOraclePrice } from "../hooks/Oracle.js";

interface Props {
  syphonAddress: string;
  marketId: Hex;
  onHasPosition?: (hasPosition: boolean) => void;
}

const MarketPositionRow = ({
  syphonAddress,
  marketId,
  onHasPosition,
}: Props) => {
  const navigate = useNavigate();
  const addressToToken = getReverseTokens(Tokens);
  const {
    position,
    isLoading: posLoading,
    error: errorPosition,
  } = useGetUserPosition(syphonAddress, marketId);
  const {
    marketInfo,
    isLoading: infoLoading,
    error: errorMarketInfo,
  } = useGetMarketInfo(syphonAddress, marketId);
  const {
    marketParams,
    isLoading: paramsLoading,
    error: errorMarketParams,
  } = useGetMarketParams(syphonAddress, marketId);

  const { oraclePrice, oraclePriceLoading, errorOraclePrice } =
    useGetOraclePrice(marketParams?.oracle);

  const hasPosition =
    (position?.supplyShares ?? 0n) > 0n ||
    (position?.borrowShares ?? 0n) > 0n ||
    (position?.collateral ?? 0n) > 0n;

  useEffect(() => {
    if (!posLoading && !infoLoading && !paramsLoading) {
      onHasPosition?.(hasPosition);
    }
  }, [hasPosition, posLoading, infoLoading, paramsLoading]);
  if (posLoading || infoLoading || paramsLoading || oraclePriceLoading) {
    return (
      <div>
        <p className=" text-gray-400 animate-pulse">
          Loading market {marketId.slice(0, 8)}...
        </p>
      </div>
    );
  }

  if (errorPosition || errorMarketInfo || errorMarketParams || errorOraclePrice)
    return <p>Error</p>;

  if (!hasPosition) return null;

  console.log("market info:", marketInfo);

  return (
    <div
      onClick={() => navigate(`/markets/market/${marketId}`)}
      className="w-full p-[24px] grid grid-cols-[repeat(4,1fr)] overflow-hidden bg-white/5 hover:bg-white/10 rounded-2xl cursor-pointer"
    >
      <div className="flex items-center gap-[8px]">
        <div className="flex items-center gap-[4px]">
          <img
            src={`../../public/tokens/${addressToToken[marketParams.collateralToken]}.svg`}
            alt=""
            className="w-[24px]"
          />
          <p>{addressToToken[marketParams.collateralToken]}</p>
        </div>
        <p>/</p>
        <div className="flex items-center gap-[4px]">
          <img
            src={`../../public/tokens/${addressToToken[marketParams.loanToken]}.svg`}
            alt=""
            className="w-[24px]"
          />
          <p>{addressToToken[marketParams.loanToken]}</p>
        </div>
      </div>
      <p className=" ">
        {marketInfo.totalSupplyAssets
          ? `$${formatEther(
              BigInt(
                (position.supplyShares * marketInfo.totalSupplyAssets) /
                  marketInfo.totalSupplyShares,
              ),
            )}`
          : "$0"}
      </p>
      <p className=" ">
        {position?.collateral
          ? `$${(Number(position.collateral * oraclePrice) / 1e36).toFixed(2)}`
          : "$0"}
      </p>
      <p className=" ">
        {marketInfo.totalBorrowAssets
          ? `$${formatEther(
              BigInt(
                (position.borrowShares * marketInfo.totalBorrowAssets) /
                  marketInfo.totalBorrowShares,
              ),
            )}`
          : "$0"}
      </p>
    </div>
  );
};

export default MarketPositionRow;
