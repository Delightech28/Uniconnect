import { onRequest } from "firebase-functions/v2/https";
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as logger from "firebase-functions/logger";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onDocumentCreated, onDocumentWritten } from "firebase-functions/v2/firestore";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { getAuth } from "firebase-admin/auth";
import { defineSecret } from "firebase-functions/params";
import { createHmac, createHash } from "crypto";

const app = initializeApp();
const db = getFirestore(app);
const auth = getAuth(app);

const PAYSTACK_SECRET_KEY = defineSecret("PAYSTACK_SECRET_KEY");
// EMAILJS_PRIVATE_KEY secret — uncomment when ready to store in Secret Manager:
// const EMAILJS_PRIVATE_KEY = defineSecret("EMAILJS_PRIVATE_KEY");

const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",
  "https://vercel.app",
  "https://your-app.firebaseapp.com",
  "https://uniconnect-main.vercel.app",
];

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

const rateLimitBuckets = new Map<string, RateLimitBucket>();
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 5;

const getClientIpFromHeaders = (headers: any): string => {
  const forwarded = headers?.["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.trim()) {
    return forwarded.split(",")[0].trim();
  }
  return "unknown";
};

const buildRateLimitKey = (
  scope: string,
  authUid?: string,
  rawRequest?: any,
): string => {
  if (authUid) return `${scope}:uid:${authUid}`;
  const ip = getClientIpFromHeaders(rawRequest?.headers ?? {});
  return `${scope}:ip:${ip}`;
};

const enforceRateLimit = (
  key: string,
  maxRequests: number,
  windowMs: number,
): { allowed: boolean; retryAfterSeconds?: number } => {
  const now = Date.now();
  const current = rateLimitBuckets.get(key);

  if (!current || now > current.resetAt) {
    rateLimitBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  if (current.count >= maxRequests) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((current.resetAt - now) / 1000),
    );
    return { allowed: false, retryAfterSeconds };
  }

  current.count += 1;
  return { allowed: true };
};

// ─────────────────────────────────────────────────────────────────────────────
// sendVerificationEmail — DISABLED until EMAILJS_PRIVATE_KEY is stored.
// To enable:
//   1. firebase functions:secrets:set EMAILJS_PRIVATE_KEY
//   2. Uncomment the EMAILJS_PRIVATE_KEY defineSecret above (line ~18)
//   3. Uncomment this entire function block
//   4. Run: firebase deploy --only functions
// ─────────────────────────────────────────────────────────────────────────────

export const streamGemini = onRequest(
  {
    secrets: ["GEMINI_API_KEY"],
    maxInstances: 10,
    concurrency: 80,
    memory: "256MiB",
  },
  async (req, res) => {
    const rateLimit = enforceRateLimit(
      buildRateLimitKey("streamGemini", undefined, req),
      RATE_LIMIT_MAX_REQUESTS,
      RATE_LIMIT_WINDOW_MS,
    );
    if (!rateLimit.allowed) {
      res.set("Retry-After", String(rateLimit.retryAfterSeconds));
      res.status(429).json({
        error: "Too many requests",
        retryAfterSeconds: rateLimit.retryAfterSeconds,
      });
      return;
    }

    const origin = req.headers.origin || "";

    if (ALLOWED_ORIGINS.includes(origin) || origin.includes("localhost")) {
      res.set("Access-Control-Allow-Origin", origin);
    } else {
      res.set("Access-Control-Allow-Origin", "*");
    }

    res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.set("Access-Control-Allow-Credentials", "true");
    res.set("Vary", "Origin");

    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }

    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    try {
      const { contentsParts, systemInstruction } = req.body;

      if (
        !contentsParts ||
        !Array.isArray(contentsParts) ||
        contentsParts.length === 0
      ) {
        res
          .status(400)
          .json({ error: "Missing or invalid 'contentsParts' array" });
        return;
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        logger.error("GEMINI_API_KEY not configured");
        res.status(500).json({ error: "Server configuration error" });
        return;
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        systemInstruction: systemInstruction || "You are a helpful assistant.",
      });

      const result = await model.generateContentStream({
        contents: [{ role: "user", parts: contentsParts }],
      });

      // Set streaming headers
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.setHeader("Transfer-Encoding", "chunked");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.status(200);

      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        if (chunkText) {
          res.write(chunkText);
        }
      }

      res.end();
    } catch (error: any) {
      logger.error("Stream Error:", error);
      // Only send error if headers not sent
      if (!res.headersSent) {
        res
          .status(500)
          .json({ error: error.message || "Internal server error" });
      } else {
        res.end();
      }
    }
  },
);

