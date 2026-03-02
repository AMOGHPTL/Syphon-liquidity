import "./App.css";
import { Routes, Route, useLocation } from "react-router-dom";
import MarketsPage from "./pages/MarketsPage";
import LandingPage from "./pages/LandingPage";
import Navbar from "./components/Navbar";
import { useState } from "react";
import DashboardPage from "./pages/DashboardPage";
import MarketPage from "./pages/MarketPage";
import BorrowPage from "./pages/BorrowPage";
import SupplyPage from "./pages/SupplyPage";
import CreateMarketPage from "./pages/CreateMarketPage";

function App() {
  const location = useLocation();
  const showNavbar = location.pathname !== "/";
  return (
    <div>
      <Routes>
        <Route />
      </Routes>
      {showNavbar && <Navbar />}
      <main className="min-h-[100vh] px-[80px] py-[20px]">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/markets" element={<MarketsPage />} />
          <Route path="/createMarket" element={<CreateMarketPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/market/:id" element={<MarketPage />} />
          <Route path="/borrow/:id" element={<BorrowPage />} />
          <Route path="/supply/:id" element={<SupplyPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
