import { useNavigate } from "react-router-dom";

const NavBtn = ({ to, text }: { to: string; text: string }) => {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(to)}
      className="px-[16px] py-[12px] cursor-pointer rounded-full bg-blue-600 hover:bg-white hover:text-black"
    >
      {text}
    </button>
  );
};

export default NavBtn;
