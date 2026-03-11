import oracleAbi from "../abi/mockOracle.json";
import { useReadContract } from "wagmi";

export function useGetOraclePrice(oracle, watch = true) {
  const result = useReadContract({
    address: oracle,
    abi: oracleAbi,
    functionName: "price",
    args: [],
    query: {
      enabled: !!oracle, // don't run if address missing
      refetchInterval: watch ? 3000 : false, // auto refresh every 3s (optional)
    },
  });

  const oraclePrice = result.data ? result.data : null;

  return {
    oraclePrice,
    oraclePriceLoading: result.isLoading,
    errorOraclePrice: result.error,
    refetch: result.refetch,
  };
}
