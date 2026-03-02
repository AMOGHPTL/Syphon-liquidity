import { useNavigate } from "react-router-dom";
import logo from "../assets/icons/pool-sports-swimmer-svgrepo-com.svg";
import RollingBelt from "../components/RollingBelt";
import CyclingCards from "../components/RollingBelt";
import NavBtn from "../components/low-level/NavBtn";

const LandingPage = () => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center py-[32px]">
      <div className="flex flex-col gap-[72px] items-center max-w-[50%]">
        <div className="flex gap-[4px]">
          <img src={logo} alt="" className="w-[32px]" />
          <p className="text-[32px]">Syphon</p>
        </div>
        <div className="flex flex-col gap-[24px]">
          <p className="text-[48px] font-500">
            Supply, Borrow and EARN with ease
          </p>

          <p className="text-[14px] text-gray-300 text-center">
            Syphon offers you to earn best yields on your supplies and low
            borrow rates to borrow with your selective collateral token, With
            individual pool mitigate risk and enjoy safe lending and borrowing
          </p>
        </div>
        <div>
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
