import "./App.css";
import { Routes, Route, useLocation } from "react-router-dom";
import MarketsPage from "./pages/MarketsPage";
import LandingPage from "./pages/LandingPage";
import Navbar from "./components/Navbar";
import DashboardPage from "./pages/DashboardPage";
import MarketPage from "./pages/MarketPage";

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
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/markets/market/:id" element={<MarketPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
