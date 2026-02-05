# Paystack Wallet Funding Integration Guide

## Overview
This guide explains how the Paystack integration works in the UniWallet funding feature and how to implement it properly in your application.

## How It Works

### 1. **Flow Diagram**
```
User Inputs Amount → User Selects Bank → User Enters Account Number 
→ Verify Account (Paystack API) → User Pays via Card (Paystack Inline) 
→ Payment Verified → Wallet Credited → Transaction Logged
```

### 2. **Components Overview**

#### **FundWalletPage.jsx**
- Main UI component where users fund their wallet
- Handles form inputs (amount, bank, account number)
- Triggers account verification
- Initiates payment flow

#### **paystackService.js**
- Service layer for all Paystack API interactions
- Handles bank fetching, account verification, and payments

## Setup Instructions

### Step 1: Get Paystack Keys
1. Go to [Paystack Dashboard](https://dashboard.paystack.com)
2. Sign up/Login to your account
3. Navigate to **Settings → API Keys & Webhooks**
4. Copy your **Public Key** and **Secret Key**

### Step 2: Set Environment Variables
Create a `.env` file in your project root:

```env
REACT_APP_PAYSTACK_PUBLIC_KEY=pk_live_your_public_key_here
REACT_APP_PAYSTACK_SECRET_KEY=sk_live_your_secret_key_here
```

**Never commit secret keys to version control!**

### Step 3: Add Paystack Script to index.html (Optional)
The FundWalletPage loads the Paystack script dynamically, but you can also add it to your `index.html`:

```html
<script src="https://js.paystack.co/v1/inline.js"></script>
```

## Features Explained

### 1. **Fetch Banks**
```javascript
const banks = await fetchBanks();
```
- Fetches all available Nigerian banks from Paystack
- Used to populate the bank selection dropdown
- Called on component mount

### 2. **Verify Account Number**
```javascript
const accountDetails = await verifyAccountNumber(accountNumber, bankCode);
```
- Verifies that the account number belongs to the selected bank
- Returns account owner's name
- Prevents invalid payments

### 3. **Charge with Paystack (Inline)**
```javascript
const paymentResult = await chargeWithPaystackInline(email, amount, publicKey);
```
- Opens Paystack payment modal
- User enters card details
- Returns transaction reference on success

### 4. **Update Wallet Balance**
After successful payment:
- User's `walletBalance` is updated in Firebase
- Transaction is logged in Firestore under user's transactions
- Bank account is saved for future transactions

## API Endpoints Used

### Fetch Banks
- **URL:** `https://api.paystack.co/bank`
- **Method:** GET
- **Headers:** Authorization: Bearer {SECRET_KEY}
- **Response:** List of all Nigerian banks with codes

### Verify Account
- **URL:** `https://api.paystack.co/bank/resolve?account_number={account}&bank_code={code}`
- **Method:** GET
- **Headers:** Authorization: Bearer {SECRET_KEY}
- **Response:** Account details including account name

### Initialize Payment (Backend)
- **URL:** `https://api.paystack.co/transaction/initialize`
- **Method:** POST
- **Headers:** 
  - Authorization: Bearer {SECRET_KEY}
  - Content-Type: application/json
- **Body:** 
  ```json
  {
    "email": "user@example.com",
    "amount": 50000,
    "reference": "unique_reference"
  }
  ```

### Verify Payment
- **URL:** `https://api.paystack.co/transaction/verify/{reference}`
- **Method:** GET
- **Headers:** Authorization: Bearer {SECRET_KEY}
- **Response:** Transaction status and details

## Implementation Details

### Why Two Approaches?

**1. Inline Charge (Currently Used)**
```javascript
chargeWithPaystackInline(email, amount, publicKey)
```
- User enters card details directly
- Simpler UI flow
- No backend payment initialization needed
- Best for quick transactions

**2. Initialize + Verify (Alternative)**
```javascript
const payment = await initializePayment(email, amount, reference);
// Redirect user to payment.authorization_url
// After payment, verify with verifyPayment(reference)
```
- More control over payment flow
- Can redirect to Paystack page
- Better for web applications

### Database Structure

```
users/{userId}
├── walletBalance: number
├── lastFundingDate: timestamp
└── transactions/{transactionId}
    ├── type: "credit" | "debit"
    ├── title: string
    ├── amount: number
    ├── reference: string
    ├── paystackTransactionId: number
    ├── accountNumber: string
    ├── bankCode: string
    ├── timestamp: timestamp
    └── status: "completed" | "pending" | "failed"

users/{userId}/bankAccounts/{accountId}
├── accountNumber: string
├── accountName: string
├── bankCode: string
├── bankName: string
├── savedAt: timestamp
└── isDefault: boolean
```

## Error Handling

The system handles these scenarios:

1. **Network Error:** Shows retry message
2. **Invalid Account:** Verification fails with error message
3. **Payment Cancelled:** User cancels payment modal
4. **Payment Failed:** Shows error and allows retry
5. **Firebase Update Error:** Logs error and shows message

## Security Considerations

1. **Never expose Secret Key in Frontend**
   - Secret key should only be used on backend
   - Public key is safe for client-side use

2. **Verify Payments on Backend**
   - Always verify Paystack transactions on your backend before crediting wallet
   - Never trust client-side verification alone

3. **Use HTTPS**
   - All Paystack communications should be over HTTPS

4. **Validate Amounts**
   - Validate amount ranges before payment
   - Verify amounts match on backend

## Testing

### Test Cards (Paystack Sandbox)
Enable sandbox mode in Paystack Dashboard:

```
Card Number: 4084084084084081
Expiry: Any future date
CVV: Any 3 digits
OTP: 123456
```

### Test with Different Responses
Paystack provides specific cards to trigger different responses:
- **4084084084084081** - Success
- **5061020000000000** - Use any expiry and CVV

## Common Issues

### Issue: "Paystack script not loaded"
**Solution:** 
- Make sure internet is connected (CDN access)
- Check browser console for errors
- Verify PUBLIC_KEY is correct

### Issue: "Failed to fetch banks"
**Solution:**
- Verify SECRET_KEY is correct
- Check Paystack API status page
- Ensure SECRET_KEY has proper permissions

### Issue: "Account verification failed"
**Solution:**
- User entered wrong account number
- Selected wrong bank
- Account doesn't exist in that bank

### Issue: "Payment shows in Paystack but not in app"
**Solution:**
- Implement webhook verification (Paystack can notify your backend)
- Add backend verification endpoint
- Log all transaction references for audit

## Next Steps: Backend Verification (Recommended)

For production, implement backend verification:

```javascript
// Backend endpoint to verify payment
app.post('/api/verify-payment', async (req, res) => {
  const { reference } = req.body;
  
  const response = await fetch(
    `https://api.paystack.co/transaction/verify/${reference}`,
    {
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` }
    }
  );
  
  const data = await response.json();
  
  if (data.data.status === 'success') {
    // Credit user's wallet in database
    // Log transaction
  }
});
```

## Webhook Setup (For Completed Payments)

1. Go to Paystack Dashboard → Settings → Webhooks
2. Set webhook URL: `https://yourdomain.com/api/paystack-webhook`
3. Select events: **charge.success**, **transfer.success**
4. Paystack will POST to your webhook when payments complete

Example webhook handler:
```javascript
app.post('/api/paystack-webhook', (req, res) => {
  const { event, data } = req.body;
  
  if (event === 'charge.success') {
    const { reference, amount } = data;
    // Update user's wallet in database
    // Verify reference against Firestore
  }
  
  res.sendStatus(200);
});
```

## References
- [Paystack Documentation](https://paystack.com/docs)
- [Paystack API Reference](https://paystack.com/docs/api/)
- [Bank List API](https://paystack.com/docs/api/bank/)
- [Account Verification](https://paystack.com/docs/api/bank/#resolve)
- [Transactions API](https://paystack.com/docs/api/transaction/)
