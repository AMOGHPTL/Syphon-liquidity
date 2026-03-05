import { parseEther, formatEther } from "viem";
import { useGetERC20Balance } from "../hooks/erc20.js";
import { useEffect, useState } from "react";

const Input = ({
  inputAmount,
  setInputAmount,
  token,
}: {
  inputAmount: bigint;
  setInputAmount: React.Dispatch<React.SetStateAction<bigint>>;
  token: string;
}) => {
  const [displayValue, setDisplayValue] = useState(""); // ADD THIS
  const { data: tokenBalance, isLoading } = useGetERC20Balance(token);

  useEffect(() => {
    if (inputAmount === 0n) setDisplayValue("");
  }, [inputAmount]);

  if (isLoading) return <div>Loading balance....</div>;

  const formattedBalance = tokenBalance
    ? Number(formatEther(tokenBalance)).toFixed(2)
    : "0.00";

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
        <p>${displayValue || "0.00"}</p>

        <p
          onClick={() => {
            if (tokenBalance) {
              setInputAmount(tokenBalance);
              setDisplayValue(formatEther(tokenBalance)); // sync display on max click
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
