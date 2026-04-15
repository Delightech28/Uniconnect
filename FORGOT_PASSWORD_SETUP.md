# Forgot Password Setup Guide

## 1. Install EmailJS

Run this command in your project root:

```bash
npm install @emailjs/browser
```

## 2. Get EmailJS Credentials

1. Go to [EmailJS](https://www.emailjs.com/)
2. Sign up for a free account
3. Go to **Email Services** and add Gmail (or another email service)
4. Get your:
   - **Service ID** (e.g., `service_abc123xyz`)
   - **Template ID** (see below)
   - **Public Key** (e.g., `abc123xyz...`)

## 3. Create EmailJS Template

1. In EmailJS dashboard, go to **Email Templates**
2. Click **Create New Template**
3. Set up the template with these variables:

**Template Name:** `password_reset` (or your choice)

**Email Content:**

```html
<!DOCTYPE html>
<html>
  <head>
    <style>
      body {
        font-family: Arial, sans-serif;
        line-height: 1.6;
        color: #333;
      }
      .container {
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
      }
      .header {
        background: #4caf50;
        color: white;
        padding: 20px;
        text-align: center;
        border-radius: 5px;
      }
      .code-box {
        background: #f0f0f0;
        padding: 20px;
        text-align: center;
        margin: 20px 0;
        border-radius: 5px;
        font-size: 32px;
        letter-spacing: 5px;
        font-weight: bold;
        font-family: monospace;
      }
      .code-digits {
        display: flex;
        justify-content: center;
        gap: 10px;
        margin: 20px 0;
      }
      .digit {
        width: 50px;
        height: 50px;
        border: 2px solid #4caf50;
        border-radius: 5px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 24px;
      }
      .footer {
        margin-top: 20px;
        text-align: center;
        color: #666;
        font-size: 12px;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Password Reset Request</h1>
      </div>

      <p>Hello,</p>
      <p>
        You requested a password reset for your UniConnect account. Use the
        following 6-digit code to reset your password:
      </p>

      <div class="code-digits">
        <div class="digit">{{code_digit_1}}</div>
        <div class="digit">{{code_digit_2}}</div>
        <div class="digit">{{code_digit_3}}</div>
        <div class="digit">{{code_digit_4}}</div>
        <div class="digit">{{code_digit_5}}</div>
        <div class="digit">{{code_digit_6}}</div>
      </div>

      <p
        style="text-align: center; font-size: 18px; font-weight: bold; color: #4CAF50;"
      >
        {{reset_code}}
      </p>

      <p>
        <strong>Note:</strong> This code will expire in 10 minutes. If you
        didn't request this, please ignore this email.
      </p>

      <div class="footer">
        <p>&copy; 2024 UniConnect. All rights reserved.</p>
      </div>
    </div>
  </body>
</html>
```

**Template Variables Used:**

- `{{user_email}}` - User's email address
- `{{reset_code}}` - Full 6-digit code
- `{{code_digit_1}}` through `{{code_digit_6}}` - Individual digits

## 4. Add Environment Variables (Vite)

Add these to your `.env` file using the `VITE_` prefix (required for Vite):

```env
VITE_EMAILJS_SERVICE_ID=service_your_service_id_here
VITE_EMAILJS_TEMPLATE_ID=template_your_template_id_here
VITE_EMAILJS_PUBLIC_KEY=your_public_key_here
VITE_FIREBASE_API_KEY=your_firebase_api_key_here
```

**Example:**

```env
VITE_EMAILJS_SERVICE_ID=service_abc123xyz
VITE_EMAILJS_TEMPLATE_ID=template_xyz123abc
VITE_EMAILJS_PUBLIC_KEY=abc123xyz_your_full_key_here
VITE_FIREBASE_API_KEY=AIzaSyD1234567890abc
```

## 5. Update Your .env.example (for team sharing)

Add this to `.env.example`:

```env
VITE_EMAILJS_SERVICE_ID=service_xxxxxxxxxxxxxxx
VITE_EMAILJS_TEMPLATE_ID=template_xxxxxxxxxxxxxxx
VITE_EMAILJS_PUBLIC_KEY=your_emailjs_public_key_here
VITE_FIREBASE_API_KEY=your_firebase_api_key_here
```

## 6. How It Works

1. **Step 1**: User enters email → 6-digit code is generated and sent via EmailJS
2. **Step 2**: User enters the 6 digits one by one (with auto-focus)
3. **Step 3**: If code matches, user can set a new password
4. **Completion**: Password is reset and user is redirected to login

## 7. Features

✅ 6-digit code verification with individual input fields  
✅ Auto-focus between input fields  
✅ Backspace support for code input  
✅ EmailJS integration for sending codes  
✅ Password validation (minimum 6 characters)  
✅ Password confirmation matching  
✅ Dark mode support  
✅ Responsive design  
✅ Error handling and toast notifications

## 8. Testing

Replace your environment variables with test values and verify:

1. Email receives the 6-digit code
2. Code verification works
3. Password reset works (check Firebase console)

## Notes

- The forgot password page is accessible without login (at `/forgot-password`)
- Codes are generated fresh each request
- Old codes become invalid when a new one is sent
- Passwords must be at least 6 characters
- The code expires if a new one is requested
- **IMPORTANT**: For production, you MUST create a Cloud Function to securely update user passwords

## ⚠️ Important: Cloud Function Setup (FOR SECURITY)

Direct password updates are insecure. You need a Cloud Function to handle password resets securely.

### Create a Cloud Function in `functions/src/index.ts`:

```typescript
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();
const auth = admin.auth();
const db = admin.firestore();

export const resetPassword = functions.https.onCall(async (data, context) => {
  const { email, code, newPassword } = data;

  if (!email || !code || !newPassword) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Missing required fields",
    );
  }

  try {
    // Verify the reset code
    const resetQuery = await db
      .collection("passwordResets")
      .where("email", "==", email)
      .where("code", "==", code)
      .where("used", "==", false)
      .limit(1)
      .get();

    if (resetQuery.empty) {
      throw new functions.https.HttpsError(
        "not-found",
        "Invalid or expired reset code",
      );
    }

    const resetDoc = resetQuery.docs[0];
    const resetData = resetDoc.data();

    // Check if expired
    if (resetData.expiresAt && resetData.expiresAt.toDate() < new Date()) {
      throw new functions.https.HttpsError(
        "deadline-exceeded",
        "Reset code expired",
      );
    }

    // Find and update user
    const userRecord = await auth.getUserByEmail(email);
    await auth.updateUser(userRecord.uid, {
      password: newPassword,
    });

    // Mark reset as used
    await resetDoc.ref.update({
      used: true,
      completedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true, message: "Password reset successfully" };
  } catch (error) {
    console.error("Error resetting password:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Failed to reset password",
    );
  }
});
```

### Deploy:

```bash
cd functions
firebase deploy --only functions:resetPassword
```

### Update the React component to use this function:

In `ForgotPasswordPage.jsx`, update the import and `handleResetPassword`:

```javascript
import { httpsCallable } from "firebase/functions";
import { functions } from "../firebase"; // Make sure to export functions from firebase.js

const handleResetPassword = async (e) => {
  // ... validation code ...

  try {
    const resetPassword = httpsCallable(functions, "resetPassword");
    const result = await resetPassword({
      email,
      code: generatedCode,
      newPassword,
    });

    toast.success("Password reset successfully!");
    setTimeout(() => navigate("/login"), 2000);
  } catch (error) {
    toast.error(error.message || "Failed to reset password");
  }
};
```

### Update `src/firebase.js`:

```javascript
import { getAuth } from "firebase/auth";
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";

// ... existing firebase config ...

export const functions = getFunctions(app);
```
