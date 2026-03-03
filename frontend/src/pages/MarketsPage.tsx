import NavBtn from "../components/low-level/NavBtn";
import { useChainId } from "wagmi";
import syphonAddresses from "../abi/SyphonAddresses.json";
import { useGetSyphonMarketIds } from "../hooks/Syphon.js";
import MarketInfoTab from "../components/MarketInfoTab.js";

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
      <div className="flex flex-col gap-[24px]  rounded-2xl bg-white/5">
        <div className="grid grid-cols-[repeat(5,1fr)_max-content] py-[12px] px-[24px] bg-white/5 rounded-2xl rounded-b-none">
          <p className="text-[24px]">collateral token</p>
          <p className="text-[24px]">loan token</p>
          <p className="text-[24px]">borrow APY</p>
          <p className="text-[24px]">suppy APY</p>
          <p className="text-[24px]">LTV</p>
          <div className="w-[32px]"></div>
        </div>
        <div className="flex flex-col gap-[24px] p-[24px]">
          {markets.map((market: string) => (
            <MarketInfoTab marketId={market} syphonAddress={syphonAddress} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default MarketsPage;
