import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../hooks/useTheme";
import AppHeader from "./AppHeader";
import { db, functions } from "../firebase";
import {
  doc,
  setDoc,
  query,
  collection,
  where,
  getDocs,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import emailjs from "@emailjs/browser";
import toast from "react-hot-toast";

// Initialize EmailJS
emailjs.init(import.meta.env.VITE_EMAILJS_PUBLIC_KEY);

const ForgotPasswordPage = () => {
  const { darkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // Step 1: Email verification
  const [email, setEmail] = useState("");
  const [step, setStep] = useState(1); // 1: email, 2: code verification, 3: new password
  const [loading, setLoading] = useState(false);

  // Step 2: Code verification
  const [codeInputs, setCodeInputs] = useState(["", "", "", "", "", ""]);
  const [generatedCode, setGeneratedCode] = useState("");

  // Step 3: New password
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Step 1: Send verification code to email
  const handleSendCode = async (e) => {
    e.preventDefault();

    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    setLoading(true);
    try {
      // Generate 6-digit code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedCode(code);

      // Check if user exists in Firestore
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", email));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        toast.error("No account found with this email address");
        setLoading(false);
        return;
      }

      // Store password reset request in Firestore
      const resetDocId = `reset_${Date.now()}`;
      await setDoc(doc(db, "passwordResets", resetDocId), {
        email: email,
        code: code,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
        used: false,
      });

      // Send code via EmailJS
      await emailjs.send(
        import.meta.env.VITE_EMAILJS_SERVICE_ID,
        import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
        {
          to_email: email,
          reset_code: code,
          code_digit_1: code[0],
          code_digit_2: code[1],
          code_digit_3: code[2],
          code_digit_4: code[3],
          code_digit_5: code[4],
          code_digit_6: code[5],
        },
      );

      toast.success("Verification code sent to your email!");
      setStep(2);
    } catch (error) {
      console.error("Error sending code:", error);
      toast.error("Failed to send verification code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify code
  const handleCodeChange = (e, index) => {
    const value = e.target.value;

    if (!/^\d*$/.test(value)) return; // Only allow numbers
    if (value.length > 1) return; // Only single digit

    const newCodeInputs = [...codeInputs];
    newCodeInputs[index] = value;
    setCodeInputs(newCodeInputs);

    // Auto-focus next input
    if (value && index < 5) {
      document.getElementById(`code-input-${index + 1}`).focus();
    }
  };

  const handleCodeBackspace = (e, index) => {
    if (e.key === "Backspace" && !codeInputs[index] && index > 0) {
      document.getElementById(`code-input-${index - 1}`).focus();
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();

    const enteredCode = codeInputs.join("");

    if (enteredCode.length !== 6) {
      toast.error("Please enter all 6 digits");
      return;
    }

    if (enteredCode === generatedCode) {
      toast.success("Code verified!");
      setStep(3);
    } else {
      toast.error("Invalid verification code");
      setCodeInputs(["", "", "", "", "", ""]);
    }
  };

  // Step 3: Reset password
  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (!newPassword || !confirmPassword) {
      toast.error("Please enter both passwords");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      // Call the Cloud Function to reset password
      const resetPasswordFn = httpsCallable(functions, "resetPasswordWithCode");
      const result = await resetPasswordFn({
        email,
        code: generatedCode,
        newPassword,
      });

      toast.success("Password reset successfully! Redirecting to login...");
      setTimeout(() => navigate("/login"), 2000);
    } catch (error) {
      console.error("Error resetting password:", error);
      const errorMessage = error.message || "Failed to reset password";

      if (errorMessage.includes("Invalid or expired")) {
        toast.error("Invalid or expired reset code");
      } else if (errorMessage.includes("expired")) {
        toast.error("Reset code has expired. Please request a new one.");
      } else if (errorMessage.includes("at least 6")) {
        toast.error("Password must be at least 6 characters");
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen ${darkMode ? "bg-background-dark" : "bg-background-light"}`}
    >
      <AppHeader darkMode={darkMode} toggleDarkMode={toggleTheme} />

      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] px-4">
        <div className="w-full max-w-md">
          {/* Card */}
          <div
            className={`${darkMode ? "bg-gray-800" : "bg-white"} rounded-xl shadow-lg p-8`}
          >
            <h1
              className={`text-3xl font-bold mb-2 text-center ${darkMode ? "text-white" : "text-gray-900"}`}
            >
              Reset Password
            </h1>
            <p
              className={`text-center mb-8 ${darkMode ? "text-gray-400" : "text-gray-600"}`}
            >
              {step === 1 && "Enter your email to receive a verification code"}
              {step === 2 && "Enter the 6-digit code sent to your email"}
              {step === 3 && "Create a new password"}
            </p>

            {/* Step 1: Email */}
            {step === 1 && (
              <form onSubmit={handleSendCode} className="space-y-4">
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                  >
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className={`w-full px-4 py-2 rounded-lg border ${
                      darkMode
                        ? "bg-gray-700 border-gray-600 text-white"
                        : "bg-white border-gray-300 text-gray-900"
                    } focus:outline-none focus:ring-2 focus:ring-primary`}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 disabled:opacity-50"
                >
                  {loading ? "Sending..." : "Send Verification Code"}
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className={`w-full py-2 rounded-lg border font-medium transition-colors ${
                    darkMode
                      ? "border-gray-600 text-gray-300 hover:bg-gray-700"
                      : "border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Back to Login
                </button>
              </form>
            )}

            {/* Step 2: Code Verification */}
            {step === 2 && (
              <form onSubmit={handleVerifyCode} className="space-y-6">
                <div>
                  <label
                    className={`block text-sm font-medium mb-4 text-center ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                  >
                    Enter 6-Digit Code
                  </label>
                  <div className="flex gap-2 justify-center mb-6">
                    {codeInputs.map((digit, index) => (
                      <input
                        key={index}
                        id={`code-input-${index}`}
                        type="text"
                        inputMode="numeric"
                        maxLength="1"
                        value={digit}
                        onChange={(e) => handleCodeChange(e, index)}
                        onKeyDown={(e) => handleCodeBackspace(e, index)}
                        className={`w-12 h-14 text-center text-2xl font-bold rounded-lg border-2 ${
                          darkMode
                            ? "bg-gray-700 border-gray-600 text-white"
                            : "bg-white border-gray-300 text-gray-900"
                        } focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary`}
                      />
                    ))}
                  </div>
                  <p
                    className={`text-sm text-center ${darkMode ? "text-gray-400" : "text-gray-600"}`}
                  >
                    Code sent to {email}
                  </p>
                </div>
                <button
                  type="submit"
                  className="w-full py-2 bg-primary text-white font-bold rounded-lg hover:bg-primary/90"
                >
                  Verify Code
                </button>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className={`w-full py-2 rounded-lg border font-medium transition-colors ${
                    darkMode
                      ? "border-gray-600 text-gray-300 hover:bg-gray-700"
                      : "border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Back
                </button>
              </form>
            )}

            {/* Step 3: New Password */}
            {step === 3 && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                  >
                    New Password
                  </label>
                  <div className="flex">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className={`flex-1 px-4 py-2 rounded-l-lg border ${
                        darkMode
                          ? "bg-gray-700 border-gray-600 text-white"
                          : "bg-white border-gray-300 text-gray-900"
                      } focus:outline-none focus:ring-2 focus:ring-primary`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={`px-4 border ${
                        darkMode
                          ? "bg-gray-700 border-gray-600 text-gray-300"
                          : "bg-white border-gray-300 text-gray-700"
                      } rounded-r-lg`}
                    >
                      <span className="material-symbols-outlined">
                        {showPassword ? "visibility_off" : "visibility"}
                      </span>
                    </button>
                  </div>
                </div>

                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                  >
                    Confirm Password
                  </label>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className={`w-full px-4 py-2 rounded-lg border ${
                      darkMode
                        ? "bg-gray-700 border-gray-600 text-white"
                        : "bg-white border-gray-300 text-gray-900"
                    } focus:outline-none focus:ring-2 focus:ring-primary`}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 disabled:opacity-50"
                >
                  {loading ? "Resetting..." : "Reset Password"}
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className={`w-full py-2 rounded-lg border font-medium transition-colors ${
                    darkMode
                      ? "border-gray-600 text-gray-300 hover:bg-gray-700"
                      : "border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Back to Login
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
