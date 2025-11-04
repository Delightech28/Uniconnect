import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import UniConnectLandingPage from "./components/UniConnectLandingPage";
import UniConnectRegistration from "./components/UniConnectRegistration";
import StudentVerificationPage from "./components/StudentVerificationPage";
import VerificationPendingPage from "./components/VerificationPendingPage";
import VerificationCompletePage from "./components/VerificationCompletePage";
import VerificationFailedPage from "./components/VerificationFailedPage";
import HelpAndSupportPage from "./components/HelpAndSupportPage";
import ReuploadVerificationPage from "./components/ReuploadVerificationPage";
import UniConnectLogin from "./components/UniConnectLogin";
import GuestWelcomePage from "./components/GuestWelcomePage";
import UniConnectDashboard from "./components/UniConnectDashboard";
import GuestDashboard from "./components/GuestDashboard";
import NotificationsPage from "./components/NotificationsPage";
import UniMarketPage from "./components/UniMarketPage";
import SellItemPage from "./components/SellItemPage";
import MyListingsPage from "./components/MyListingPage";
import StudyHubPage from "./components/StudyHubPage";
import QuizPage from "./components/QuizPage";
import DocumentInfo from "./components/DocumentInfo";
import ChatInterface from "./components/ChatInterface";
import QuizResultsPage from "./components/QuizResultsPage";
import UniWalletPage from "./components/UniWalletPage";
import WalletPage from "./components/WalletPage";
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<UniConnectLandingPage />} />
        <Route path="/signup" element={<UniConnectRegistration />} />
        <Route path="/verify-student" element={<StudentVerificationPage />} />
        <Route path="/verification-pending" element={<VerificationPendingPage />} />
        <Route path="/verification-complete" element={<VerificationCompletePage />} />
        <Route path="/verification-failed" element={<VerificationFailedPage />} />
        <Route path="/help-support" element={<HelpAndSupportPage />} />
        <Route path="/reupload-verification" element={<ReuploadVerificationPage />} />
        <Route path="/login" element={<UniConnectLogin />} />
        <Route path="/guest-welcome" element={<GuestWelcomePage />} />
        <Route path="/dashboard" element={<UniConnectDashboard />} />
        <Route path="/guest-dashboard" element={<GuestDashboard />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/unimarket" element={<UniMarketPage />} />
        <Route path="/sell-item" element={<SellItemPage />} />
        <Route path="/my-listings" element={<MyListingsPage />} />
        <Route path="/study-hub" element={<StudyHubPage />} />
        <Route path="/quiz" element={<QuizPage />} />
        <Route path="/document-info" element={<DocumentInfo />} />
        <Route path="/chat-interface" element={<ChatInterface />} />
        <Route path="/quiz-results" element={<QuizResultsPage />} />
        <Route path="/uni-wallet" element={<UniWalletPage />} />
        <Route path="/wallet" element={<WalletPage />} />
      </Routes>
    </Router>
  );
}

export default App;
