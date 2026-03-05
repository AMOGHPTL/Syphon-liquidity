// import { useNavigate, useParams } from "react-router-dom";
// import arrow from "../assets/icons/arrow-down-3101.svg";
// import { shortenHash } from "../utils/utils.js";

// const BorrowPage = () => {
//   const navigate = useNavigate();
//   const { id } = useParams();
//   return (
//     <div className="flex flex-col gap-[48px]">
//       {" "}
//       <div
//         onClick={() => navigate(`/markets/market/${id}`)}
//         className="flex items-center cursor-pointer gap-[8px]"
//       >
//         <img src={arrow} alt="" className="w-[12px] rotate-90" />
//         <p className="text-[14px] text-gray-400">Market {shortenHash(id)} </p>
//       </div>
//       <div className="flex flex-col gap-[48px]">
//         <p className="text-[32px]">Borrow</p>
//         <div className="flex items-center gap-[48px]">
//           <div>
//             <p></p>
//             <input type="text" />
//             <button>supply</button>
//           </div>
//           <div>borrow loan</div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default BorrowPage;

import { useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import arrow from "../assets/icons/arrow-down-3101.svg";
import { shortenHash } from "../utils/utils.js";
import { useAccount, useChainId } from "wagmi";
import { getReverseTokens } from "../utils/utils.js";
import Tokens from "../abi/tokenToAddress.json";
import syphonAddresses from "../abi/SyphonAddresses.json";
import { useGetMarketInfo, useGetMarketParams } from "../hooks/Syphon.js";
import { useGetBorrowRate } from "../hooks/Irm.js";
import { formatEther } from "viem";
import { useGetERC20Balance } from "../hooks/erc20.js";
import Input from "../components/Input.js";

const BorrowPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [collateralAmount, setCollateralAmount] = useState<bigint>(0n);
  const [borrowAmount, setBorrowAmount] = useState<bigint>(0n);
  const [hasSuppliedCollateral, setHasSuppliedCollateral] = useState(false);

  const handleSupply = () => {
    if (!collateralAmount) return;

    // TODO: call supply collateral contract function
    console.log("Supplying collateral:", collateralAmount);

    setHasSuppliedCollateral(true);
  };

  const handleBorrow = () => {
    if (!borrowAmount) return;

    // TODO: call borrow contract function
    console.log("Borrowing:", borrowAmount);
  };

  const addressToToken = getReverseTokens(Tokens);

  const chainId = useChainId();
  console.log("chainId:", chainId);

  const contractAddresses = syphonAddresses as Record<number, string>;

  const syphonAddress = contractAddresses[chainId];

  const {
    marketInfo,
    isLoading: isLoadingMarketInfo,
    error: errorMarketInfo,
  } = useGetMarketInfo(syphonAddress, id);

  const {
    marketParams,
    isLoading: isLoadingMarketParams,
    error: errorMarketParams,
  } = useGetMarketParams(syphonAddress, id);

  const {
    borrowRate,
    isLoading: isLoadingBorrowRate,
    error: errorBorrowRate,
  } = useGetBorrowRate(marketParams?.irm, marketInfo);

  // Handle loading
  if (isLoadingMarketInfo || isLoadingMarketParams || isLoadingBorrowRate) {
    return <div>.....Loading</div>;
  }

  // Handle errors separately so you can actually see what's wrong
  if (errorMarketInfo || errorMarketParams || errorBorrowRate) {
    return (
      <div>
        {errorMarketInfo && <p>Market info error: {errorMarketInfo.message}</p>}
        {errorMarketParams && (
          <p>Market params error: {errorMarketParams.message}</p>
        )}
        {errorBorrowRate && <p>Borrow rate error: {errorBorrowRate.message}</p>}
      </div>
    );
  }

  // Guard against undefined data after loading completes
  if (!marketInfo || !marketParams) {
    return <div>No market data found.</div>;
  }
  console.log("market info:", marketInfo);
  console.log("market params:", marketParams);
  console.log("borrow rate:", borrowRate);
  console.log("irm address:", marketParams.irm);

  return (
    <div className="flex flex-col gap-[48px]">
      {/* Back Button */}
      <div
        onClick={() => navigate(`/markets/market/${id}`)}
        className="flex items-center cursor-pointer gap-[8px]"
      >
        <img src={arrow} alt="" className="w-[12px] rotate-90" />
        <p className="text-[14px] text-gray-400">Market {shortenHash(id)}</p>
      </div>

      <div className="flex flex-col gap-[48px]">
        <p className="text-[32px]">Borrow</p>

        <div className="flex gap-[48px]">
          {/* Supply Collateral */}
          <div className="flex flex-col gap-[24px] p-[24px] bg-[#1d1c28] rounded-2xl w-[600px]">
            <div className="flex items-center justify-between">
              <p className="text-[24px]">
                Supply Collateral {addressToToken[marketParams.collateralToken]}
              </p>
              <img
                src={`../../public/tokens/${addressToToken[marketParams.collateralToken]}.svg`}
                alt=""
                className="w-[28px]"
              />
            </div>

            <Input
              inputAmount={collateralAmount}
              setInputAmount={setCollateralAmount}
              token={marketParams.collateralToken}
            />

            <button
              onClick={handleSupply}
              className="bg-blue-600 hover:bg-blue-700 transition p-[10px] rounded-xl"
            >
              Supply
            </button>
          </div>

          {/* Borrow Section (only if collateral supplied) */}
          {hasSuppliedCollateral && (
            <div className="flex flex-col gap-[12px] p-[24px] bg-[#1d1c28] rounded-2xl w-[320px]">
              <p className="text-[18px]">Borrow</p>

              <input
                type="text"
                value={borrowAmount}
                onChange={(e) => setBorrowAmount(e.target.value)}
                placeholder="Amount"
                className="bg-[#15141c] p-[10px] rounded-md outline-none"
              />

              <button
                onClick={handleBorrow}
                className="bg-blue-600 hover:bg-blue-700 transition p-[10px] rounded-md"
              >
                Borrow
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BorrowPage;
