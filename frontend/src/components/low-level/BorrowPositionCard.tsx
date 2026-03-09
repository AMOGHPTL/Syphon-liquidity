import {
  useGetMarketParams,
  useGetUsersPosition,
  useGetMarketInfo,
  useLiquidate,
} from "../../hooks/Syphon.js";
import Tokens from "../../abi/tokenToAddress.json";
import { getReverseTokens } from "../../utils/utils.js";
import { formatEther, formatUnits } from "viem";
import { useEffect } from "react";
import toast from "react-hot-toast";

// Sub-component that enriches a single borrow event with market + position data
function BorrowPositionCard({
  event,
  syphonAddress,
}: {
  event: any;
  syphonAddress: string;
}) {
  const addressToToken = getReverseTokens(Tokens);

  const { marketParams } = useGetMarketParams(syphonAddress, event.marketId);
  const { marketInfo } = useGetMarketInfo(syphonAddress, event.marketId);
  const { positions, isLoading, error } = useGetUsersPosition(
    syphonAddress,
    event.marketId,
    event.borrower,
  ); // you may need to adjust this if getUserPosition uses msg.sender

  const {
    liquidate,
    isConfirming,
    isSuccess,
    error: errorLiquidate,
  } = useLiquidate(syphonAddress);

  const truncate = (addr: string) =>
    `${addr?.slice(0, 6)}...${addr?.slice(-4)}`;

  console.log(positions);
  console.log(marketInfo);

  useEffect(() => {
    if (isSuccess) {
      toast.success(`Liquidated ${event.borrower} succesfully`);
    }
  }, [isSuccess]);

  useEffect(() => {
    if (errorLiquidate) {
      const raw = errorLiquidate.message;

      const match =
        raw.match(/Syphon__\w+/)?.[0] ||
        raw.match(/reverted with reason string '(.+?)'/)?.[1] ||
        raw.match(/execution reverted: (.+?)(?:\n|$)/)?.[1];

      const message = match
        ? match
            .replace("Syphon__", "")
            .replace(/([A-Z])/g, " $1")
            .trim()
        : "Transaction failed";

      toast.error(message);
    }
  }, [errorLiquidate]);

  if (isLoading || error) return <p>Loading...</p>;

  let borrowValue = 0n;
  if (positions.borrowshares != 0n && marketInfo.totalBorrowShares != 0n) {
    borrowValue =
      BigInt(positions.borrowShares * marketInfo.totalBorrowAssets) /
      marketInfo.totalBorrowShares;
  }

  console.log("borrowValue:", borrowValue);
  console.log("collateral value:", positions.collateral);

  return (
    borrowValue * 130n >= positions.collateral * 100n && (
      <div className="w-full p-[24px] grid grid-cols-[repeat(5,1fr)] items-center overflow-hidden bg-white/5 hover:bg-white/10 rounded-2xl cursor-pointer">
        <div className="flex items-center gap-[8px]">
          <div className="flex items-center gap-[4px]">
            <img
              src={`../../public/tokens/${addressToToken[marketParams.collateralToken]}.svg`}
              alt=""
              className="w-[24px]"
            />
            <p>{addressToToken[marketParams.collateralToken]}</p>
          </div>
          <p>/</p>
          <div className="flex items-center gap-[4px]">
            <img
              src={`../../public/tokens/${addressToToken[marketParams.loanToken]}.svg`}
              alt=""
              className="w-[24px]"
            />
            <p>{addressToToken[marketParams.loanToken]}</p>
          </div>
        </div>
        <p>{truncate(event.borrower)}</p>
        <p className=" ">${formatEther(borrowValue)}</p>
        <p>${formatEther(positions.collateral)}</p>
        <button
          onClick={() => {
            liquidate(marketParams, event.marketId, event.borrower);
          }}
          className="bg-blue-600 px-[12px] py-[8px] rounded-full cursor-pointer"
        >
          Liquidate
        </button>
      </div>
    )
  );
}

export default BorrowPositionCard;
