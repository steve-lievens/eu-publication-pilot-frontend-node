import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import WelcomePage from "./pages/WelcomePage";
import PromptTesting from "./pages/PromptTesting";
import AppHeader from "./components/AppHeader";
import UploadFiles from "./pages/UploadFiles";
import ConcordanceCheck from "./pages/ConcordanceCheck";

const App: React.FC = () => (
  <BrowserRouter>
    <AppHeader />
    <Routes>
      <Route path="/" element={<WelcomePage />} />
      <Route path="/prompttest" element={<PromptTesting />} />
      <Route path="/newcheck" element={<UploadFiles />} />
      <Route path="/concordance-check" element={<ConcordanceCheck />} />
    </Routes>
  </BrowserRouter>
);

export default App;
