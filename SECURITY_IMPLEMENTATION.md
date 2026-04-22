# Security Implementation Guide

## Quick Start: Securing Your Cloud Functions

### 1. Import Security Utilities

```typescript
import {
  verifyAuthenticated,
  verifyAdmin,
  verifyOwnership,
  checkRateLimit,
  validateEmail,
  sanitizeInput,
  logSecurityEvent,
} from "./securityUtils";
```

### 2. Add Authentication to Your Functions

**BEFORE (Insecure):**

```typescript
export const updateUserProfile = onCall(async (request) => {
  const { displayName, bio } = request.data;
  // No auth check - VULNERABLE!
  const userRef = db.collection("users").doc("some-user-id");
  await userRef.update({ displayName, bio });
});
```

**AFTER (Secure):**

```typescript
export const updateUserProfile = onCall(async (request) => {
  // Verify user is authenticated
  const userId = verifyAuthenticated(request);

  // Rate limit the request
  checkRateLimit(userId, 50, 60000); // 50 requests per minute

  // Sanitize inputs
  const displayName = sanitizeInput(request.data.displayName);
  const bio = sanitizeInput(request.data.bio);

  // Update only the user's own profile
  const userRef = db.collection("users").doc(userId);
  await userRef.update({ displayName, bio });

  // Log the action
  await logSecurityEvent("profile_update", userId, {
    fields: ["displayName", "bio"],
  });

  return { success: true };
});
```

### 3. Admin-Only Functions

```typescript
export const approveUser = onCall(async (request) => {
  const userId = verifyAuthenticated(request);

  // Verify admin role
  await verifyAdmin(userId);

  // Now proceed with admin-only operation
  const targetUserId = request.data.targetUserId;
  await db.collection("users").doc(targetUserId).update({
    verified: true,
    verifiedAt: new Date(),
  });

  await logSecurityEvent("user_approved", userId, {
    targetUser: targetUserId,
    severity: "medium",
  });
});
```

### 4. Ownership Verification

```typescript
export const deletePost = onCall(async (request) => {
  const userId = verifyAuthenticated(request);
  const postId = request.data.postId;

  // Verify user owns this post
  await verifyOwnership(userId, postId, "posts", "authorId");

  // Safe to delete
  await db.collection("posts").doc(postId).delete();

  await logSecurityEvent("post_deleted", userId, { postId });
});
```

### 5. Input Validation

```typescript
export const sendMessage = onCall(async (request) => {
  const userId = verifyAuthenticated(request);

  // Validate email
  validateEmail(request.data.email);

  // Sanitize message
  const message = sanitizeInput(request.data.message);

  // Rate limit: 100 messages per minute
  checkRateLimit(userId, 100, 60000);

  // Store safely
  await db.collection("messages").add({
    senderId: userId,
    message,
    createdAt: new Date(),
  });
});
```

### 6. Strong Password Validation

```typescript
export const changePassword = onCall(async (request) => {
  const userId = verifyAuthenticated(request);

  // Validate new password strength
  validatePassword(request.data.newPassword);

  const auth = getAuth();
  await auth.updateUser(userId, {
    password: request.data.newPassword,
  });

  await logSecurityEvent("password_changed", userId, {
    severity: "high",
  });
});
```

## Updated Function Example: resetPasswordWithCode

```typescript
import {
  verifyAuthenticated,
  checkRateLimit,
  validateEmail,
  validatePassword,
  logSecurityEvent,
  sanitizeInput,
} from "./securityUtils";

export const resetPasswordWithCode = onCall(async (request) => {
  try {
    const { email, code, newPassword } = request.data;

    // Validate inputs
    validateEmail(email);
    validatePassword(newPassword);

    if (!code || code.length !== 6) {
      throw new HttpsError("invalid-argument", "Invalid reset code format");
    }

    // Rate limit: max 5 reset attempts per hour
    const rateLimitKey = `password-reset:${email}`;
    checkRateLimit(email, 5, 3600000); // 5 per hour

    // Verify the reset code
    const resetQuery = await db
      .collection("passwordResets")
      .where("email", "==", email)
      .where("code", "==", code)
      .where("used", "==", false)
      .limit(1)
      .get();

    if (resetQuery.empty) {
      // Log failed attempt
      await logSecurityEvent("password_reset_failed", "unknown", {
        email: sanitizeInput(email),
        reason: "invalid_code",
        severity: "medium",
      });

      throw new HttpsError("not-found", "Invalid or expired reset code");
    }

    const resetDoc = resetQuery.docs[0];
    const resetData = resetDoc.data();

    // Check expiration (10 minutes)
    if (resetData.expiresAt && resetData.expiresAt.toDate() < new Date()) {
      await logSecurityEvent("password_reset_failed", "unknown", {
        email: sanitizeInput(email),
        reason: "expired_code",
        severity: "low",
      });

      throw new HttpsError("deadline-exceeded", "Reset code has expired");
    }

    // Get user and update password
    const authUser = await auth.getUserByEmail(email);

    await auth.updateUser(authUser.uid, {
      password: newPassword,
    });

    // Mark code as used
    await resetDoc.ref.update({
      used: true,
      completedAt: new Date(),
    });

    // Log successful reset
    await logSecurityEvent("password_reset_success", authUser.uid, {
      severity: "high",
    });

    return { success: true, message: "Password reset successfully" };
  } catch (error: any) {
    if (error instanceof HttpsError) {
      throw error;
    }

    console.error("Password reset error:", error);

    await logSecurityEvent("password_reset_error", "unknown", {
      reason: error.message,
      severity: "high",
    });

    throw new HttpsError("internal", "Failed to reset password");
  }
});
```

## Deployment Steps

### 1. Update Firestore Rules

```bash
firebase deploy --only firestore:rules
```

### 2. Update Storage Rules

```bash
firebase deploy --only storage:rules
```

### 3. Redeploy Cloud Functions

```bash
firebase deploy --only functions
```

### 4. Monitor Logs

```bash
firebase functions:log
```

## Testing Security

### Test Rate Limiting

```bash
# This should work (first request)
curl -X POST https://your-project.cloudfunctions.net/updateProfile \
  -H "Content-Type: application/json" \
  -d '{"displayName":"Test"}'

# Send 50+ requests rapidly - should get "Too many requests" error
```

### Test Authentication

```bash
# This should fail (no auth token)
curl -X POST https://your-project.cloudfunctions.net/approveUser \
  -H "Content-Type: application/json" \
  -d '{"userId":"test"}'
```

### Test Input Validation

```bash
# This should fail (invalid email)
curl -X POST https://your-project.cloudfunctions.net/sendEmail \
  -H "Content-Type: application/json" \
  -d '{"email":"not-an-email"}'
```

## Monitoring & Alerts

Check `securityLogs` collection in Firestore for:

- Failed authentication attempts
- Rate limit violations
- Ownership verification failures
- Sensitive operations (password changes, admin actions)

### Set up Firestore alert rule:

```
threshold: 10 failed login attempts in 1 hour
action: Notify admin
```

## Best Practices Checklist

✅ All authenticated endpoints verify `request.auth`
✅ All write operations verify ownership
✅ Admin operations verify admin role
✅ Rate limiting on all user actions
✅ Input validation and sanitization
✅ Security events logged
✅ No sensitive data in client code
✅ Environment variables for secrets (backend only)
✅ CORS properly configured
✅ Security headers set on responses
✅ Regular security audits scheduled
✅ Incident response plan documented
