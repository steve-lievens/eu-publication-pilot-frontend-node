import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import WelcomePage from "./pages/WelcomePage";
import PromptTesting from "./pages/PromptTesting";
import AppHeader from "./components/AppHeader";
import StartAnalysis from "./pages/StartAnalysis";
import ConcordanceCheck from "./pages/ConcordanceCheck";
import ConcordanceCheck2 from "./pages/ConcordanceCheck2";
import ConcordanceCheck3 from "./pages/ConcordanceCheck3";
const App: React.FC = () => (
  <BrowserRouter>
    <AppHeader />
    <Routes>
      <Route path="/" element={<WelcomePage />} />
      <Route path="/prompttest" element={<PromptTesting />} />
      <Route path="/start" element={<StartAnalysis />} />
      <Route path="/concordance-check" element={<ConcordanceCheck />} />
      <Route path="/concordance-check-2" element={<ConcordanceCheck2 />} />
      <Route path="/concordance-check-3" element={<ConcordanceCheck3 />} />
    </Routes>
  </BrowserRouter>
);

export default App;
