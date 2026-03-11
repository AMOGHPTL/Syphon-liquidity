import { useChainId } from "wagmi";
import syphonAddresses from "../abi/SyphonAddresses.json";
import { useGetSyphonMarketIds } from "../hooks/Syphon.js";
import MarketPositionRow from "../components/MarketPositionRow.js";
import type { Hex } from "viem";
import { useState } from "react";

const DashboardPage = () => {
  const [hasAnyPosition, setHasAnyPosition] = useState(false);
  const chainId = useChainId();
  const contractAddresses = syphonAddresses as Record<number, string>;
  const syphonAddress = contractAddresses[chainId];

  const { markets, isLoading, error } = useGetSyphonMarketIds(syphonAddress);

  if (isLoading)
    return <div className="p-8 text-gray-400">Loading markets...</div>;
  if (error)
    return <div className="p-8 text-red-400">Error: {error.message}</div>;

  return (
    <div className="flex flex-col gap-[40px] p-8">
      <p className="text-[48px]">Dashboard</p>

      <div>
        {hasAnyPosition ? (
          <p className="text-[32px] mb-6">Your Positions</p>
        ) : (
          <p className="text-[24px]">No positions...</p>
        )}

        {!markets || markets.length === 0 ? (
          <p className="text-gray-400">No markets available.</p>
        ) : (
          <div className={`flex flex-col gap-[12px]  rounded-2xl p-[24px] ${hasAnyPosition ? "bg-white/5" : "bg-none"}`}>
            {hasAnyPosition ? (
              <div className="w-full p-[24px] grid grid-cols-[repeat(4,1fr)] overflow-hidden">
                <p className="  font-medium">Market</p>

                <p className="  font-medium">Supply</p>
                <p className=" font-medium">Collateral</p>
                <p className=" font-medium">Borrow</p>
              </div>
            ) : (
              ""
            )}
            <div className="w-full flex flex-col gap-[12px]">
              {(markets as Hex[]).map((marketId) => (
                <MarketPositionRow
                  key={marketId}
                  syphonAddress={syphonAddress}
                  marketId={marketId}
                  onHasPosition={(hasPosition) => {
                    if (hasPosition) setHasAnyPosition(true);
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
