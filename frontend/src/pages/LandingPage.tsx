import logo from "../assets/icons/pool-sports-swimmer-svgrepo-com.svg";
import RollingBelt from "../components/RollingBelt";
import CyclingCards from "../components/RollingBelt";

const LandingPage = () => {
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
          <button className="px-[16px] py-[12px] cursor-pointer rounded-full bg-blue-600">
            Launch App
          </button>
        </div>
        <div>
          <RollingBelt />
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
