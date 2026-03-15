import {
  useGetMarketParams,
  useGetUsersPosition,
  useGetMarketInfo,
  useLiquidate,
  useGetLiquidatingUsersBorrowAmount,
} from "../../hooks/Syphon.js";
import Tokens from "../../abi/tokenToAddress.json";
import { getReverseTokens } from "../../utils/utils.js";
import { formatEther, formatUnits } from "viem";
import { useEffect } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import lock from "../../assets/icons/lock.svg";
import { useGetOraclePrice } from "../../hooks/Oracle.js";

// Sub-component that enriches a single borrow event with market + position data
function BorrowPositionCard({
  event,
  syphonAddress,
}: {
  event: any;
  syphonAddress: string;
}) {
  const addressToToken = getReverseTokens(Tokens);

  const navigate = useNavigate();

  const { marketParams } = useGetMarketParams(syphonAddress, event.marketId);
  const { marketInfo } = useGetMarketInfo(syphonAddress, event.marketId);
  const { positions, isLoading, error } = useGetUsersPosition(
    syphonAddress,
    event.marketId,
    event.borrower,
  ); // you may need to adjust this if getUserPosition uses msg.sender
  const { userBorrowAmount, borrowAmountLoading, errorBorrowAmount } =
    useGetLiquidatingUsersBorrowAmount(
      syphonAddress,
      event.marketId,
      event.borrower,
    );

  const {
    liquidate,
    isConfirming,
    isSuccess,
    error: errorLiquidate,
    isPending,
  } = useLiquidate(syphonAddress);

  const { oraclePrice, oraclePriceLoading, errorOraclePrice } =
    useGetOraclePrice(marketParams?.oracle);

  const truncate = (addr: string) =>
    `${addr?.slice(0, 6)}...${addr?.slice(-4)}`;

  console.log(positions);
  console.log(marketInfo);

  useEffect(() => {
    if (isSuccess) {
      toast.success(`Liquidated ${event.borrower} succesfully`);
      navigate(`/liquidate}`);
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
      navigate("/liquidate");
    }
  }, [errorLiquidate]);

  if (
    isLoading ||
    error ||
    borrowAmountLoading ||
    errorBorrowAmount ||
    oraclePriceLoading ||
    errorOraclePrice
  )
    return <p>Loading...</p>;

  console.log("collateral value:", positions.collateral);
  console.log("users borrow amount:", userBorrowAmount);

  return (
    BigInt(userBorrowAmount ?? 0n) >
      (BigInt(positions.collateral ?? 0n) * oraclePrice * marketParams.lltv) /
        BigInt(1e36) &&
    userBorrowAmount != 0n && (
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
        <p className=" ">${Number(formatEther(userBorrowAmount)).toFixed(2)}</p>
        <p>
          $
          {Number(
            formatEther(
              (positions.collateral * BigInt(oraclePrice)) / BigInt(1e18),
            ),
          ).toFixed(2)}
        </p>
        <button
          disabled={event.borrowAmount == 0n || isPending}
          onClick={() => {
            liquidate(marketParams, event.marketId, event.borrower);
          }}
          className="bg-blue-600 flex justify-center px-[12px] py-[8px] rounded-full cursor-pointer disabled:bg-gray-600"
        >
          {isPending ? (
            <img src={lock} alt="" className="w-[18px]" />
          ) : (
            "Liquidate"
          )}
        </button>
      </div>
    )
  );
}

export default BorrowPositionCard;
