import { useNavigate, useParams } from "react-router-dom";
import arrow from "../assets/icons/arrow-down-3101.svg";
import { shortenHash, getReverseTokens } from "../utils/utils.js";
import Tokens from "../abi/tokenToAddress.json";
import syphonAddresses from "../abi/SyphonAddresses.json";
import {
  useGetMarketInfo,
  useGetMarketParams,
  useWithdrawCollateral,
  useGetUserPosition,
  useGetUserBorrowAmount,
} from "../hooks/Syphon.js";
import { useGetOraclePrice } from "../hooks/Oracle.js";
import { useGetBorrowRate } from "../hooks/Irm.js";
import { useChainId } from "wagmi";
import Input from "../components/Input.js";
import { useEffect, useState } from "react";
import { formatEther } from "viem";
import toast from "react-hot-toast";
import { useGetERC20Balance } from "../hooks/erc20.js";

const WithdrawCollateralPage = () => {
  const [withdrawAmount, setwithdrawAmount] = useState<bigint>(0n);

  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const addressToToken = getReverseTokens(Tokens);
  const chainId = useChainId();

  const contractAddresses = syphonAddresses as Record<number, string>;
  const syphonAddress = contractAddresses[chainId];

  const { withdrawCollateral, isSuccess, error } =
    useWithdrawCollateral(syphonAddress);

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

  const { data: tokenBalance, isLoading: isLoadingTokenBalance } =
    useGetERC20Balance(marketParams?.loanToken);

  const {
    position,
    isLoading: isLoadingPosition,
    error: errorPosition,
  } = useGetUserPosition(syphonAddress, id);

  const {
    borrowRate,
    isLoading: isLoadingBorrowRate,
    error: errorBorrowRate,
  } = useGetBorrowRate(marketParams?.irm, marketInfo);

  const { userBorrowAmount, borrowAmountLoading, errorBorrowAmount } =
    useGetUserBorrowAmount(syphonAddress, id);

  const { oraclePrice, oraclePriceLoading, errorOraclePrice } =
    useGetOraclePrice(marketParams?.oracle);

  useEffect(() => {
    if (isSuccess) {
      navigate(`/markets/market/${id}`);
      toast.success(`$${formatEther(withdrawAmount)} withdrawn succesfully`);
    }
  }, [isSuccess]);

  useEffect(() => {
    if (error) {
      const raw = error.message;

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
      setwithdrawAmount(0n);
    }
  }, [error]);

  if (!id) return <div>Invalid market</div>;

  if (
    isLoadingMarketInfo ||
    isLoadingMarketParams ||
    isLoadingBorrowRate ||
    isLoadingTokenBalance ||
    isLoadingPosition ||
    borrowAmountLoading ||
    oraclePriceLoading
  ) {
    return <div>.....Loading</div>;
  }

  if (
    errorMarketInfo ||
    errorMarketParams ||
    errorBorrowRate ||
    errorPosition ||
    errorBorrowAmount ||
    errorOraclePrice
  ) {
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

  if (!marketInfo || !marketParams) {
    return <div>No market data found.</div>;
  }

  const tokenSymbol = addressToToken[marketParams.collateralToken];

  return (
    <div className="flex flex-col gap-[48px]">
      <div
        onClick={() => navigate(`/markets/market/${id}`)}
        className="flex items-center cursor-pointer gap-[8px]"
      >
        <img src={arrow} alt="" className="w-[12px] rotate-90" />
        <p className="text-[14px] text-gray-400">Market {shortenHash(id)}</p>
      </div>

      <div className="flex flex-col gap-[48px]">
        <p className="text-[32px]">Withdraw Collateral</p>

        <div className="flex flex-col gap-[24px] p-[24px] bg-[#1d1c28] rounded-2xl w-[600px]">
          <div className="flex items-center justify-between">
            <p className="text-[24px]">Withdraw Collateral {tokenSymbol}</p>

            <img
              src={`/tokens/${tokenSymbol}.svg`}
              alt=""
              className="w-[28px]"
            />
          </div>

          <Input
            inputAmount={withdrawAmount}
            setInputAmount={setwithdrawAmount}
            token={marketParams.loanToken}
            max={(() => {
              const minCollateral =
                (BigInt(userBorrowAmount ?? 0) * 120n) / 100n;
              const maxWithdraw =
                BigInt(position?.collateral ?? 0) - minCollateral;
              return maxWithdraw > 0n ? maxWithdraw : 0n;
            })()}
            price={oraclePrice}
          />

          <button
            disabled={
              withdrawAmount === 0n ||
              withdrawAmount >
                BigInt(position?.collateral ?? 0) -
                  (BigInt(userBorrowAmount ?? 0) * 120n) / 100n
            }
            onClick={() =>
              withdrawCollateral(marketParams, id, withdrawAmount, 0)
            }
            className="bg-blue-600 hover:bg-blue-700 transition p-[10px] rounded-xl cursor-pointer disabled:bg-gray-600 disabled:cursor-not-allowed"
          >
            Withdraw
          </button>
        </div>
      </div>
    </div>
  );
};

export default WithdrawCollateralPage;