export const unidocStandardAPI = onRequest(
  {
    secrets: ["GEMINI_API_KEY"],
    maxInstances: 10,
    concurrency: 80,
    memory: "256MiB",
  },
  async (req, res) => {
    const rateLimit = enforceRateLimit(
      buildRateLimitKey("unidocStandardAPI", undefined, req),
      RATE_LIMIT_MAX_REQUESTS,
      RATE_LIMIT_WINDOW_MS,
    );
    if (!rateLimit.allowed) {
      res.set("Retry-After", String(rateLimit.retryAfterSeconds));
      res.status(429).json({
        error: "Too many requests",
        retryAfterSeconds: rateLimit.retryAfterSeconds,
      });
      return;
    }

    const origin = req.headers.origin || "";

    // Set CORS headers
    if (ALLOWED_ORIGINS.includes(origin) || origin.includes("localhost")) {
      res.set("Access-Control-Allow-Origin", origin);
    } else {
      res.set("Access-Control-Allow-Origin", "*");
    }

    res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.set("Access-Control-Allow-Credentials", "true");
    res.set("Vary", "Origin");
    res.set("Content-Type", "application/json");

    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }

    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    try {
      const { prompt } = req.body;

      if (!prompt || typeof prompt !== "string") {
        res.status(400).json({ error: "Missing or invalid 'prompt'" });
        return;
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        logger.error("GEMINI_API_KEY not configured");
        res.status(500).json({ error: "Server configuration error" });
        return;
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();

      res.json({
        success: true,
        text: responseText,
        candidates: [{ content: { parts: [{ text: responseText }] } }],
      });
    } catch (error: any) {
      logger.error("API Error:", error);
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  },
);

export const createVirtualAccount = onRequest(
  {
    secrets: ["PAYSTACK_SECRET_KEY"],
    cors: true,
    maxInstances: 10,
  },
  async (req, res) => {
    const rateLimit = enforceRateLimit(
      buildRateLimitKey("createVirtualAccount", undefined, req),
      RATE_LIMIT_MAX_REQUESTS,
      RATE_LIMIT_WINDOW_MS,
    );
    if (!rateLimit.allowed) {
      res.set("Retry-After", String(rateLimit.retryAfterSeconds));
      res.status(429).json({
        error: "Too many requests",
        retryAfterSeconds: rateLimit.retryAfterSeconds,
      });
      return;
    }

    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    try {
      const { firstName, lastName, email, phone } = req.body;

      if (!firstName || !lastName || !email) {
        res.status(400).json({
          error: "Missing required fields: firstName, lastName, email",
        });
        return;
      }

      const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
      if (!PAYSTACK_SECRET) {
        logger.error("PAYSTACK_SECRET_KEY not set");
        res.status(500).json({ error: "Server configuration error" });
        return;
      }

      const phoneNumber = phone && phone.trim() !== "" ? phone : "08000000000";

      const customerResp = await fetch("https://api.paystack.co/customer", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          first_name: firstName,
          last_name: lastName,
          phone: phoneNumber,
        }),
      });

      const customerData = await customerResp.json();

      if (!customerResp.ok) {
        logger.error("Customer creation failed:", customerData);
        res.status(400).json({
          error: "Failed to create customer",
          details: customerData.message,
        });
        return;
      }

      const customerId = customerData.data.id;

      const accountResp = await fetch(
        "https://api.paystack.co/dedicated_account",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            customer: customerId,
            preferred_bank: "wema-bank",
          }),
        },
      );

      const accountData = await accountResp.json();
      logger.log("Paystack response:", accountData);

      if (!accountResp.ok || !accountData.data) {
        logger.error("Virtual account creation failed:", accountData);
        res.status(400).json({
          error: "Failed to create virtual account",
          details: accountData.message,
        });
        return;
      }

      const virtualAccount = accountData.data;

      res.status(200).json({
        success: true,
        data: {
          accountNumber: virtualAccount.account_number,
          bankName: virtualAccount.bank?.name || "Wema Bank",
          bankCode: virtualAccount.bank?.code || "035",
          accountName: `${firstName} ${lastName}`,
          paystackCustomerId: customerId,
          paystackDedicatedAccountId: virtualAccount.id,
        },
      });
      return;
    } catch (err: any) {
      logger.error("Create virtual account error:", err);
      res.status(500).json({ error: "Server error", details: err.message });
      return;
    }
  },
);

