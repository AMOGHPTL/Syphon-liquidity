import irmAbi from "../abi/mockIrm.json";
import { useReadContract} from "wagmi";

export function useGetBorrowRate(irmAddress, market, watch = true){
    const result = useReadContract({
        address: irmAddress,
        abi: irmAbi,
        functionName: "borrowRate",
        args: [market],
         query: {
          enabled: !!irmAddress,   // don't run if address missing
          refetchInterval: watch ? 3000 : false, // auto refresh every 3s (optional)
        },
    })

     const borrowRate = result.data?result.data:null;

    return {
        borrowRate,
        isLoading: result.isLoading,
        error: result.error,
        refetch: result.refetch
    }
}