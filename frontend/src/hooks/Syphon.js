import { useReadContract} from "wagmi";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import syphon from "../abi/Syphon.json";


export function useGetSyphonMarketIds(syphonAddress, watch=true) {
    const result = useReadContract({
        address: syphonAddress,
        abi: syphon,
        functionName: "getMarkets",
        args: [],
         query: {
          enabled: !!syphonAddress,   // don't run if address missing
          refetchInterval: watch ? 3000 : false, // auto refresh every 3s (optional)
        },
    })

     const markets = result.data?result.data:null;

    return {
        markets,
        isLoading: result.isLoading,
        error: result.error,
        refetch: result.refetch
    }
} 

export function useCreateMarket(syphonAddress) {
  console.log("triggered useCreateMarket...")
  const [hash, setHash] = useState(null);

  const { writeContractAsync, isPending } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } =
    useWaitForTransactionReceipt({ hash });

  const createMarket = async (collateralToken, loanToken, irm,oracle, lltv) => {
    console.log("creating new market...")
    const txHash = await writeContractAsync({
      address: syphonAddress,
      abi: syphon,
      functionName: "createMarket",
      args: [collateralToken, loanToken, irm,oracle, lltv],
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

export function useGetMarketInfo(syphonAddress, marketId, watch = true){
    const result = useReadContract({
        address: syphonAddress,
        abi: syphon,
        functionName: "getMarketInfo",
        args: [marketId],
        query: {
          enabled: !!syphonAddress,   // don't run if address missing
          refetchInterval: watch ? 3000 : false, // auto refresh every 3s (optional)
        },
    })

     const marketInfo = result.data?result.data:null;

    return {
        marketInfo,
        isLoading: result.isLoading,
        error: result.error,
        refetch: result.refetch
    }
}

export function useGetMarketParams(syphonAddress, marketId, watch = true){
    const result = useReadContract({
        address: syphonAddress,
        abi: syphon,
        functionName: "getMarketParams",
        args: [marketId],
        query: {
          enabled: !!syphonAddress,   // don't run if address missing
          refetchInterval: watch ? 3000 : false, // auto refresh every 3s (optional)
        },
    })

     const marketParams = result.data?result.data:null;

    return {
        marketParams,
        isLoading: result.isLoading,
        error: result.error,
        refetch: result.refetch
    }
}