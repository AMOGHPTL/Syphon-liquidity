const DashboardPage = () => {
  return (
    <div className="flex flex-col gap-[40px]">
      <div>
        <p className="text-[48px]">Dashboard</p>
      </div>
      <div className="">
        <div className="flex items-center gap-[20px]">
          <p className="text-[32px]">Supply</p>
          <p className="text-[32px]">Collateral</p>
          <p className="text-[32px]">Borrow</p>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
