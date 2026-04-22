/**
 * Security Utilities for Cloud Functions
 * Includes authentication, rate limiting, and input validation
 */

import { HttpsError } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";

const db = getFirestore();

// Store for rate limiting (in production, use Redis or Firestore)
const requestCounts = new Map();

/**
 * Verify that the request is from an authenticated user
 * @param {Object} request - Cloud Function request object
 * @returns {string} - User UID
 * @throws {HttpsError} - If not authenticated
 */
export function verifyAuthenticated(request) {
  if (!request.auth || !request.auth.uid) {
    throw new HttpsError(
      "unauthenticated",
      "User must be authenticated to perform this action",
    );
  }
  return request.auth.uid;
}

/**
 * Verify that the user has admin role
 * @param {string} userId - User UID
 * @throws {HttpsError} - If user is not admin
 */
export async function verifyAdmin(userId) {
  const userDoc = await db.collection("users").doc(userId).get();

  if (!userDoc.exists()) {
    throw new HttpsError("not-found", "User not found");
  }

  const userData = userDoc.data();
  if (userData.role !== "admin") {
    throw new HttpsError("permission-denied", "Admin privileges required");
  }
}

/**
 * Verify user owns a specific resource
 * @param {string} userId - User UID
 * @param {string} resourceId - Resource ID to check ownership
 * @param {string} collectionName - Collection name
 * @param {string} ownerField - Field that contains owner ID (default: 'userId')
 * @throws {HttpsError} - If user doesn't own the resource
 */
export async function verifyOwnership(
  userId,
  resourceId,
  collectionName,
  ownerField = "userId",
) {
  const doc = await db.collection(collectionName).doc(resourceId).get();

  if (!doc.exists()) {
    throw new HttpsError("not-found", "Resource not found");
  }

  const data = doc.data();
  if (data[ownerField] !== userId) {
    throw new HttpsError(
      "permission-denied",
      "You do not have permission to access this resource",
    );
  }
}

/**
 * Rate limiting: Check if user exceeded request limit
 * @param {string} userId - User UID
 * @param {number} limit - Max requests allowed (default: 100)
 * @param {number} windowMs - Time window in milliseconds (default: 60000 = 1 minute)
 * @throws {HttpsError} - If rate limit exceeded
 */
export function checkRateLimit(userId, limit = 100, windowMs = 60000) {
  const key = `${userId}:${Math.floor(Date.now() / windowMs)}`;
  const count = requestCounts.get(key) || 0;

  if (count >= limit) {
    throw new HttpsError(
      "resource-exhausted",
      "Too many requests. Please try again later.",
    );
  }

  requestCounts.set(key, count + 1);

  // Cleanup old entries
  if (requestCounts.size > 10000) {
    const now = Date.now();
    for (const [k] of requestCounts.entries()) {
      if (now - parseInt(k.split(":")[1]) * windowMs > windowMs * 2) {
        requestCounts.delete(k);
      }
    }
  }
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @throws {HttpsError} - If email is invalid
 */
export function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new HttpsError("invalid-argument", "Invalid email format");
  }
}

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @throws {HttpsError} - If password doesn't meet requirements
 */
export function validatePassword(password) {
  if (!password || password.length < 8) {
    throw new HttpsError(
      "invalid-argument",
      "Password must be at least 8 characters",
    );
  }

  if (!/[A-Z]/.test(password)) {
    throw new HttpsError(
      "invalid-argument",
      "Password must contain at least one uppercase letter",
    );
  }

  if (!/[a-z]/.test(password)) {
    throw new HttpsError(
      "invalid-argument",
      "Password must contain at least one lowercase letter",
    );
  }

  if (!/[0-9]/.test(password)) {
    throw new HttpsError(
      "invalid-argument",
      "Password must contain at least one number",
    );
  }
}

/**
 * Sanitize user input to prevent injection
 * @param {string} input - Input to sanitize
 * @returns {string} - Sanitized input
 */
export function sanitizeInput(input) {
  if (typeof input !== "string") {
    return "";
  }

  return input
    .trim()
    .replace(/[<>\"'`]/g, "") // Remove HTML/JS special chars
    .slice(0, 1000); // Limit length
}

/**
 * Log security events for monitoring
 * @param {string} eventType - Type of security event
 * @param {string} userId - User ID
 * @param {Object} details - Event details
 */
export async function logSecurityEvent(eventType, userId, details = {}) {
  try {
    await db.collection("securityLogs").add({
      eventType,
      userId,
      details,
      timestamp: new Date(),
      severity: details.severity || "info",
    });
  } catch (error) {
    console.error("Failed to log security event:", error);
  }
}

/**
 * CORS-safe response headers
 * @param {string} origin - Request origin
 * @returns {Object} - Headers object
 */
export function getCorsHeaders(origin) {
  const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "https://unispace.app",
    "https://www.unispace.app",
  ];

  const headers = {
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "3600",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  };

  if (allowedOrigins.includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }

  return headers;
}
