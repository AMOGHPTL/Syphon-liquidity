import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Link } from "react-router-dom";
import logo from "../assets/icons/pool-sports-swimmer-svgrepo-com.svg";

const Navbar = () => {
  return (
    <div className="flex items-center text-gray-400 justify-between py-[12px] px-[30px] ">
      {" "}
      <div>
        <img src={logo} alt="" className="w-[36px]" />
      </div>
      <div className="flex gap-[40px] items-center">
        {" "}
        <Link to={"/dashboard"}>Dashboard</Link>
        <Link to={"/markets"}>Markets</Link>
        <Link to={"/"}>About</Link>
      </div>
      <div className="h-[60px] w-fit flex items-center">
        <ConnectButton />
      </div>
    </div>
  );
};

export default Navbar;
