import { useAccount, useReadContract, useWalletClient } from "wagmi";
import { parseEther } from "viem";
import ERC20Abi from "../abi/ERC20.json";
import tokens from "../abi/tokenToAddress.json";

export function useGetERC20Balance(tokenAddress){
  const { address: userAddress } = useAccount();
    return useReadContract({
        address: tokenAddress,
        abi: ERC20Abi,
        functionName: "balanceOf",
        args: [userAddress],
    })
}

export const useFaucetTokens = () => {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();

  const claimTokens = async () => {
    if (!walletClient || !address) return;

    const tokenAddresses = Object.values(tokens);

    for (const token of tokenAddresses) {
      await walletClient.writeContract({
        address: token,
        abi: ERC20Abi,
        functionName: "mint",
        args: [address, parseEther("100")]
      });
    }
  };

  return { claimTokens };
};