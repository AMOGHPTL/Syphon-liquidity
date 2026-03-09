import "./App.css";
import { Routes, Route, useLocation } from "react-router-dom";
import MarketsPage from "./pages/MarketsPage";
import LandingPage from "./pages/LandingPage";
import Navbar from "./components/Navbar";
import DashboardPage from "./pages/DashboardPage";
import MarketPage from "./pages/MarketPage";
import BorrowPage from "./pages/BorrowPage";
import SupplyPage from "./pages/SupplyPage";
import { Toaster } from "react-hot-toast";
import WithdrawPage from "./pages/WithdrawPage";
import WithdrawCollateralPage from "./pages/WithdrawCollateralPage";
import RepayPage from "./pages/RepayPage";
import LiquidatePage from "./pages/LiquidatePage";

function App() {
  const location = useLocation();
  const showNavbar = location.pathname !== "/";

  return (
    <div>
      <Toaster position="top-right" />
      <Routes>
        <Route />
      </Routes>
      {showNavbar && <Navbar />}
      <main className="min-h-[100vh] px-[80px] py-[20px]">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/markets" element={<MarketsPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/liquidate" element={<LiquidatePage />} />
          <Route path="/markets/market/:id" element={<MarketPage />} />
          <Route path="/markets/borrow/:id" element={<BorrowPage />} />
          <Route path="markets/supply/:id" element={<SupplyPage />} />
          <Route path="/markets/withdraw/:id" element={<WithdrawPage />} />
          <Route
            path="/markets/withdrawCollateral/:id"
            element={<WithdrawCollateralPage />}
          />
          <Route path="/markets/repay/:id" element={<RepayPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