export const transferMoney = onRequest(
  {
    secrets: ["PAYSTACK_SECRET_KEY"],
    cors: true,
    maxInstances: 10,
  },
  async (req, res) => {
    const rateLimit = enforceRateLimit(
      buildRateLimitKey("transferMoney", undefined, req),
      RATE_LIMIT_MAX_REQUESTS,
      RATE_LIMIT_WINDOW_MS,
    );
    if (!rateLimit.allowed) {
      res.set("Retry-After", String(rateLimit.retryAfterSeconds));
      res.status(429).json({
        error: "Too many requests",
        retryAfterSeconds: rateLimit.retryAfterSeconds,
      });
      return;
    }

    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET,OPTIONS,PATCH,DELETE,POST,PUT",
    );
    res.setHeader(
      "Access-Control-Allow-Headers",
      "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version",
    );

    if (req.method === "OPTIONS") {
      res.status(200).end();
      return;
    }

    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    try {
      const { accountNumber, bankCode, accountName, amount, reference } =
        req.body;

      if (!accountNumber || !bankCode || !amount) {
        res.status(400).json({ error: "Missing required fields" });
        return;
      }

      const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
      if (!PAYSTACK_SECRET) {
        logger.error("PAYSTACK_SECRET_KEY not set");
        res.status(500).json({ error: "Server configuration error" });
        return;
      }

      const recipientResp = await fetch(
        "https://api.paystack.co/transferrecipient",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: "nuban",
            name: accountName || "Recipient",
            account_number: accountNumber,
            bank_code: bankCode,
          }),
        },
      );

      const recipientData = await recipientResp.json();
      if (!recipientResp.ok || !recipientData.data) {
        const errorMessage =
          recipientData.message || "Failed to create transfer recipient";
        res.status(500).json({
          error: errorMessage,
          details: recipientData,
          code: "RECIPIENT_CREATION_FAILED",
        });
        return;
      }

      const recipientCode = recipientData.data.recipient_code;

      const transferResp = await fetch("https://api.paystack.co/transfer", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          source: "balance",
          recipient: recipientCode,
          amount: Math.round(parseFloat(amount) * 100),
          reference: reference || `TRF-${Date.now()}`,
        }),
      });

      const transferData = await transferResp.json();

      // Log for debugging
      logger.log("Paystack transfer response:", transferData);

      if (!transferResp.ok) {
        const errorMessage =
          transferData.message || "Failed to initiate transfer";
        const errorDetails = transferData.data || transferData;

        // Check for common errors
        if (
          errorMessage.includes("balance") ||
          errorMessage.includes("insufficient")
        ) {
          res.status(500).json({
            error:
              "Insufficient Paystack balance. Please fund your Paystack account to enable transfers.",
            details: errorDetails,
            code: "INSUFFICIENT_BALANCE",
          });
          return;
        }

        if (
          errorMessage.includes("third party") ||
          errorMessage.includes("payouts") ||
          errorMessage.includes("cannot initiate")
        ) {
          res.status(500).json({
            error:
              "Bank transfers are not enabled on your Paystack account. Please enable transfers in your Paystack dashboard or contact Paystack support to activate this feature.",
            details: errorDetails,
            code: "TRANSFERS_NOT_ENABLED",
            helpUrl: "https://dashboard.paystack.com/#/settings/developer",
          });
          return;
        }

        if (
          errorMessage.includes("recipient") ||
          errorMessage.includes("invalid")
        ) {
          res.status(500).json({
            error:
              "Invalid recipient account. Please verify the account details.",
            details: errorDetails,
            code: "INVALID_RECIPIENT",
          });
          return;
        }

        res.status(500).json({
          error: errorMessage,
          details: errorDetails,
          code: transferData.status || "TRANSFER_FAILED",
        });
        return;
      }

      res.status(200).json({ success: true, data: transferData.data });
      return;
    } catch (err: any) {
      logger.error("Transfer error:", err);
      res.status(500).json({ error: "Server error", details: err.message });
      return;
    }
  },
);

export const verifyAccount = onRequest(
  {
    secrets: [PAYSTACK_SECRET_KEY],
    cors: true,
    maxInstances: 10,
  },
  async (req, res) => {
    const rateLimit = enforceRateLimit(
      buildRateLimitKey("verifyAccount", undefined, req),
      RATE_LIMIT_MAX_REQUESTS,
      RATE_LIMIT_WINDOW_MS,
    );
    if (!rateLimit.allowed) {
      res.set("Retry-After", String(rateLimit.retryAfterSeconds));
      res.status(429).json({
        error: "Too many requests",
        retryAfterSeconds: rateLimit.retryAfterSeconds,
      });
      return;
    }

    if (req.method !== "POST") {
      res.status(405).send("Method Not Allowed");
      return;
    }

    try {
      const { accountNumber, bankCode } = req.body;

      if (!accountNumber || !bankCode) {
        res.status(400).json({ error: "Missing account number or bank code" });
        return;
      }

      const PAYSTACK_SECRET = PAYSTACK_SECRET_KEY.value();

      if (!PAYSTACK_SECRET) {
        logger.error("PAYSTACK_SECRET_KEY is missing from Secret Manager");
        res.status(500).json({ error: "Server configuration error" });
        return;
      }

      const verifyResp = await fetch(
        `https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET}`,
            "Content-Type": "application/json",
          },
        },
      );

      const verifyData = await verifyResp.json();

      if (!verifyResp.ok || !verifyData.status) {
        res.status(400).json({
          error: "Account verification failed",
          details: verifyData.message || "Invalid account details",
        });
        return;
      }

      res.status(200).json({ success: true, data: verifyData.data });
    } catch (err: any) {
      logger.error("Verify account error:", err);
      res
        .status(500)
        .json({ error: "Internal Server Error", message: err.message });
    }
  },
);

