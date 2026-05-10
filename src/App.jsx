import { BrowserRouter as Router } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { Analytics } from "@vercel/analytics/react";
import AppContent from "./components/AppContent";
function App() {
  return (
    <>
      <Toaster position="top-right" />
      <Analytics />
      <Router>
        <AppContent />
      </Router>
    </>
  );
}

export default App;
