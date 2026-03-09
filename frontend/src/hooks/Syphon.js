import { useReadContract } from "wagmi";
import {
  useWriteContract,
  useWaitForTransactionReceipt,
  usePublicClient,
} from "wagmi";
import syphon from "../abi/Syphon.json";
import { useAccount } from "wagmi";
import { useState, useEffect } from "react";
import erc20Abi from "../abi/ERC20.json";
import { parseAbiItem } from "viem";

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

export function useWithdrawCollateral(syphonAddress) {
  const [hash, setHash] = useState(null);

  const { writeContractAsync } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess,
    error,
  } = useWaitForTransactionReceipt({
    hash,
  });
  const withdrawCollateral = async (marketParams, Id, collateralToWithdraw) => {
    if (!marketParams || !Id || !collateralToWithdraw) return;

    const txHash = await writeContractAsync({
      address: syphonAddress,
      abi: syphon,
      functionName: "withdrawCollateral",
      args: [marketParams, Id, collateralToWithdraw],
    });

    setHash(txHash);
  };

  return {
    withdrawCollateral,
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

export function useGetUsersPosition(syphonAddress, id, user, watch = true) {
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

  const positions = result.data ? result.data : null;

  return {
    positions,
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

export function useRepay(syphonAddress) {
  const [hash, setHash] = useState(null);
  const { writeContractAsync } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });
  const repay = async (marketParams, Id, amountToRepay, sharesToRepay) => {
    if (!marketParams || !Id || (!amountToRepay && !sharesToRepay)) return;

    await writeContractAsync({
      address: marketParams.loanToken,
      abi: erc20Abi,
      functionName: "approve",
      args: [syphonAddress, amountToRepay],
    });

    const txHash = await writeContractAsync({
      address: syphonAddress,
      abi: syphon,
      functionName: "repay",
      args: [marketParams, Id, amountToRepay, sharesToRepay],
    });

    setHash(txHash);
  };

  return {
    repay,
    isConfirming,
    isSuccess,
  };
}

const BORROWED_EVENT = parseAbiItem(
  "event borrowed(bytes32 id, address loanToken, uint256 borrowAmount, address indexed borrower)",
);

const mapLog = (log) => ({
  marketId: log.args.id,
  loanToken: log.args.loanToken,
  borrowAmount: log.args.borrowAmount,
  borrower: log.args.borrower, // ✅ was log.borrower in historical fetch
  blockNumber: log.blockNumber,
  transactionHash: log.transactionHash,
});

export function useBorrowedEvents(contractAddress) {
  const [borrowedEvents, setBorrowedEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const publicClient = usePublicClient();

  useEffect(() => {
    if (!contractAddress || !publicClient) return;

    const fetchEvents = async () => {
      setLoading(true);
      setError(null);
      try {
        const logs = await publicClient.getLogs({
          address: contractAddress,
          event: BORROWED_EVENT,
          fromBlock: 0n,
          toBlock: "latest",
        });
        setBorrowedEvents(logs.map(mapLog)); // ✅ shared mapper, no typos
      } catch (err) {
        setError(err.message);
        console.error("Error fetching borrowed events:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [contractAddress, publicClient]);

  useEffect(() => {
    if (!contractAddress || !publicClient) return;

    const unwatch = publicClient.watchEvent({
      address: contractAddress,
      event: BORROWED_EVENT,
      onLogs: (logs) => {
        const newEvents = logs.map(mapLog); // ✅ same mapper
        setBorrowedEvents((prev) => {
          const existingHashes = new Set(prev.map((e) => e.transactionHash));
          const deduplicated = newEvents.filter(
            (e) => !existingHashes.has(e.transactionHash),
          );
          return [...prev, ...deduplicated];
        });
      },
      onError: (err) => {
        console.error("Watch event error:", err);
        setError(err.message);
      },
    });

    return () => unwatch();
  }, [contractAddress, publicClient]);

  return { borrowedEvents, loading, error };
}

export function useLiquidate(syphonAddress) {
  const [hash, setHash] = useState(null);

  const { writeContractAsync } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess,
    error,
  } = useWaitForTransactionReceipt({
    hash,
  });
  const liquidate = async (marketParams, Id, toLiquidate, amount) => {
    if (!marketParams || !Id || !toLiquidate) return;

    await writeContractAsync({
      address: marketParams.loanToken,
      abi: erc20Abi,
      functionName: "approve",
      args: [syphonAddress, amount],
    });

    const txHash = await writeContractAsync({
      address: syphonAddress,
      abi: syphon,
      functionName: "liquidate",
      args: [marketParams, Id, toLiquidate],
    });

    setHash(txHash);
  };

  return {
    liquidate,
    isConfirming,
    isSuccess,
    error,
  };
}

export function useGetUserBorrowAmount(syphonAddress, id, watch = true) {
  const { address: user } = useAccount();
  const result = useReadContract({
    address: syphonAddress,
    abi: syphon,
    functionName: "getUserBorrowedAmount",
    args: [id, user],
    query: {
      enabled: !!syphonAddress, // don't run if address missing
      refetchInterval: watch ? 3000 : false, // auto refresh every 3s (optional)
    },
  });

  const userBorrowAmount = result.data ? result.data : null;

  return {
    userBorrowAmount,
    borrowAmountLoading: result.isLoading,
    errorBorrowAmount: result.error,
    refetch: result.refetch,
  };
}

export function useGetUserSuppliedAmount(syphonAddress, id, watch = true) {
  const { address: user } = useAccount();
  const result = useReadContract({
    address: syphonAddress,
    abi: syphon,
    functionName: "getUserSuppliedAmount",
    args: [id, user],
    query: {
      enabled: !!syphonAddress, // don't run if address missing
      refetchInterval: watch ? 3000 : false, // auto refresh every 3s (optional)
    },
  });

  const userSuppliedAmount = result.data ? result.data : null;

  return {
    userSuppliedAmount,
    suppliedAmountLoading: result.isLoading,
    errorsuppliedAmount: result.error,
    refetch: result.refetch,
  };
}
