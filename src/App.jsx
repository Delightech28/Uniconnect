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
import CreatePostPage from "./components/CreatePostPage";
import TransactionHistory from "./components/TransactionHistory";
import ProductDetailsPage from "./components/ProductDetailsPage";
import InboxPage from "./components/InboxPage";
import Header from "./components/Header";
import EditProfilePage from "./components/EditProfilePage";
import SettingsPage from "./components/SettingsPage";
import ChangePasswordPage from "./components/ChangePasswordPage";
import ChangeEmailPage from "./components/ChangeEmailPage";
import StudentReferral from "./components/StudentReferral";
import ReferralReward from "./components/ReferralReward";
import UniConnectWelcome from "./components/UniConnectWelcome";

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
        <Route path="/create-post" element={<CreatePostPage />} />
        <Route path="/transaction-history" element={<TransactionHistory />} />
        <Route path="/product-details" element={<ProductDetailsPage />} /> 
        <Route path="/inbox" element={<InboxPage />} />
        <Route path="/header" element={<Header />} />
        <Route path="/edit-profile" element={<EditProfilePage />} />
        <Route path="/settings" element={<SettingsPage />} /> 
        <Route path="/change-password" element={<ChangePasswordPage />} />
        <Route path="/change-email" element={<ChangeEmailPage />} />
        <Route path="/student-referral" element={<StudentReferral />} />
        <Route path="/referral-reward" element={<ReferralReward />} />
        <Route path="/welcome" element={<UniConnectWelcome />} />
      </Routes>
    </Router>
  );
}

export default App;