export const paystackWebhook = onRequest(
  {
    secrets: ["PAYSTACK_SECRET_KEY"],
    cors: true,
  },
  async (req, res) => {
    // Only accept POST requests
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    try {
      const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
      if (!paystackSecret) {
        logger.error("PAYSTACK_SECRET_KEY not set");
        res.status(500).json({ error: "Server configuration error" });
        return;
      }

      const hash = createHmac("sha512", paystackSecret)
        .update(JSON.stringify(req.body))
        .digest("hex");

      if (hash !== req.headers["x-paystack-signature"]) {
        logger.warn("Invalid webhook signature");
        res.status(401).json({ error: "Invalid signature" });
        return;
      }

      const { event, data } = req.body;

      logger.log(`Webhook event: ${event}`, data);

      if (event === "transfer.success") {
        const { recipient, amount, reference, status } = data;

        if (status !== "success") {
          res
            .status(200)
            .json({ success: false, message: "Transfer not successful" });
          return;
        }

        const usersRef = db.collection("users");

        let snapshot = await usersRef
          .where("paystackDedicatedAccountId", "==", recipient?.toString())
          .limit(1)
          .get();

        if (snapshot.empty) {
          // Fallback: try paystackCustomerId
          snapshot = await usersRef
            .where("paystackCustomerId", "==", recipient?.toString())
            .limit(1)
            .get();
        }

        if (snapshot.empty) {
          logger.warn(
            `No user found for recipient/dedicated account: ${recipient}`,
          );
          res.status(200).json({ success: false, message: "User not found" });
          return;
        }

        const userDoc = snapshot.docs[0];
        const userId = userDoc.id;
        const amountInNaira = amount / 100; // Paystack sends amount in kobo

        await userDoc.ref.update({
          walletBalance: FieldValue.increment(amountInNaira),
        });

        await db
          .collection("users")
          .doc(userId)
          .collection("transactions")
          .add({
            type: "credit",
            amount: amountInNaira,
            description: "Received via bank transfer",
            reference: reference,
            timestamp: FieldValue.serverTimestamp(),
            status: "completed",
          });

        logger.log(`✅ Updated wallet for user ${userId}: +₦${amountInNaira}`);
        res.status(200).json({ success: true, message: "Wallet updated" });
        return;
      }

      // Handle charge success (card payments)
      if (event === "charge.success") {
        const { customer, amount, reference, status } = data;

        if (status !== "success") {
          res
            .status(200)
            .json({ success: false, message: "Charge not successful" });
          return;
        }

        // Find user by email
        const usersRef = db.collection("users");
        const snapshot = await usersRef
          .where("email", "==", customer?.email)
          .limit(1)
          .get();

        if (snapshot.empty) {
          logger.warn(`No user found for email: ${customer?.email}`);
          res.status(200).json({ success: false, message: "User not found" });
          return;
        }

        const userDoc = snapshot.docs[0];
        const userId = userDoc.id;
        const amountInNaira = amount / 100; // Paystack sends amount in kobo

        // Update wallet balance
        await userDoc.ref.update({
          walletBalance: FieldValue.increment(amountInNaira),
        });

        // Log transaction
        await db
          .collection("users")
          .doc(userId)
          .collection("transactions")
          .add({
            type: "credit",
            amount: amountInNaira,
            description: "Wallet funded via card",
            reference: reference,
            timestamp: FieldValue.serverTimestamp(),
            status: "completed",
          });

        logger.log(`✅ Updated wallet for user ${userId}: +₦${amountInNaira}`);
        res.status(200).json({ success: true, message: "Wallet updated" });
        return;
      }

      // Other events
      res.status(200).json({ success: true, message: "Event received" });
      return;
    } catch (err: any) {
      logger.error("Webhook error:", err);
      res.status(500).json({ error: "Server error", details: err.message });
      return;
    }
  },
);

// Referral attribution function
export const onUserCreated = onDocumentCreated(
  {
    document: "users/{userId}",
    region: "us-central1",
  },
  async (event) => {
    const userId = event.params.userId;
    const userData = event.data?.data();

    if (!userData) {
      logger.warn(`No data for user ${userId}`);
      return;
    }

    const referredByCode = userData.referredByCode;

    if (!referredByCode) {
      logger.info(`User ${userId} has no referral code`);
      return;
    }

    try {
      // Find the referrer by their referral code
      const usersRef = db.collection("users");
      const referrerQuery = await usersRef
        .where("referralCode", "==", referredByCode)
        .limit(1)
        .get();

      if (referrerQuery.empty) {
        logger.warn(`No referrer found for code: ${referredByCode}`);
        return;
      }

      const referrerDoc = referrerQuery.docs[0];
      const referrerId = referrerDoc.id;

      // Increment the referrer's referrals count
      await referrerDoc.ref.update({
        referralsCount: FieldValue.increment(1),
      });

      // Create a referral notification for the referrer
      await db
        .collection("users")
        .doc(referrerId)
        .collection("notifications")
        .add({
          type: "referral_success",
          title: "New Referral!",
          message: `Someone signed up using your referral link! You now have ${userData.referralsCount + 1} referrals.`,
          read: false,
          createdAt: FieldValue.serverTimestamp(),
        });

      logger.log(`✅ Referral attributed: ${userId} referred by ${referrerId}`);
    } catch (error: any) {
      logger.error("Error processing referral:", error);
    }
  },
);

