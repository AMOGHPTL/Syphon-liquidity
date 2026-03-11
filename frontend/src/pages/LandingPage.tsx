import { useNavigate } from "react-router-dom";
import logo from "../assets/icons/pool-sports-swimmer-svgrepo-com.svg";
import RollingBelt from "../components/RollingBelt";
import CyclingCards from "../components/RollingBelt";
import NavBtn from "../components/low-level/NavBtn";
import { useFaucetTokens } from "../hooks/erc20.js";

const LandingPage = () => {
  const { claimTokens } = useFaucetTokens();
  return (
    <div className="flex flex-col items-center pt-[32px]">
      <div className="flex flex-col gap-[48px] items-center max-w-[45%]">
        <div className="flex flex-col gap-[36px] items-center">
          <div className="flex gap-[4px]">
            <img src={logo} alt="" className="w-[32px]" />
            <p className="text-[32px]">Syphon</p>
          </div>
          <div className="flex flex-col gap-[24px]">
            <p className="text-[48px] text-center font-500">
              Supply, Borrow and EARN with ease
            </p>
            <p className="text-[14px] text-gray-300 text-center">
              Syphon offers you to earn best yields on your supplies and low
              borrow rates to borrow with your selective collateral token, With
              individual pool mitigate risk and enjoy safe lending and borrowing
            </p>
          </div>
        </div>

        <div className="flex items-center gap-[48px]">
          <div
            onClick={claimTokens}
            className="p-[12px] rounded-full bg-blue-600 cursor-pointer hover:bg-white hover:text-black"
          >
            Claim Tokens
          </div>
          <NavBtn to="/markets" text="Launch app" />
        </div>
        <div>
          <RollingBelt />
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
