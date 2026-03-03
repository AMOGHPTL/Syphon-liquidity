import { useAccount, useReadContract } from "wagmi";
import ERC20Abi from "../abi/ERC20.json";

export function useGetERC20Balance(tokenAddress){
  const { address: userAddress } = useAccount();
    return useReadContract({
        address: tokenAddress,
        abi: ERC20Abi,
        functionName: "balanceOf",
        args: [userAddress],
    })
}