// Keep a sanitized public profile in sync with users/{uid}.
// Only non-sensitive fields are copied into publicProfiles/{uid}.
export const syncPublicProfile = onDocumentWritten(
  {
    document: "users/{userId}",
    region: "us-central1",
  },
  async (event) => {
    const userId = event.params.userId;
    const afterData = event.data?.after?.data();
    const publicRef = db.collection("publicProfiles").doc(userId);

    // If user doc deleted, remove public profile projection.
    if (!afterData) {
      await publicRef.delete().catch(() => undefined);
      logger.info(`Removed public profile for deleted user ${userId}`);
      return;
    }

    const publicProfile = {
      userId,
      username: afterData.username ?? "",
      displayName: afterData.displayName ?? "",
      avatarUrl: afterData.avatarUrl ?? "",
      bio: afterData.bio ?? "",
      institution: afterData.institution ?? "",
      interests: Array.isArray(afterData.interests) ? afterData.interests : [],
      linkedinUrl: afterData.linkedinUrl ?? "",
      githubUrl: afterData.githubUrl ?? "",
      instagramUrl: afterData.instagramUrl ?? "",
      connectionsCount:
        typeof afterData.connectionsCount === "number"
          ? afterData.connectionsCount
          : 0,
      gender: afterData.gender ?? "",
      updatedAt: FieldValue.serverTimestamp(),
    };

    await publicRef.set(publicProfile, { merge: true });
  },
);

const getPaystackSecret = () => {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) {
    throw new Error("PAYSTACK_SECRET_KEY not configured");
  }
  return secret;
};

export const fetchPaystackBanks = onCall(
  {
    secrets: [PAYSTACK_SECRET_KEY],
    cors: true,
  },
  async (request) => {
    const rateLimit = enforceRateLimit(
      buildRateLimitKey(
        "fetchPaystackBanks",
        request.auth?.uid,
        (request as any).rawRequest,
      ),
      RATE_LIMIT_MAX_REQUESTS,
      RATE_LIMIT_WINDOW_MS,
    );
    if (!rateLimit.allowed) {
      throw new HttpsError(
        "resource-exhausted",
        `Too many requests. Try again in ${rateLimit.retryAfterSeconds}s.`,
      );
    }

    try {
      const PAYSTACK_SECRET = PAYSTACK_SECRET_KEY.value();

      if (!PAYSTACK_SECRET) {
        logger.error("PAYSTACK_SECRET_KEY is missing in Secret Manager");
        throw new HttpsError("failed-precondition", "API Key not configured.");
      }

      const response = await fetch("https://api.paystack.co/bank", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error("Paystack API Error:", errorText);
        throw new HttpsError("unavailable", "Failed to reach Paystack.");
      }

      const data = await response.json();

      // Paystack returns { status: true, message: "...", data: [...] }
      return data.data || [];
    } catch (error: any) {
      logger.error("Fetch banks error:", error);

      // If it's already an HttpsError, rethrow it
      if (error instanceof HttpsError) throw error;

      // Otherwise, wrap it
      throw new HttpsError("internal", error.message || "Unknown error");
    }
  },
);

export const verifyPaystackAccount = onCall(
  {
    secrets: [PAYSTACK_SECRET_KEY],
    cors: true,
  },
  async (request) => {
    const rateLimit = enforceRateLimit(
      buildRateLimitKey(
        "verifyPaystackAccount",
        request.auth?.uid,
        (request as any).rawRequest,
      ),
      RATE_LIMIT_MAX_REQUESTS,
      RATE_LIMIT_WINDOW_MS,
    );
    if (!rateLimit.allowed) {
      throw new HttpsError(
        "resource-exhausted",
        `Too many requests. Try again in ${rateLimit.retryAfterSeconds}s.`,
      );
    }

    const { accountNumber, bankCode } = request.data;

    if (!accountNumber || !bankCode) {
      throw new HttpsError(
        "invalid-argument",
        "Account number and bank code required",
      );
    }

    try {
      const PAYSTACK_SECRET = getPaystackSecret();

      const response = await fetch(
        `https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to verify account");
      }

      const data = await response.json();
      return data.data;
    } catch (error: any) {
      logger.error("Verify account error:", error);
      throw new HttpsError("internal", error.message);
    }
  },
);

export const initializePaystackPayment = onCall(
  {
    secrets: [PAYSTACK_SECRET_KEY],
    cors: true,
  },
  async (request) => {
    const rateLimit = enforceRateLimit(
      buildRateLimitKey(
        "initializePaystackPayment",
        request.auth?.uid,
        (request as any).rawRequest,
      ),
      RATE_LIMIT_MAX_REQUESTS,
      RATE_LIMIT_WINDOW_MS,
    );
    if (!rateLimit.allowed) {
      throw new HttpsError(
        "resource-exhausted",
        `Too many requests. Try again in ${rateLimit.retryAfterSeconds}s.`,
      );
    }

    const { email, amount, reference, callbackUrl, channels } = request.data;

    if (!email || !amount || !reference) {
      throw new HttpsError(
        "invalid-argument",
        "Email, amount, and reference required",
      );
    }

    try {
      const PAYSTACK_SECRET = getPaystackSecret();

      const payload: any = {
        email,
        amount: amount * 100,
        reference,
        channels: channels || ["card", "bank", "ussd", "qr"],
      };

      if (callbackUrl) {
        payload.callback_url = callbackUrl;
      }

      const response = await fetch(
        "https://api.paystack.co/transaction/initialize",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to initialize payment");
      }

      const data = await response.json();
      return data.data;
    } catch (error: any) {
      logger.error("Initialize payment error:", error);
      throw new HttpsError("internal", error.message);
    }
  },
);

export const verifyPaystackPayment = onCall(
  {
    secrets: [PAYSTACK_SECRET_KEY],
    cors: true,
  },
  async (request) => {
    const rateLimit = enforceRateLimit(
      buildRateLimitKey(
        "verifyPaystackPayment",
        request.auth?.uid,
        (request as any).rawRequest,
      ),
      RATE_LIMIT_MAX_REQUESTS,
      RATE_LIMIT_WINDOW_MS,
    );
    if (!rateLimit.allowed) {
      throw new HttpsError(
        "resource-exhausted",
        `Too many requests. Try again in ${rateLimit.retryAfterSeconds}s.`,
      );
    }

    const { reference } = request.data;

    if (!reference) {
      throw new HttpsError("invalid-argument", "Reference required");
    }

    try {
      const PAYSTACK_SECRET = getPaystackSecret();

      const response = await fetch(
        `https://api.paystack.co/transaction/verify/${reference}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to verify payment");
      }

      const data = await response.json();
      return data.data;
    } catch (error: any) {
      logger.error("Verify payment error:", error);
      throw new HttpsError("internal", error.message);
    }
  },
);

