import { useNavigate, useParams } from "react-router-dom";
import { getReverseTokens } from "../utils/utils.js";
import Tokens from "../abi/tokenToAddress.json";
import { useGetMarketInfo, useGetMarketParams } from "../hooks/Syphon.js";
import { useChainId } from "wagmi";
import syphonAddresses from "../abi/SyphonAddresses.json";
import { useGetBorrowRate } from "../hooks/Irm.js";
import arrow from "../assets/icons/arrow-down-3101.svg";
import { formatEther } from "viem";
import NavBtn from "../components/low-level/NavBtn.js";
import { useWithdraw } from "../hooks/Syphon.js";

const MarketPage = () => {
  const { id } = useParams();
  console.log(id);

  const navigate = useNavigate();

  const addressToToken = getReverseTokens(Tokens);

  const chainId = useChainId();
  console.log("chainId:", chainId);

  const contractAddresses = syphonAddresses as Record<number, string>;

  const syphonAddress = contractAddresses[chainId];

  const { withdraw } = useWithdraw(syphonAddress);

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
      {/* navigate back part */}

      <div
        onClick={() => navigate("/markets")}
        className="flex items-center cursor-pointer gap-[8px]"
      >
        <img src={arrow} alt="" className="w-[12px] rotate-90" />
        <p className="text-[14px] text-gray-400">Markets </p>
      </div>

      {/* main part */}
      <div className="w-full flex flex-col gap-[56px]">
        {/* info part */}
        <div className="w-full flex flex-col gap-[48px]">
          <div className="flex items-center gap-[16px]">
            <div className="flex items-center gap-[10px]">
              <img
                src={`../../public/tokens/${addressToToken[marketParams.collateralToken]}.svg`}
                alt=""
                className="w-[48px]"
              />
              <p className="text-[24px]">
                {addressToToken[marketParams.collateralToken]}
              </p>
            </div>
            <p className="text-[36px] font-semibold">/</p>
            <div className="flex items-center gap-[10px]">
              <img
                src={`../../public/tokens/${addressToToken[marketParams.loanToken]}.svg`}
                alt=""
                className="w-[48px]"
              />
              <p className="text-[24px]">
                {addressToToken[marketParams.loanToken]}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-[12px]">
              <p className="text-[16px]">Total Market size</p>
              <p className="text-[24px]">
                $
                {Number(
                  formatEther(
                    marketInfo.totalSupplyAssets + marketInfo.totalBorrowAssets,
                  ),
                ).toFixed(2)}
              </p>
            </div>
            <div className="flex flex-col gap-[12px]">
              <p className="text-[16px]">Total liquidity</p>
              <p className="text-[24px]">
                ${Number(formatEther(marketInfo.totalSupplyAssets)).toFixed(2)}
              </p>
            </div>
            <div className="flex flex-col gap-[12px]">
              <p className="text-[16px]">Rate</p>
              <p className="text-[24px]">
                {(BigInt(borrowRate) * BigInt(100)) / BigInt(1e18)}%
              </p>
            </div>
            <div className="flex flex-col gap-[12px]">
              <p className="text-[16px]">ltv</p>
              <p className="text-[24px]">
                {(BigInt(marketParams.lltv) * BigInt(100)) / BigInt(1e18)}%
              </p>
            </div>
          </div>
        </div>
        {/* borrow and supply part */}
        <div className="flex items-center gap-[48px]">
          {/* borrow */}
          <div>
            <div>
              <NavBtn to={`/markets/borrow/${id}`} text="borrow" />
            </div>
          </div>
          {/* supply */}
          <div>
            <div>
              <NavBtn to={`/markets/supply/${id}`} text="supply" />
            </div>
          </div>
          <button
            onClick={() => withdraw(marketParams, id, 10e18, 0)}
            className="p-[12px] cursor-pointer bg-blue-600 rounded-full"
          >
            Withdraw
          </button>
        </div>
      </div>
    </div>
  );
};

export default MarketPage;
