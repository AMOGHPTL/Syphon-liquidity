import NavBtn from "../components/low-level/NavBtn";

const MarketsPage = () => {
  return (
    <div className="flex flex-col gap-[48px]">
      <div className="flex flex-col gap-[24px]">
        <p className="text-[24px]">Create Market</p>
        <div>
          <NavBtn to="/createMarket" text="create" />
        </div>
      </div>
      <div>
        <p className="text-[32px]">Markets</p>
      </div>
    </div>
  );
};

export default MarketsPage;