export const createPaystackRecipient = onCall(
  {
    secrets: [PAYSTACK_SECRET_KEY],
    cors: true,
  },
  async (request) => {
    const rateLimit = enforceRateLimit(
      buildRateLimitKey(
        "createPaystackRecipient",
        request.auth?.uid,
        (request as any).rawRequest,
      ),
      RATE_LIMIT_MAX_REQUESTS,
      RATE_LIMIT_WINDOW_MS,
    );
    if (!rateLimit.allowed) {
      throw new HttpsError(
        "resource-exhausted",
        `Too many requests. Try again in ${rateLimit.retryAfterSeconds}s.`,
      );
    }

    const { accountNumber, bankCode, recipientName } = request.data;

    if (!accountNumber || !bankCode || !recipientName) {
      throw new HttpsError("invalid-argument", "All fields required");
    }

    try {
      const PAYSTACK_SECRET = getPaystackSecret();

      const response = await fetch(
        "https://api.paystack.co/transferrecipient",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: "nuban",
            name: recipientName,
            account_number: accountNumber,
            bank_code: bankCode,
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to create transfer recipient");
      }

      const data = await response.json();
      return data.data;
    } catch (error: any) {
      logger.error("Create recipient error:", error);
      throw new HttpsError("internal", error.message);
    }
  },
);

export const initiatePaystackTransfer = onCall(
  {
    secrets: [PAYSTACK_SECRET_KEY],
    cors: true,
  },
  async (request) => {
    const rateLimit = enforceRateLimit(
      buildRateLimitKey(
        "initiatePaystackTransfer",
        request.auth?.uid,
        (request as any).rawRequest,
      ),
      RATE_LIMIT_MAX_REQUESTS,
      RATE_LIMIT_WINDOW_MS,
    );
    if (!rateLimit.allowed) {
      throw new HttpsError(
        "resource-exhausted",
        `Too many requests. Try again in ${rateLimit.retryAfterSeconds}s.`,
      );
    }

    const { recipient, amount, reference } = request.data;

    if (!recipient || !amount || !reference) {
      throw new HttpsError("invalid-argument", "All fields required");
    }

    try {
      const PAYSTACK_SECRET = getPaystackSecret();

      const response = await fetch("https://api.paystack.co/transfer", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          source: "balance",
          recipient,
          amount: amount * 100,
          reference,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to initiate transfer");
      }

      const data = await response.json();
      return data.data;
    } catch (error: any) {
      logger.error("Initiate transfer error:", error);
      throw new HttpsError("internal", error.message);
    }
  },
);

// AI PDF processing and quota optimization functions

/**
 * Processes a PDF once per user and caches the result.
 * Extracts text, generates a summary, and stores in Firestore.
 * Keyed by userId + pdfHash to avoid reprocessing.
 * @param pdf - Base64 encoded PDF content
 * @param userId - User's unique identifier
 * @returns Processed PDF data: { text, summary, pdfHash }
 */
