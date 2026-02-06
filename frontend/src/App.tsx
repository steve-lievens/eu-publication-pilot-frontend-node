import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import WelcomePage from "./pages/WelcomePage";
import PromptTesting from "./pages/PromptTesting";
import AppHeader from "./components/AppHeader";
import StartAnalysis from "./pages/StartAnalysis";
import ConcordanceCheck from "./pages/ConcordanceCheck";
import ConcordanceCheck2 from "./pages/ConcordanceCheck2";
import ConcordanceCheck3 from "./pages/ConcordanceCheck3";
import ConcordanceCheck3b from "./pages/ConcordanceCheck3b";
import FeedbackList from "./pages/ViewFeedback";
import TestGenerator from "./pages/TestGenerator";

const appVersion = "1.8.5";

const App: React.FC = () => (
  <BrowserRouter>
    <AppHeader version={appVersion} />
    <Routes>
      <Route path="/" element={<WelcomePage />} />
      <Route path="/prompttest" element={<PromptTesting />} />
      <Route path="/start" element={<StartAnalysis />} />
      <Route path="/concordance-check" element={<ConcordanceCheck />} />
      <Route path="/concordance-check-2" element={<ConcordanceCheck2 />} />
      <Route path="/concordance-check-3" element={<ConcordanceCheck3 />} />
      <Route path="/feedback/:feedbackId" element={<FeedbackList />} />
      <Route path="/testgen" element={<TestGenerator />} />
      <Route
        path="/concordance-check-3b"
        element={<ConcordanceCheck3b version={appVersion} />}
      />
    </Routes>
  </BrowserRouter>
);

export default App;
