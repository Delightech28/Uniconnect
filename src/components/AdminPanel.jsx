import React, { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  onSnapshot,
  orderBy,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import AppHeader from "./AppHeader";
import { useTheme } from "../hooks/useTheme";
import Footer from "./Footer";
import { Check, X, Eye, User, MessageSquare } from "lucide-react";
import toast from "react-hot-toast";

const AdminPanel = () => {
  const navigate = useNavigate();
  const { darkMode, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState("verifications");
  const [pendingUsers, setPendingUsers] = useState([]);
  const [userFeedback, setUserFeedback] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is admin
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        navigate("/login");
        return;
      }

      // Check if user is admin
      try {
        const userDoc = await getDocs(
          query(collection(db, "users"), where("email", "==", user.email)),
        );
        if (!userDoc.empty) {
          const userData = userDoc.docs[0].data();
          if (userData.role !== "admin") {
            toast.error("Access denied. Admin privileges required.");
            navigate("/");
            return;
          }
        } else {
          toast.error("User not found.");
          navigate("/");
          return;
        }
      } catch (error) {
        console.error("Error checking admin access:", error);
        toast.error("Error verifying admin access.");
        navigate("/");
        return;
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    // Listen for pending users (exclude declined ones)
    const q = query(
      collection(db, "users"),
      where("verified", "==", false),
      orderBy("createdAt", "desc"),
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const users = [];
        querySnapshot.forEach((doc) => {
          const userData = doc.data();
          // Only include if not declined
          if (userData.verificationStatus !== "declined") {
            users.push({ id: doc.id, ...userData });
          }
        });
        setPendingUsers(users);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching pending users:", error);
        toast.error("Error loading pending users.");
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Listen for user feedback/contact submissions
    const q = query(
      collection(db, "contactSubmissions"),
      orderBy("createdAt", "desc"),
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const feedback = [];
        querySnapshot.forEach((doc) => {
          feedback.push({ id: doc.id, ...doc.data() });
        });
        setUserFeedback(feedback);
      },
      (error) => {
        console.error("Error fetching user feedback:", error);
      },
    );

    return () => unsubscribe();
  }, []);

  const handleApprove = async (userId) => {
    try {
      await updateDoc(doc(db, "users", userId), {
        verified: true,
        verifiedAt: new Date(),
        verifiedBy: auth.currentUser.uid,
      });
      toast.success("User approved successfully!");
    } catch (error) {
      console.error("Error approving user:", error);
      toast.error("Error approving user.");
    }
  };

  const handleDecline = async (userId) => {
    try {
      await updateDoc(doc(db, "users", userId), {
        verified: false,
        verificationStatus: "declined",
        declinedAt: new Date(),
        declinedBy: auth.currentUser.uid,
      });
      toast.success("User declined successfully!");
    } catch (error) {
      console.error("Error declining user:", error);
      toast.error("Error declining user.");
    }
  };

  if (loading) {
    return (
      <div className="bg-background-light dark:bg-background-dark min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-secondary dark:text-white">
            Loading admin panel...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen">
      {/* Dark Mode Toggle */}
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={() => toggleTheme()}
          className="flex items-center justify-center size-12 rounded-full bg-white dark:bg-gray-800 shadow-md text-slate-700 dark:text-slate-200"
          aria-label="Toggle dark mode"
        >
          <span className="material-symbols-outlined">
            {darkMode ? "light_mode" : "dark_mode"}
          </span>
        </button>
      </div>

      <AppHeader darkMode={darkMode} toggleDarkMode={toggleTheme} />

      <main className="pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-secondary dark:text-white mb-2">
              Admin Panel
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage user verification requests and feedback
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-4 mb-8 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab("verifications")}
              className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                activeTab === "verifications"
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300"
              }`}
            >
              <div className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Pending Verifications ({pendingUsers.length})
              </div>
            </button>
            <button
              onClick={() => setActiveTab("feedback")}
              className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                activeTab === "feedback"
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300"
              }`}
            >
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                User Feedback ({userFeedback.length})
              </div>
            </button>
          </div>

          {/* Verifications Tab */}
          {activeTab === "verifications" && (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Pending Approvals
                      </p>
                      <p className="text-2xl font-bold text-secondary dark:text-white">
                        {pendingUsers.length}
                      </p>
                    </div>
                    <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-full">
                      <User className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Pending Users Table */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-semibold text-secondary dark:text-white">
                    Pending Verifications
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Users awaiting approval
                  </p>
                </div>

                {pendingUsers.length === 0 ? (
                  <div className="p-8 text-center">
                    <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">
                      No pending verifications
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            User
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Email
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            University
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Document
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {pendingUsers.map((user) => (
                          <tr
                            key={user.id}
                            className="hover:bg-gray-50 dark:hover:bg-gray-700"
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10">
                                  <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                      {user.displayName
                                        ?.charAt(0)
                                        ?.toUpperCase() || "U"}
                                    </span>
                                  </div>
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-secondary dark:text-white">
                                    {user.displayName || "N/A"}
                                  </div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400">
                                    @{user.username || "N/A"}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-secondary dark:text-white">
                                {user.email || "N/A"}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-secondary dark:text-white">
                                {user.institution || "N/A"}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {user.fileDataUrl ? (
                                <a
                                  href={user.fileDataUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1"
                                  title="View document"
                                >
                                  <Eye className="h-5 w-5" />
                                  View
                                </a>
                              ) : user.verificationDocumentURL ? (
                                <a
                                  href={user.verificationDocumentURL}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1"
                                  title="View document"
                                >
                                  <Eye className="h-5 w-5" />
                                  View
                                </a>
                              ) : (
                                <span className="text-gray-400">
                                  No document
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleApprove(user.id)}
                                  className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                                >
                                  <Check className="h-5 w-5" />
                                </button>
                                <button
                                  onClick={() => handleDecline(user.id)}
                                  className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                >
                                  <X className="h-5 w-5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Feedback Tab */}
          {activeTab === "feedback" && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-secondary dark:text-white">
                  User Feedback & Support Requests
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Messages from users
                </p>
              </div>

              {userFeedback.length === 0 ? (
                <div className="p-8 text-center">
                  <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    No feedback yet
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {userFeedback.map((feedback) => (
                    <div
                      key={feedback.id}
                      className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="mb-3">
                        <h3 className="text-sm font-semibold text-secondary dark:text-white">
                          {feedback.name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {feedback.email}
                        </p>
                      </div>
                      <div className="mb-3">
                        <h4 className="text-sm font-medium text-secondary dark:text-white mb-1">
                          Subject: {feedback.subject}
                        </h4>
                        <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 p-3 rounded">
                          {feedback.message}
                        </p>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {feedback.createdAt
                            ? new Date(
                                feedback.createdAt.toDate(),
                              ).toLocaleString()
                            : "N/A"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer darkMode={darkMode} />
    </div>
  );
};

export default AdminPanel;