export const processPDFOnce = onCall(
  {
    secrets: ["GEMINI_API_KEY"],
    memory: "512MiB", // Increased for PDF processing
  },
  async (request) => {
    const { pdf, userId } = request.data;

    if (!pdf || !userId) {
      throw new HttpsError("invalid-argument", "PDF and userId are required");
    }

    try {
      logger.info(`Processing PDF for user: ${userId}`);

      // Decode base64 PDF to buffer
      const pdfBuffer = Buffer.from(pdf, "base64");

      // Generate unique hash for the PDF content
      const pdfHash = createHash("sha256").update(pdfBuffer).digest("hex");
      logger.info(`Generated PDF hash: ${pdfHash}`);

      // Check cache in Firestore
      const docRef = db.collection("processedPdfs").doc(`${userId}_${pdfHash}`);
      const doc = await docRef.get();

      if (doc.exists) {
        logger.info(`Cached PDF found for user ${userId}, hash ${pdfHash}`);
        return doc.data();
      }

      // Extract text from PDF
      logger.info("Extracting text from PDF");
      const pdfParse = require("pdf-parse");
      const pdfData = await pdfParse(pdfBuffer);
      const extractedText = pdfData.text;
      logger.info(`Extracted text length: ${extractedText.length}`);

      // Generate summary using Gemini API
      logger.info("Generating summary via Gemini");
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new HttpsError("internal", "GEMINI_API_KEY not configured");
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const summaryPrompt = `Summarize the following document concisely:\n\n${extractedText}`;
      const summaryResult = await model.generateContent(summaryPrompt);
      const summary = summaryResult.response.text();

      // Note: Embeddings generation would require additional setup (e.g., using a vector service like Pinecone or OpenAI embeddings).
      // For now, storing text and summary. Embeddings can be generated on-demand or added later.

      // Store processed data in Firestore
      const processedData = {
        text: extractedText,
        summary,
        pdfHash,
        userId,
        createdAt: FieldValue.serverTimestamp(),
      };

      await docRef.set(processedData);
      logger.info(`Stored processed PDF for user ${userId}, hash ${pdfHash}`);

      return processedData;
    } catch (error: any) {
      logger.error("Error processing PDF:", error);
      throw new HttpsError(
        "internal",
        error.message || "Failed to process PDF",
      );
    }
  },
);

/**
 * Retrieves cached processed PDF data for a user.
 * @param userId - User's unique identifier
 * @param pdfHash - Hash of the PDF content
 * @returns Processed PDF data or null if not found
 */
export const getProcessedPDF = onCall(async (request) => {
  const { userId, pdfHash } = request.data;

  if (!userId || !pdfHash) {
    throw new HttpsError("invalid-argument", "userId and pdfHash are required");
  }

  try {
    logger.info(
      `Retrieving processed PDF for user: ${userId}, hash: ${pdfHash}`,
    );

    const docRef = db.collection("processedPdfs").doc(`${userId}_${pdfHash}`);
    const doc = await docRef.get();

    if (doc.exists) {
      logger.info("Cached PDF data found");
      return doc.data();
    } else {
      logger.info("No cached PDF data found");
      return null;
    }
  } catch (error: any) {
    logger.error("Error retrieving processed PDF:", error);
    throw new HttpsError(
      "internal",
      error.message || "Failed to retrieve processed PDF",
    );
  }
});

// Stream Gemini with cached text instead of files
export const streamGeminiWithText = onRequest(
  {
    secrets: ["GEMINI_API_KEY"],
    maxInstances: 10,
    concurrency: 80,
    memory: "256MiB",
  },
  async (req, res) => {
    const rateLimit = enforceRateLimit(
      buildRateLimitKey("streamGeminiWithText", undefined, req),
      RATE_LIMIT_MAX_REQUESTS,
      RATE_LIMIT_WINDOW_MS,
    );
    if (!rateLimit.allowed) {
      res.set("Retry-After", String(rateLimit.retryAfterSeconds));
      res.status(429).json({
        error: "Too many requests",
        retryAfterSeconds: rateLimit.retryAfterSeconds,
      });
      return;
    }

    const origin = req.headers.origin || "";

    if (ALLOWED_ORIGINS.includes(origin) || origin.includes("localhost")) {
      res.set("Access-Control-Allow-Origin", origin);
    } else {
      res.set("Access-Control-Allow-Origin", "*");
    }

    res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.set("Access-Control-Allow-Credentials", "true");
    res.set("Vary", "Origin");

    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }

    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    try {
      const { text, question, systemInstruction } = req.body;

      if (!text || typeof text !== "string") {
        res.status(400).json({ error: "Missing or invalid 'text'" });
        return;
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        logger.error("GEMINI_API_KEY not configured");
        res.status(500).json({ error: "Server configuration error" });
        return;
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        systemInstruction: systemInstruction || "You are a helpful assistant.",
      });

      const prompt = question
        ? `${text}\n\nQuestion: ${question}`
        : `Analyze this document: ${text}`;
      const result = await model.generateContentStream(prompt);

      // Set streaming headers
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.setHeader("Transfer-Encoding", "chunked");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.status(200);

      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        if (chunkText) {
          res.write(chunkText);
        }
      }

      res.end();
    } catch (error: any) {
      logger.error("Stream with text error:", error);
      if (!res.headersSent) {
        res
          .status(500)
          .json({ error: error.message || "Internal server error" });
      } else {
        res.end();
      }
    }
  },
);

