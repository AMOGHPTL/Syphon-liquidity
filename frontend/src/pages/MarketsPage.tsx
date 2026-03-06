import NavBtn from "../components/low-level/NavBtn";
import { useChainId } from "wagmi";
import syphonAddresses from "../abi/SyphonAddresses.json";
import { useGetSyphonMarketIds } from "../hooks/Syphon.js";
import MarketInfoTab from "../components/MarketInfoTab.js";
import type { Hex } from "viem";

const MarketsPage = () => {
  const chainId = useChainId();
  console.log("chainId:", chainId);

  const contractAddresses = syphonAddresses as Record<number, string>;

  const syphonAddress = contractAddresses[chainId];

  const { markets, isLoading, isError } = useGetSyphonMarketIds(syphonAddress);

  if (isLoading || isError) return <div>....loading</div>;

  console.log(markets);
  return (
    <div className="flex flex-col gap-[48px]">
      <div>
        <p className="text-[32px]">Markets</p>
      </div>
      <div className="grid grid-cols-[repeat(3,1fr)] gap-[24px]">
        {markets.map((market: Hex) => (
          <MarketInfoTab marketId={market} syphonAddress={syphonAddress} />
        ))}
      </div>
    </div>
  );
};

export default MarketsPage;
