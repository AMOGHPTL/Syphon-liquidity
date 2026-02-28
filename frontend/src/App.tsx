import "./App.css";
import { Routes, Route } from "react-router-dom";
import MarketsPage from "./pages/MarketsPage";
import LandingPage from "./pages/LandingPage";

function App() {
  return (
    <div className="min-h-[100vh]">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/markets" element={<MarketsPage />} />
      </Routes>
    </div>
  );
}

export default App;