export const getSecurePDFUrl = onCall(async (request) => {
  // Check if user is authenticated
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated");
  }

  const { listingId, pdfIndex } = request.data;

  if (!listingId || typeof pdfIndex !== "number") {
    throw new HttpsError("invalid-argument", "Missing listingId or pdfIndex");
  }

  try {
    const userId = request.auth.uid;

    // Check if user has purchased the item or is the seller
    const listingRef = db.collection("listings").doc(listingId);
    const listingSnap = await listingRef.get();

    if (!listingSnap.exists) {
      throw new HttpsError("not-found", "Listing not found");
    }

    const listingData = listingSnap.data();
    const isSeller = listingData?.sellerId === userId;

    let hasPurchased = false;
    if (!isSeller) {
      const purchaseQuery = await db
        .collection("purchases")
        .where("buyerId", "==", userId)
        .where("listingId", "==", listingId)
        .limit(1)
        .get();

      hasPurchased = !purchaseQuery.empty;
    }

    if (!isSeller && !hasPurchased) {
      throw new HttpsError("permission-denied", "Access denied");
    }

    // Generate signed URL
    const storage = getStorage();
    const fileName = listingData?.pdfUrls?.[pdfIndex];

    if (!fileName) {
      throw new HttpsError("not-found", "PDF not found");
    }

    // Extract path from URL
    const url = new URL(fileName);
    const path = decodeURIComponent(url.pathname.split("/o/")[1].split("?")[0]);

    const file = storage.bucket().file(path);

    // Generate signed URL valid for 1 hour
    const [signedUrl] = await file.getSignedUrl({
      action: "read",
      expires: Date.now() + 60 * 60 * 1000, // 1 hour
    });

    return { signedUrl };
  } catch (error) {
    logger.error("Get secure PDF URL error:", error);
    throw new HttpsError("internal", "Failed to generate secure URL");
  }
});

export const chatMessage = onCall(
  { secrets: ["GEMINI_API_KEY"] },
  async (request) => {
    const rateLimit = enforceRateLimit(
      buildRateLimitKey(
        "chatMessage",
        request.auth?.uid,
        (request as any).rawRequest,
      ),
      RATE_LIMIT_MAX_REQUESTS,
      RATE_LIMIT_WINDOW_MS,
    );
    if (!rateLimit.allowed) {
      throw new HttpsError(
        "resource-exhausted",
        `Too many requests. Try again in ${rateLimit.retryAfterSeconds}s.`,
      );
    }

    // Check if user is authenticated
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "User must be authenticated");
    }

    const { prompt, systemInstruction } = request.data;

    if (!prompt || typeof prompt !== "string") {
      throw new HttpsError("invalid-argument", "Missing or invalid prompt");
    }

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        logger.error("GEMINI_API_KEY not configured");
        throw new HttpsError("internal", "Server configuration error");
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        systemInstruction:
          systemInstruction || "You are a helpful AI assistant.",
      });

      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      return { text };
    } catch (error: any) {
      logger.error("Chat message error:", error);
      throw new HttpsError(
        "internal",
        error.message || "Failed to generate response",
      );
    }
  },
);

// Password Reset Function
export const resetPasswordWithCode = onCall(async (request) => {
  const { email, code, newPassword } = request.data;

  if (!email || !code || !newPassword) {
    throw new HttpsError(
      "invalid-argument",
      "Missing required fields: email, code, newPassword",
    );
  }

  if (newPassword.length < 6) {
    throw new HttpsError(
      "invalid-argument",
      "Password must be at least 6 characters",
    );
  }

  try {
    // Verify the reset code is valid and not expired
    const resetQuery = await db
      .collection("passwordResets")
      .where("email", "==", email)
      .where("code", "==", code)
      .where("used", "==", false)
      .limit(1)
      .get();

    if (resetQuery.empty) {
      throw new HttpsError("not-found", "Invalid or expired reset code");
    }

    const resetDoc = resetQuery.docs[0];
    const resetData = resetDoc.data();

    // Check if code is expired
    if (resetData.expiresAt && resetData.expiresAt.toDate() < new Date()) {
      throw new HttpsError("deadline-exceeded", "Reset code has expired");
    }

    // Get the user by email
    const user = await auth.getUserByEmail(email);

    // Update the user's password in Firebase Auth
    await auth.updateUser(user.uid, {
      password: newPassword,
    });

    // Mark the reset code as used
    await resetDoc.ref.update({
      used: true,
      completedAt: new Date(),
    });

    logger.log(`Password reset successful for user: ${user.uid}`);

    return {
      success: true,
      message: "Password reset successfully",
    };
  } catch (error: any) {
    logger.error("Password reset error:", error);

    if (error instanceof HttpsError) {
      throw error;
    }

    // Handle Firebase Auth errors
    if (error.code === "auth/user-not-found") {
      throw new HttpsError("not-found", "User not found");
    }

    throw new HttpsError(
      "internal",
      error.message || "Failed to reset password",
    );
  }
});
