# Firebase Storage Rules Deployment Instructions

## What You Need to Do:

### Option 1: Deploy via Firebase CLI (Recommended)

1. **Install Firebase CLI** (if not already installed):
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**:
   ```bash
   firebase login
   ```
   This will open your browser for authentication

3. **Initialize Firebase in your project** (if not done):
   ```bash
   firebase init
   ```
   - Select "Firestore" and "Storage"
   - Choose your project: `uniconnect-981ed`
   - Use default settings for file locations

4. **Deploy the storage rules**:
   ```bash
   firebase deploy --only storage
   ```

### Option 2: Deploy via Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: `uniconnect-981ed`
3. Go to **Storage** → **Rules**
4. Copy the content from `storage.rules` file in this project
5. Paste it in the rules editor
6. Click **Publish**

## What These Rules Do:

✅ **Allows authenticated users** to upload their own avatar images
✅ **Prevents unauthorized uploads** to other users' folders
✅ **Allows read access** for authenticated users to see avatars
✅ **Denies all other access** by default for security
✅ **No upgrade needed** - Works on Spark (free) plan

## If You Get "401 Unauthorized" Error:

This means the user is not authenticated. Make sure:
1. User is logged in before uploading
2. User's UID is included in the file path: `avatars/{userId}_...`
3. `auth.currentUser` is not null

## Troubleshooting:

- **CORS Error**: After deploying rules, clear browser cache (Ctrl+Shift+Delete) and try again
- **Upload Still Fails**: Check Firebase Console Logs for detailed error
- **Rules Won't Save**: Make sure you have Editor role in Firebase project

