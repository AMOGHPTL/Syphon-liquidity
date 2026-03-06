import { useReadContract } from "wagmi";
import {
  useWriteContract,
  useWaitForTransactionReceipt,
  usePublicClient,
} from "wagmi";
import syphon from "../abi/Syphon.json";
import { useAccount } from "wagmi";
import { useState } from "react";
import erc20Abi from "../abi/ERC20.json";

export function useGetSyphonMarketIds(syphonAddress, watch = true) {
  const result = useReadContract({
    address: syphonAddress,
    abi: syphon,
    functionName: "getMarkets",
    args: [],
    query: {
      enabled: !!syphonAddress, // don't run if address missing
      refetchInterval: watch ? 3000 : false, // auto refresh every 3s (optional)
    },
  });

  const markets = result.data ? result.data : null;

  return {
    markets,
    isLoading: result.isLoading,
    error: result.error,
    refetch: result.refetch,
  };
}

export function useCreateMarket(syphonAddress) {
  console.log("triggered useCreateMarket...");
  const [hash, setHash] = useState(null);

  const { writeContractAsync, isPending } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const createMarket = async (
    collateralToken,
    loanToken,
    irm,
    oracle,
    lltv,
  ) => {
    console.log("creating new market...");
    const txHash = await writeContractAsync({
      address: syphonAddress,
      abi: syphon,
      functionName: "createMarket",
      args: [collateralToken, loanToken, irm, oracle, lltv],
    });

    setHash(txHash);
  };

  return {
    createMarket,
    isPending,
    isConfirming,
    isSuccess,
  };
}

export function useGetMarketInfo(syphonAddress, marketId, watch = true) {
  const result = useReadContract({
    address: syphonAddress,
    abi: syphon,
    functionName: "getMarketInfo",
    args: [marketId],
    query: {
      enabled: !!syphonAddress, // don't run if address missing
      refetchInterval: watch ? 3000 : false, // auto refresh every 3s (optional)
    },
  });

  const marketInfo = result.data ? result.data : null;

  return {
    marketInfo,
    isLoading: result.isLoading,
    error: result.error,
    refetch: result.refetch,
  };
}

export function useGetMarketParams(syphonAddress, marketId, watch = true) {
  const result = useReadContract({
    address: syphonAddress,
    abi: syphon,
    functionName: "getMarketParams",
    args: [marketId],
    query: {
      enabled: !!syphonAddress, // don't run if address missing
      refetchInterval: watch ? 3000 : false, // auto refresh every 3s (optional)
    },
  });

  const marketParams = result.data ? result.data : null;

  return {
    marketParams,
    isLoading: result.isLoading,
    error: result.error,
    refetch: result.refetch,
  };
}

export function useSupply(syphonAddress) {
  const [hash, setHash] = useState(null);

  const { writeContractAsync } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess,
    error,
  } = useWaitForTransactionReceipt({
    hash,
  });
  const supply = async (marketParams, Id, amountToSupply) => {
    if (!marketParams || !Id || !amountToSupply) return;

    await writeContractAsync({
      address: marketParams.loanToken,
      abi: erc20Abi,
      functionName: "approve",
      args: [syphonAddress, amountToSupply],
    });

    const txHash = await writeContractAsync({
      address: syphonAddress,
      abi: syphon,
      functionName: "supply",
      args: [marketParams, Id, amountToSupply],
    });

    setHash(txHash);
  };

  return {
    supply,
    isConfirming,
    isSuccess,
    error,
  };
}

export function useWithdraw(syphonAddress) {
  const [hash, setHash] = useState(null);
  const { writeContractAsync } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });
  const withdraw = async (
    marketParams,
    Id,
    amountToWithdraw,
    sharesToWithdraw,
  ) => {
    if (!marketParams || !Id || (!amountToWithdraw && !sharesToWithdraw))
      return;

    const txHash = await writeContractAsync({
      address: syphonAddress,
      abi: syphon,
      functionName: "withdraw",
      args: [marketParams, Id, amountToWithdraw, sharesToWithdraw],
    });

    setHash(txHash);
  };

  return {
    withdraw,
    isConfirming,
    isSuccess,
  };
}

export function useSupplyCollateral(syphonAddress) {
  const [hash, setHash] = useState(null);

  const { writeContractAsync } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess,
    error,
  } = useWaitForTransactionReceipt({
    hash,
  });
  const supplyCollateral = async (marketParams, Id, collateralAmount) => {
    if (!marketParams || !Id || !collateralAmount) return;

    await writeContractAsync({
      address: marketParams.collateralToken,
      abi: erc20Abi,
      functionName: "approve",
      args: [syphonAddress, collateralAmount],
    });

    const txHash = await writeContractAsync({
      address: syphonAddress,
      abi: syphon,
      functionName: "supplyCollateral",
      args: [marketParams, Id, collateralAmount],
    });

    setHash(txHash);
  };

  return {
    supplyCollateral,
    isConfirming,
    isSuccess,
    error,
  };
}

export function useGetUserPosition(syphonAddress, id, watch = true) {
  const { address: user } = useAccount();
  const result = useReadContract({
    address: syphonAddress,
    abi: syphon,
    functionName: "getUserPosition",
    args: [id, user],
    query: {
      enabled: !!syphonAddress, // don't run if address missing
      refetchInterval: watch ? 3000 : false, // auto refresh every 3s (optional)
    },
  });

  const position = result.data ? result.data : null;

  return {
    position,
    isLoading: result.isLoading,
    error: result.error,
    refetch: result.refetch,
  };
}

export function useBorrow(syphonAddress) {
  const [hash, setHash] = useState(null);

  const { writeContractAsync } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess,
    error,
  } = useWaitForTransactionReceipt({
    hash,
  });
  const borrow = async (marketParams, Id, amountToBorrow) => {
    if (!marketParams || !Id || !amountToBorrow) return;

    await writeContractAsync({
      address: marketParams.loanToken,
      abi: erc20Abi,
      functionName: "approve",
      args: [syphonAddress, amountToBorrow],
    });

    const txHash = await writeContractAsync({
      address: syphonAddress,
      abi: syphon,
      functionName: "borrow",
      args: [marketParams, Id, amountToBorrow],
    });

    setHash(txHash);
  };

  return {
    borrow,
    isConfirming,
    isSuccess,
    error,
  };
}
