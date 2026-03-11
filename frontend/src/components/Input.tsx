import { parseEther, formatEther } from "viem";
import { useGetERC20Balance } from "../hooks/erc20.js";
import { useEffect, useState } from "react";

const Input = ({
  inputAmount,
  setInputAmount,
  token,
  max,
  price,
}: {
  inputAmount: bigint;
  setInputAmount: React.Dispatch<React.SetStateAction<bigint>>;
  token?: string;
  max?: bigint;
  price?: bigint;
}) => {
  const [displayValue, setDisplayValue] = useState(""); // ADD THIS

  useEffect(() => {
    if (inputAmount === 0n) setDisplayValue("");
  }, [inputAmount]);

  const formattedBalance = max ? Number(formatEther(max)).toFixed(2) : "0.00";

  return (
    <div className="flex flex-col gap-[12px]">
      <input
        type="number"
        value={displayValue} // USE displayValue
        onChange={(e) => {
          const value = e.target.value;
          setDisplayValue(value); // store raw string as-is
          if (!value || isNaN(Number(value))) {
            setInputAmount(0n);
            return;
          }
          try {
            setInputAmount(parseEther(value)); // use parseEther instead of manual BigInt math
          } catch {
            setInputAmount(0n);
          }
        }}
        placeholder="0.00"
        className="text-[24px] px-[10px] py-[14px] rounded-xl outline-none"
      />

      <div className="flex items-center justify-between">
        <p>
          $
          {price
            ? formatEther(BigInt(displayValue) * BigInt(price))
            : displayValue || "0.00"}
        </p>

        <p
          onClick={() => {
            if (max) {
              setInputAmount(max);
              setDisplayValue(formatEther(max)); // sync display on max click
            }
          }}
          className="cursor-pointer"
        >
          {formattedBalance} max
        </p>
      </div>
    </div>
  );
};

export default Input;
