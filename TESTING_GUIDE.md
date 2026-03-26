# 🧪 UniConnect - Quick Testing Guide

**Last Updated:** March 19, 2026

---

## 🎯 Critical Fixes Verification

### Test 1: Follow System (Race Condition Fix)
**Goal:** Verify follow counts are accurate under concurrent operations

**Steps:**
1. Open app in 2 different browser windows
2. User A navigates to User B's profile
3. In both windows, simultaneously click "Follow"
4. Check that User B's follower count increases by exactly 1
5. Refresh page to confirm database state

**Expected Result:** Count = 1 (not 2)  
**✅ Pass / ❌ Fail** ___

---

### Test 2: Messaging System (Promise Error Handling)
**Goal:** Verify conversations load even if some fail

**Steps:**
1. Clear browser localStorage
2. Open InboxPage
3. Wait for conversations to load
4. Check browser console for errors
5. Verify conversations display correctly

**Expected Result:** Conversations load without crashes  
**✅ Pass / ❌ Fail** ___

---

### Test 3: Profile Page (Null State Fix)
**Goal:** Verify profile loads without crashes

**Steps:**
1. Navigate to any user's profile
2. Wait for profile data to load
3. Check browser console for crashes
4. Verify stats display (followers, posts, etc.)
5. Navigate back and forth

**Expected Result:** No crashes, all stats display  
**✅ Pass / ❌ Fail** ___

---

### Test 4: Conversation Creation (Race Condition)
**Goal:** Verify no duplicate conversations created

**Steps:**
1. Open InboxPage in 2 browser windows
2. User A and User B both open messages
3. Both click to start/open same conversation rapidly
4. Check InboxPage for duplicate conversation entries
5. Check Firestore console for duplicate docs

**Expected Result:** Only 1 conversation exists  
**✅ Pass / ❌ Fail** ___

---

### Test 5: Google Sign-In (Null Reference Fix)
**Goal:** Verify Google Sign-In handles errors properly

**Steps:**
1. Test successful Google login
2. Test canceling Google popup (popup-closed-by-user)
3. Check browser console for errors
4. Verify proper error messages display

**Expected Result:** Proper error handling, no crashes  
**✅ Pass / ❌ Fail** ___

---

### Test 6: Email Validation (New Validation)
**Goal:** Verify email validation works

**Steps:**
1. Try registering with invalid emails:
   - "abc" (no @)
   - "abc@" (no domain)
   - "abc@domain" (no TLD)
   - "abc @domain.com" (space)
2. Try with valid email: "test123@example.com"
3. Check for validation error messages

**Expected Result:** Invalid rejected with message, valid accepted  
**✅ Pass / ❌ Fail** ___

---

## 📱 Core Features Testing

### Authentication
- [ ] Register with email/password
- [ ] Register with Google
- [ ] Login with email/password
- [ ] Login with Google
- [ ] Password reset flow
- [ ] Email verification flow
- [ ] Logout functionality

### Messaging (Priority Feature)
- [ ] Send text message
- [ ] Receive message notification
- [ ] Send file attachment
- [ ] Send GIF
- [ ] See typing indicator
- [ ] Read receipts (✓✓ for read)
- [ ] Delete conversation
- [ ] Search conversations
- [ ] View conversation history

### Profile
- [ ] View own profile
- [ ] Edit profile information
- [ ] Upload/change avatar
- [ ] View other user profile
- [ ] Follow/unfollow user
- [ ] Like/unlike profile
- [ ] Send connection request
- [ ] Accept/reject connections
- [ ] View connections list

### Posts & Feed
- [ ] Create new post
- [ ] Like/unlike post
- [ ] Comment on post
- [ ] Delete own post/comment
- [ ] View feed
- [ ] Search posts
- [ ] View user's posts

### Notifications
- [ ] Receive like notification
- [ ] Receive follow notification
- [ ] Receive message notification
- [ ] Mark notification as read
- [ ] View notification history

---

## 🔍 Browser Console Checks

### What to Look For:
```javascript
// ❌ BAD - These should NOT appear:
Uncaught TypeError: Cannot read property
Uncaught ReferenceError: ...undefined
Promise rejections
Failed to fetch
Network 500 errors

// ✅ GOOD - These are fine:
[verificationService] ...
[InboxPage] ...
Console logs with useful info
No red X errors
```

### Quick Console Check:
```javascript
// Run in browser console to see logs
localStorage.setItem('logLevel', 'debug');
// Then perform actions and watch console
```

---

## ⚡ Performance Checks

### Message Loading
- [ ] Conversations load within 2 seconds
- [ ] Switching between conversations is smooth
- [ ] No lag when typing message
- [ ] File upload shows progress

### Profile Loading
- [ ] Profile page loads within 2 seconds
- [ ] Stats display immediately
- [ ] Posts load with pagination
- [ ] Scrolling is smooth

### Feed/Posts
- [ ] Feed loads within 3 seconds
- [ ] Infinite scroll works smoothly
- [ ] Like/unlike feels instant
- [ ] Comment submission is quick

---

## 🐛 Bug Report Format

When you find a bug, report it as:

```
Title: [COMPONENT] Brief description

Severity: Critical / High / Medium / Low

Steps to Reproduce:
1. ...
2. ...
3. ...

Expected Result:
...

Actual Result:
...

Browser: Chrome/Firefox/Safari
OS: Windows/Mac/iOS/Android

Screenshots/Video:
[If applicable]

Console Errors:
[Copy-paste any browser console errors]

Environment:
- Feature: [Messaging/Profile/Feed/Auth]
- User Type: [Student/Guest]
- Network: [Public WiFi/Home/5G]
```

---

## 📊 Test Results Summary

| Test | Status | Date | Tester | Notes |
|------|--------|------|--------|-------|
| Follow Race Condition | ✅/❌ | | | |
| Promise Error Handling | ✅/❌ | | | |
| Profile Null State | ✅/❌ | | | |
| Conversation Duplication | ✅/❌ | | | |
| Google Sign-In | ✅/❌ | | | |
| Email Validation | ✅/❌ | | | |
| Messaging | ✅/❌ | | | |
| Profile | ✅/❌ | | | |
| Posts/Feed | ✅/❌ | | | |
| Notifications | ✅/❌ | | | |

---

## 🚀 Ready for Launch When:

- ✅ All critical tests PASS
- ✅ No console errors in major features
- ✅ Messaging works smoothly (priority)
- ✅ No data loss observed
- ✅ Error messages are helpful
- ✅ Performance is acceptable
- ✅ No security issues found

---

## 📞 Need Help?

If you find issues:
1. Check browser console (F12)
2. Note the exact steps to reproduce
3. Try in incognito/private mode to eliminate caching
4. Record user ID and timestamp
5. Include error screenshots

---

**Good luck with testing! 🎯**
