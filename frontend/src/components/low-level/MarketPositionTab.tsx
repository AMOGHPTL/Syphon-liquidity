import type { Hex } from "viem";
import NavBtn from "./NavBtn";
import { token } from "viem/tempo/actions";

const MarketPositionTab = ({
  id,
  title,
  value,
  path,
  token,
  price,
}: {
  id?: string;
  title: string;
  value: string;
  path: string;
  token: string;
  price?: bigint;
}) => {
  return (
    <div className="grid grid-cols-[25%_25%_15%_15%_20%] items-center bg-white/5 p-[16px] rounded-2xl">
      <p className="text-[18px]">{title}</p>
      <div className="flex items-center gap-[6px]">
        <img
          src={`../../../public/tokens/${token}.svg`}
          alt=""
          className="w-[24px]"
        />
        <p className="text-[18px]">{token}</p>
      </div>
      <p className="text-[18px]">
        {Number(value).toFixed(2)}
      </p>
      <p className="text-[18px]">
        ${price ? (Number(BigInt(Math.floor(Number(value))) * price)/1e18).toFixed(2) : Number(value).toFixed(2)}
      </p>

      {/* <NavBtn text={path1} to={`/markets/${path1}/${id}`} /> */}
      <NavBtn text={path} to={`/markets/${path}/${id}`} />
    </div>
  );
};

export default MarketPositionTab;
