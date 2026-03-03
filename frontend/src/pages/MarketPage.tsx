import { useNavigate, useParams } from "react-router-dom";
import { getReverseTokens } from "../utils/utils.js";
import Tokens from "../abi/tokenToAddress.json";
import { useGetMarketInfo, useGetMarketParams } from "../hooks/Syphon.js";
import { useChainId } from "wagmi";
import syphonAddresses from "../abi/SyphonAddresses.json";
import { useGetBorrowRate } from "../hooks/Irm.js";
import { isHex, padHex, stringToHex, toHex } from "viem";

const MarketPage = () => {
  const { id } = useParams();
  console.log(id);

  let bytes32Id: `0x${string}` | undefined;

  if (id) {
    if (isHex(id)) {
      // id is already a hex string, just pad it to 32 bytes
      bytes32Id = padHex(id, { size: 32 });
    } else {
      // id is a plain string, encode it
      bytes32Id = stringToHex(id, { size: 32 });
    }
  }

  const navigate = useNavigate();

  const addressToToken = getReverseTokens(Tokens);

  const chainId = useChainId();
  console.log("chainId:", chainId);

  const contractAddresses = syphonAddresses as Record<number, string>;

  const syphonAddress = contractAddresses[chainId];

  const {
    marketInfo,
    isLoading: isLoadingMarketInfo,
    error: errorMarketInfo,
  } = useGetMarketInfo(syphonAddress, bytes32Id);

  const {
    marketParams,
    isLoading: isLoadingMarketParams,
    error: errorMarketParams,
  } = useGetMarketParams(syphonAddress, bytes32Id);

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

  return <div>This is market page</div>;
};

export default MarketPage;
