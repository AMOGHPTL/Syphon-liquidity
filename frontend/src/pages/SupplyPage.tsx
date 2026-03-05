import { useNavigate, useParams } from "react-router-dom";
import arrow from "../assets/icons/arrow-down-3101.svg";
import { shortenHash, getReverseTokens } from "../utils/utils.js";
import Tokens from "../abi/tokenToAddress.json";
import syphonAddresses from "../abi/SyphonAddresses.json";
import {
  useGetMarketInfo,
  useGetMarketParams,
  useSupply,
} from "../hooks/Syphon.js";
import { useGetBorrowRate } from "../hooks/Irm.js";
import { useChainId } from "wagmi";
import Input from "../components/Input.js";
import { useEffect, useState } from "react";
import { formatEther } from "viem";
import toast from "react-hot-toast";

const SupplyPage = () => {
  const [supplyAmount, setSupplyAmount] = useState<bigint>(0n);

  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const addressToToken = getReverseTokens(Tokens);
  const chainId = useChainId();

  const contractAddresses = syphonAddresses as Record<number, string>;
  const syphonAddress = contractAddresses[chainId];

  const { supply, isSuccess, error } = useSupply(syphonAddress);

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

  if (!id) return <div>Invalid market</div>;

  if (isLoadingMarketInfo || isLoadingMarketParams || isLoadingBorrowRate) {
    return <div>.....Loading</div>;
  }

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

  if (!marketInfo || !marketParams) {
    return <div>No market data found.</div>;
  }

  const tokenSymbol = addressToToken[marketParams.loanToken];

  useEffect(() => {
    if (isSuccess) {
      navigate(`/markets/market/${id}`);
      toast.success(`$${formatEther(supplyAmount)} supplied succesfully`);
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
      setSupplyAmount(0n);
    }
  }, [error]);

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
        <p className="text-[32px]">Supply Liquidity</p>

        <div className="flex flex-col gap-[24px] p-[24px] bg-[#1d1c28] rounded-2xl w-[600px]">
          <div className="flex items-center justify-between">
            <p className="text-[24px]">Supply Liquidity {tokenSymbol}</p>

            <img
              src={`/tokens/${tokenSymbol}.svg`}
              alt=""
              className="w-[28px]"
            />
          </div>

          <Input
            inputAmount={supplyAmount}
            setInputAmount={setSupplyAmount}
            token={marketParams.loanToken}
          />

          <button
            disabled={supplyAmount === 0n}
            onClick={() => supply(marketParams, id, supplyAmount)}
            className="bg-blue-600 hover:bg-blue-700 transition p-[10px] rounded-xl cursor-pointer disabled:bg-gray-600 disabled:cursor-not-allowed"
          >
            Supply
          </button>
        </div>
      </div>
    </div>
  );
};

export default SupplyPage;
