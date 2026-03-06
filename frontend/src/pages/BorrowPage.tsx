import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import arrow from "../assets/icons/arrow-down-3101.svg";
import { shortenHash } from "../utils/utils.js";
import { useAccount, useChainId } from "wagmi";
import { getReverseTokens } from "../utils/utils.js";
import Tokens from "../abi/tokenToAddress.json";
import syphonAddresses from "../abi/SyphonAddresses.json";
import { useGetMarketInfo, useGetMarketParams } from "../hooks/Syphon.js";
import { useGetBorrowRate } from "../hooks/Irm.js";
import { formatEther } from "viem";
import { useGetERC20Balance } from "../hooks/erc20.js";
import Input from "../components/Input.js";
import {
  useSupplyCollateral,
  useBorrow,
  useGetUserPosition,
} from "../hooks/Syphon.js";
import toast from "react-hot-toast";

const BorrowPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [collateralAmount, setCollateralAmount] = useState<bigint>(0n);
  const [borrowAmount, setBorrowAmount] = useState<bigint>(0n);
  const [hasSuppliedCollateral, setHasSuppliedCollateral] = useState(false);

  const addressToToken = getReverseTokens(Tokens);

  const chainId = useChainId();
  console.log("chainId:", chainId);

  const contractAddresses = syphonAddresses as Record<number, string>;

  const syphonAddress = contractAddresses[chainId];

  const {
    supplyCollateral,
    isSuccess: supplyCollateralSuccess,
    error: collateralError,
  } = useSupplyCollateral(syphonAddress);

  const {
    borrow,
    isSuccess: borrowSuccess,
    error: borrowError,
  } = useBorrow(syphonAddress);

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

  useEffect(() => {
    if (supplyCollateralSuccess) {
      setHasSuppliedCollateral(true);
      toast.success(`supplied collateral $${formatEther(collateralAmount)}`);
    }
  }, [supplyCollateralSuccess]);

  useEffect(() => {
    if (collateralError) {
      const raw = collateralError.message;

      const match =
        raw.match(/Syphon__\w+/)?.[0] ||
        raw.match(/reverted with reason string '(.+?)'/)?.[1] ||
        raw.match(/execution reverted: (.+?)(?:\n|$)/)?.[1];

      const message = match
        ? match
            .replace("Syphon__", "")
            .replace(/([A-Z])/g, " $1")
            .trim()
        : "Transaction failed";

      toast.error(message);
      setCollateralAmount(0n);
    }
  }, [collateralError]);

  useEffect(() => {
    if (borrowSuccess) {
      setHasSuppliedCollateral(true);
      toast.success(`borrowed $${formatEther(borrowAmount)} succesfully`);
      navigate(`/markets/market/${id}`);
    }
  }, [borrowSuccess]);

  useEffect(() => {
    if (borrowError) {
      const raw = borrowError.message;

      const match =
        raw.match(/Syphon__\w+/)?.[0] ||
        raw.match(/reverted with reason string '(.+?)'/)?.[1] ||
        raw.match(/execution reverted: (.+?)(?:\n|$)/)?.[1];

      const message = match
        ? match
            .replace("Syphon__", "")
            .replace(/([A-Z])/g, " $1")
            .trim()
        : "Transaction failed";

      toast.error(message);
      setBorrowAmount(0n);
    }
  }, [borrowError]);

  useEffect(() => {
    if (
      position &&
      Number(
        (position.borrowShares * marketInfo.totalBorrowAssets) /
          marketInfo.totalBorrowShares,
      ) <
        Number(position.collateral) / 1.2
    ) {
      setHasSuppliedCollateral(true);
    }
  }, [position]);

  // Handle loading
  if (
    isLoadingMarketInfo ||
    isLoadingMarketParams ||
    isLoadingBorrowRate ||
    isLoadingPosition
  ) {
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
        {errorPosition && <p>Position error: {errorPosition.message}</p>}
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
  console.log("user poition:", position);
  console.log(
    Number(
      (position.borrowShares * marketInfo.totalBorrowAssets) /
        marketInfo.totalBorrowShares,
    ) <
      Number(position.collateral) / 1.2,
  );

  console.log(
    formatEther(
      BigInt(
        Number(position.collateral) / 1.2 -
          Number(
            (position.borrowShares * marketInfo.totalBorrowAssets) /
              marketInfo.totalBorrowShares,
          ),
      ),
    ),
  );

  const maxBorrow = Math.min(
    Number(
      formatEther(
        BigInt(
          Number(position.collateral) / 1.2 -
            Number(
              (position.borrowShares * marketInfo.totalBorrowAssets) /
                marketInfo.totalBorrowShares,
            ),
        ),
      ),
    ),
    Number(formatEther(marketInfo.totalSupplyAssets)) -
      Number(formatEther(marketInfo.totalBorrowAssets)),
  ).toFixed(2);

  return (
    <div className="flex flex-col gap-[48px]">
      {/* Back Button */}
      <div
        onClick={() => navigate(`/markets/market/${id}`)}
        className="flex items-center cursor-pointer gap-[8px]"
      >
        <img src={arrow} alt="" className="w-[12px] rotate-90" />
        <p className="text-[14px] text-gray-400">Market {shortenHash(id)}</p>
      </div>

      <div className="flex flex-col gap-[48px]">
        <p className="text-[32px]">Borrow</p>

        <div className="flex gap-[48px]">
          {/* Supply Collateral */}
          {!hasSuppliedCollateral && (
            <div className="flex flex-col gap-[24px] p-[24px] bg-[#1d1c28] rounded-2xl w-[600px]">
              <div className="flex items-center justify-between">
                <p className="text-[24px]">
                  Supply Collateral{" "}
                  {addressToToken[marketParams.collateralToken]}
                </p>
                <img
                  src={`../../public/tokens/${addressToToken[marketParams.collateralToken]}.svg`}
                  alt=""
                  className="w-[28px]"
                />
              </div>

              <Input
                inputAmount={collateralAmount}
                setInputAmount={setCollateralAmount}
                token={marketParams.collateralToken}
              />

              <button
                onClick={() =>
                  supplyCollateral(marketParams, id, collateralAmount)
                }
                className="bg-blue-600 hover:bg-blue-700 transition p-[10px] rounded-xl cursor-pointer"
              >
                Supply
              </button>
            </div>
          )}

          {/* Borrow Section (only if collateral supplied) */}
          {hasSuppliedCollateral && (
            <div className="flex flex-col gap-[12px] p-[24px] bg-[#1d1c28] rounded-2xl w-[600px]">
              <p className="text-[18px]">Borrow</p>

              <Input
                inputAmount={borrowAmount}
                setInputAmount={setBorrowAmount}
                token={marketParams.loanToken}
              />

              <div>
                <p>max borrow amount: ${maxBorrow}</p>
              </div>

              {Number(formatEther(borrowAmount)) >
                Number(
                  formatEther(
                    BigInt(
                      Number(position.collateral) / 1.2 -
                        Number(
                          (position.borrowShares *
                            marketInfo.totalBorrowAssets) /
                            marketInfo.totalBorrowShares,
                        ),
                    ),
                  ),
                ) && (
                <p className="text-[12px] text-red-600">
                  *max borrow amount exceeded
                </p>
              )}

              <button
                disabled={Number(formatEther(borrowAmount)) > Number(maxBorrow)}
                onClick={() => borrow(marketParams, id, borrowAmount)}
                className="bg-blue-600 hover:bg-blue-700 transition p-[10px] rounded-md cursor-pointer disabled:bg-gray-500"
              >
                Borrow
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BorrowPage;
