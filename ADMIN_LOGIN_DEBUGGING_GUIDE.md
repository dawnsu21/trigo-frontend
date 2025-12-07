# Admin Login Debugging Guide

## 🔍 How to Debug Admin Login Issues

### Step 1: Check Browser Console

Open your browser's Developer Tools (F12) and check the Console tab. Look for these logs:

1. **`[AdminLogin] Attempting login...`** - Login process started
2. **`[Auth] Login response received:`** - Backend response received
3. **`[AdminLogin] Login response:`** - Full response data
4. **`[AdminLogin] Role from response:`** - Role extracted from response
5. **`[AdminLogin] Extracted role:`** - Final role value
6. **`[AdminLogin] Normalized role:`** - Role after lowercase conversion
7. **`[AdminLogin] Navigating to admin dashboard...`** - Navigation attempt
8. **`[ProtectedRoute] Role mismatch:`** - If role doesn't match (if you see this, there's a problem)

### Step 2: Check Network Tab

1. Open Developer Tools → Network tab
2. Try logging in
3. Look for the `/api/login` request
4. Check the **Response** tab to see what the backend returned

**Expected Response Structure:**
```json
{
  "token": "your-token-here",
  "user": {
    "id": 1,
    "name": "Admin User",
    "email": "admin@example.com",
    "role": "admin"  // ← This should be "admin"
  },
  "role": "admin"  // ← Or role might be here
}
```

### Step 3: Check localStorage

1. Open Developer Tools → Application tab (Chrome) or Storage tab (Firefox)
2. Go to Local Storage → your domain
3. Check these keys:
   - `auth_token` - Should have a token value
   - `auth_role` - Should be `"admin"` (lowercase)

### Step 4: Common Issues and Fixes

#### Issue 1: Role is "Admin" (capital A) instead of "admin"
**Fix:** Already handled - code normalizes to lowercase

#### Issue 2: Role is missing from backend response
**Symptoms:** Console shows "No role found in response"
**Fix:** Backend needs to include role in login response

#### Issue 3: Role is in different location
**Symptoms:** Role exists but not being extracted
**Fix:** Code checks multiple locations: `data.role`, `data.user.role`, `data.roles[0]`

#### Issue 4: ProtectedRoute blocking access
**Symptoms:** Redirected to home page after login
**Check:** Console for `[ProtectedRoute] Role mismatch` warning
**Fix:** Ensure role in localStorage matches `'admin'` (lowercase)

### Step 5: Manual Testing

1. **Clear localStorage:**
   ```javascript
   // In browser console:
   localStorage.clear()
   ```

2. **Try logging in again**

3. **Check what's stored:**
   ```javascript
   // In browser console:
   console.log('Token:', localStorage.getItem('auth_token'));
   console.log('Role:', localStorage.getItem('auth_role'));
   ```

4. **Manually navigate:**
   ```javascript
   // In browser console (after login):
   window.location.href = '/admin/dashboard'
   ```

### Step 6: Backend Check

Verify your backend `/api/login` endpoint returns:

```json
{
  "token": "...",
  "user": {
    "id": 1,
    "email": "admin@example.com",
    "role": "admin"  // ← Must be "admin" (case doesn't matter, but lowercase preferred)
  },
  "role": "admin"  // ← Or include role at root level
}
```

### Step 7: What to Report

If it's still not working, please provide:

1. **Console logs** - Copy all `[AdminLogin]` and `[Auth]` logs
2. **Network response** - Copy the response from `/api/login` request
3. **localStorage values** - What's stored in `auth_token` and `auth_role`
4. **Error message** - Any error shown on the page
5. **What happens** - Does it redirect? Show error? Stay on login page?

## ✅ Expected Flow

1. User enters email/password
2. Clicks "Sign In"
3. Frontend calls `/api/login`
4. Backend returns token + role
5. Frontend saves token and role to localStorage
6. Frontend navigates to `/admin/dashboard`
7. ProtectedRoute checks role matches 'admin'
8. AdminDashboard loads

## 🐛 Current Fixes Applied

1. ✅ Case-insensitive role comparison
2. ✅ Role normalization to lowercase
3. ✅ Multiple role extraction locations checked
4. ✅ Enhanced logging for debugging
5. ✅ Auto-redirect if already authenticated
6. ✅ Role validation before navigation

## 📝 Next Steps

1. Try logging in and check the browser console
2. Share the console logs if it still doesn't work
3. Check the Network tab for the login request/response
4. Verify localStorage has the correct role stored

