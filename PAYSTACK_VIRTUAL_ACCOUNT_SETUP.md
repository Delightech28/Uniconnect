# Paystack Virtual Account Setup Guide

## What's New

✅ Users now automatically get a **Paystack Virtual Account** when they access "Receive Money"
✅ Account number, bank name, and account name are auto-generated
✅ Incoming transfers are automatically tracked and wallet updated

---

## Vercel Environment Variables Required

You need to add these to your Vercel project settings for the webhook to work:

### Firebase Admin Credentials
Go to **Vercel Dashboard → Settings → Environment Variables** and add:

1. **`FIREBASE_PROJECT_ID`**
   - Get from: Firebase Console → Project Settings → Project ID

2. **`FIREBASE_PRIVATE_KEY`**
   - Get from: Firebase Console → Project Settings → Service Accounts → Generate new private key
   - Copy the `private_key` value (remove `\n` and quotes)
   - Paste as: `-----BEGIN PRIVATE KEY-----\n...entire key...\n-----END PRIVATE KEY-----`

3. **`FIREBASE_CLIENT_EMAIL`**
   - Get from: Firebase Console → Project Settings → Service Accounts
   - Copy the `client_email` value

### Paystack Webhook Setup
1. Go to **Paystack Dashboard → Settings → API Keys & Webhooks**
2. Scroll to **Webhooks**
3. Set URL: `https://www.unispace.com.ng/api/webhook`
4. Events to listen for:
   - ✅ `transfer.success` (for virtual account transfers)
   - ✅ `charge.success` (for card funding)
5. Copy the **Webhook Signature** secret

Add to Vercel:
- **`PAYSTACK_WEBHOOK_SECRET`** = Your webhook signature from Paystack

---

## How It Works

### User Flow
1. User clicks "Receive Money"
2. Page checks if user has a virtual account
3. If not, auto-generates one via `/api/create-virtual-account`
4. Virtual account saved to Firebase
5. User can copy details and share with others

### Incoming Transfer Flow
1. Someone sends money to the user's virtual account
2. Paystack sends webhook to `/api/webhook`
3. Webhook verifies signature
4. Updates user's wallet balance in Firestore
5. Logs transaction in user's history

---

## API Endpoints

### POST `/api/create-virtual-account`
Creates a Paystack virtual account for a user

**Request:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "08012345678"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accountNumber": "1234567890",
    "bankName": "Wema Bank",
    "bankCode": "035",
    "accountName": "John Doe",
    "paystackCustomerId": 123456,
    "paystackAccountId": 789012
  }
}
```

### POST `/api/webhook`
Receives Paystack webhook events

**Handles:**
- `transfer.success` - Updates wallet balance
- `charge.success` - Updates wallet balance for card payments

---

## Testing

### Test Virtual Account Creation
1. Go to your app → Receive Money page
2. Check if virtual account is created
3. Copy and verify account details

### Test Webhook
1. Simulate a transfer in Paystack Dashboard
2. Check Vercel Function logs: Dashboard → Project → Functions → webhook
3. Verify wallet balance updated in Firestore

---

## Troubleshooting

### "Server configuration error" on Receive Money page
- Check if Firebase Admin credentials are set in Vercel
- Verify `FIREBASE_PROJECT_ID`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_CLIENT_EMAIL`

### Webhook not triggering
- Verify webhook URL in Paystack: Settings → Webhooks
- Check Paystack webhook signature matches `PAYSTACK_WEBHOOK_SECRET`
- View logs in Vercel: Functions tab

### Virtual account not saving
- Check Firestore rules allow writing to `users/{userId}`
- Verify user is authenticated

---

## Database Structure

Virtual accounts are stored in Firestore:

```
users/
  {userId}/
    virtualAccount: {
      accountNumber: "1234567890",
      bankName: "Wema Bank",
      bankCode: "035",
      accountName: "John Doe",
      paystackCustomerId: 123456,
      paystackAccountId: 789012
    }
    walletBalance: 50000
    transactions/
      {transactionId}/
        type: "credit"
        amount: 5000
        description: "Received via bank transfer"
        reference: "TRF-123456"
        timestamp: ...
        status: "completed"
```

---

## Next Steps

1. ✅ Add Firebase Admin credentials to Vercel
2. ✅ Add Paystack webhook URL
3. ✅ Test virtual account creation
4. ✅ Test webhook by sending test transfers
5. ✅ Deploy and monitor
