# Security Hardening: Step-by-Step Action Plan

## ⚠️ URGENT: Immediate Actions (Today)

### Step 1: Review Exposed Data

Your current Firestore rules allow ANY authenticated user to read any user's profile. This is the PRIMARY vulnerability.

**Current vulnerable rule:**

```
allow read: if request.auth != null; // ❌ TOO PERMISSIVE
```

**What an attacker can do:**

```bash
# With curl, they can fetch any user's data
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "https://firestore.googleapis.com/v1/projects/YOUR_PROJECT/databases/default/documents/users"
```

### Step 2: Check Your API Keys

The following keys are SAFE to expose (they're designed to be public):

- ✅ `VITE_FIREBASE_API_KEY`
- ✅ `VITE_PAYSTACK_PUBLIC_KEY`
- ✅ `VITE_EMAILJS_PUBLIC_KEY`

The following MUST NEVER be in your code or visible to users:

- ❌ `PAYSTACK_SECRET_KEY`
- ❌ Firebase Admin SDK credentials
- ❌ Any backend API secrets

**Verify your keys are safe:**

1. Open DevTools → Network tab
2. Look for requests to `https://api.paystack.co` or `https://api.emailjs.com`
3. Check if you're using PUBLIC keys (should end with `_pk` or be labeled public)

---

## 📋 Implementation Checklist

### Week 1: Security Rules

#### [ ] 1.1 Backup Current Rules

```bash
# Backup your current rules
cp firestore.rules firestore.rules.backup
cp storage.rules storage.rules.backup
```

#### [ ] 1.2 Replace with Secure Rules

```bash
# Replace with the secure versions we created:
# Use firestore.rules.secure and storage.rules.secure
cp firestore.rules.secure firestore.rules
cp storage.rules.secure storage.rules
```

#### [ ] 1.3 Test Rules Locally

```bash
cd /path/to/project
firebase emulators:start --only firestore

# Test that:
# - User A cannot read User B's private profile
# - User A can only see their own private data
# - Public data (listings, items) is still readable
```

#### [ ] 1.4 Deploy Rules

```bash
firebase deploy --only firestore:rules,storage:rules
```

#### [ ] 1.5 Test After Deployment

- Try logging in as different users
- Verify you can only see your own data
- Verify marketplace items are still visible

---

### Week 2: Cloud Functions Security

#### [ ] 2.1 Add Security Utils

The file `functions/src/securityUtils.ts` has been created for you.

#### [ ] 2.2 Update resetPasswordWithCode

Review the updated code in `SECURITY_IMPLEMENTATION.md` and update your function:

```bash
# The updated version includes:
# - Rate limiting (5 resets per hour)
# - Input validation
# - Security logging
# - Better error handling
```

#### [ ] 2.3 Add Rate Limiting to All Sensitive Functions

Functions to secure:

- `createVirtualAccount` - limit to 10/hour per user
- `updateUserProfile` - limit to 50/minute per user
- `createPost` - limit to 30/minute per user
- `sendMessage` - limit to 100/minute per user

#### [ ] 2.4 Deploy Updated Functions

```bash
cd functions
npm run build
firebase deploy --only functions
```

#### [ ] 2.5 Monitor Function Logs

```bash
firebase functions:log --region us-central1
```

---

### Week 3: API Security

#### [ ] 3.1 Review All API Endpoints

Check `api/` directory:

- `create-virtual-account.ts`
- `transfer.ts`
- `verify-account.ts`
- `webhook.ts`

#### [ ] 3.2 Add Authentication to API Endpoints

Every endpoint should verify the user:

```typescript
// BEFORE (Vulnerable)
export const handler = async (req, res) => {
  // Process request - NO AUTH CHECK!
};

// AFTER (Secure)
export const handler = async (req, res) => {
  // Verify Firebase token
  const token = req.headers.authorization?.split("Bearer ")[1];
  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;

    // Safe to proceed with userId
  } catch (error) {
    return res.status(401).json({ error: "Invalid token" });
  }
};
```

#### [ ] 3.3 Add CORS Security Headers

```typescript
// Set these headers on all responses
const corsHeaders = {
  "Access-Control-Allow-Origin": "https://yourdomain.com",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
};
```

---

### Week 4: Monitoring & Testing

#### [ ] 4.1 Set Up Security Logging

The `logSecurityEvent` function logs to `securityLogs` collection.

Create a dashboard to monitor:

```javascript
// In your admin panel, add a tab to view security logs
const recentLogs = await getDocs(
  query(
    collection(db, "securityLogs"),
    orderBy("timestamp", "desc"),
    limit(100),
  ),
);
```

#### [ ] 4.2 Test Security with curl

**Test Firestore Rules:**

```bash
# This should FAIL now (user A cannot access user B's profile)
curl -H "Authorization: Bearer USER_B_TOKEN" \
  "https://firestore.googleapis.com/.../users/USER_A_ID"
```

**Test Rate Limiting:**

```bash
# Send 60 requests in 1 minute to a rate-limited endpoint
# Should get "Too many requests" after limit is exceeded
for i in {1..60}; do
  curl -X POST https://your-function \
    -H "Authorization: Bearer TOKEN" \
    -d '{...}'
done
```

**Test Authentication:**

```bash
# This should FAIL (no auth token)
curl -X POST https://your-api-endpoint \
  -H "Content-Type: application/json" \
  -d '{...}'
```

#### [ ] 4.3 Security Audit Checklist

Run through this before going live:

- [ ] All Firestore rules deployed and tested
- [ ] All Storage rules deployed and tested
- [ ] Rate limiting implemented on all sensitive endpoints
- [ ] Authentication verified on all API endpoints
- [ ] Input validation on all user inputs
- [ ] Security logging implemented
- [ ] No API keys visible in network tab (except public keys)
- [ ] CORS properly configured
- [ ] Security headers set on all responses
- [ ] Error messages don't leak sensitive info
- [ ] Database backups configured
- [ ] Monitoring and alerting set up

---

## 🚨 Emergency: If You've Been Compromised

1. **Check Firestore for unauthorized access:**

   ```bash
   firebase functions:log | grep "security"
   ```

2. **Rotate all API keys immediately:**
   - Regenerate Paystack API keys
   - Regenerate EmailJS credentials
   - Regenerate any service account keys

3. **Reset user passwords:**
   - Send password reset emails to all users
   - Force password change on next login

4. **Check for data exfiltration:**
   - Review Firestore audit logs
   - Check if unusual data was accessed/downloaded

5. **Deploy security patches:**
   - Apply all rules from `firestore.rules.secure`
   - Apply authentication to all Cloud Functions
   - Deploy immediately

---

## 📞 Getting Help

If you encounter issues during implementation:

1. Check Cloud Function logs:

   ```bash
   firebase functions:log
   ```

2. Test Firestore rules locally:

   ```bash
   firebase emulators:start
   ```

3. Review error messages in browser DevTools

4. Check Firebase documentation for specific features

---

## 🎯 Success Criteria

After completing all steps, you should be able to verify:

✅ Only authenticated users can access private data
✅ Users can only see their own private information
✅ Public marketplace data is still accessible
✅ Rate limiting prevents abuse
✅ API endpoints require authentication
✅ No sensitive keys visible in network tab
✅ Security events are logged and monitored
✅ curl commands to your API are properly rejected

---

## 📚 Additional Resources

- [Firebase Security Best Practices](https://firebase.google.com/docs/rules/basics)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Cloud Functions Security](https://cloud.google.com/functions/docs/securing)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
