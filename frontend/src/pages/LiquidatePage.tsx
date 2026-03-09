import { useChainId } from "wagmi";
import syphonAddresses from "../abi/SyphonAddresses.json";
import {
  useGetSyphonMarketIds,
  useBorrowedEvents,
  useGetMarketParams,
  useGetUsersPosition,
} from "../hooks/Syphon.js";
import { formatUnits, type Hex } from "viem";
import BorrowPositionCard from "../components/low-level/BorrowPositionCard.js";

function Row({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        fontSize: "14px",
      }}
    >
      <span style={{ color: "#888" }}>{label}</span>
      <span
        style={{
          color: highlight ? "#4ade80" : "#f0f0f0",
          fontWeight: highlight ? 600 : 400,
        }}
      >
        {value}
      </span>
    </div>
  );
}

const LiquidatePage = () => {
  const chainId = useChainId();
  const contractAddresses = syphonAddresses as Record<number, string>;
  const syphonAddress = contractAddresses[chainId];

  const { borrowedEvents, loading, error } = useBorrowedEvents(syphonAddress);

  if (loading)
    return (
      <div style={{ padding: "20px", color: "#888" }}>Loading positions...</div>
    );
  if (error)
    return (
      <div style={{ padding: "20px", color: "#f87171" }}>Error: {error}</div>
    );
  if (!borrowedEvents.length)
    return (
      <div style={{ padding: "20px", color: "#888" }}>
        No borrow positions found.
      </div>
    );

  console.log(borrowedEvents);

  return (
    <div>
      <div className="p-[24px] grid grid-cols-[repeat(5,1fr)]">
        <p>Market</p>
        <p>Borrower</p>
        <p>borrow Amount</p>
        <p>Collateral</p>
        <p></p>
      </div>
      {[
        ...new Map(
          borrowedEvents.map((event: any) => [event.borrower, event]),
        ).values(),
      ].map((event) => (
        <BorrowPositionCard
          key={event.transactionHash}
          event={event}
          syphonAddress={syphonAddress}
        />
      ))}
    </div>
  );
};

export default LiquidatePage;
