# 🚀 QUICK FIX GUIDE - Backend Not Working

## ⚡ FASTEST SOLUTION

### Option 1: Use the Batch File (Easiest)

**Double-click this file:** `START_BACKEND.bat`

This will automatically:
- Navigate to your backend directory
- Start the Laravel server
- Keep it running

**⚠️ Keep the window open!**

---

### Option 2: Manual Start

**Open a NEW terminal and run:**

```bash
cd C:\Users\Guest1\TriGO
php artisan serve
```

**You should see:**
```
Laravel development server started: http://localhost:8000
```

**⚠️ Keep this terminal open!**

---

### Option 3: Use PowerShell Script

**Run in PowerShell:**
```powershell
.\FIX_BACKEND_NOW.ps1
```

This script will:
- Check if backend is running
- Guide you through starting it
- Test CORS configuration

---

## ✅ Verify Backend is Running

After starting, test in browser:
- **http://localhost:8000** - Should show Laravel welcome page or your app

Or test API:
- **http://localhost:8000/api/login** - Should return JSON (even if error, means server is running)

---

## 🔧 If You Get CORS Errors

After backend is running, if you see CORS errors in browser:

### Quick CORS Fix:

1. **Edit:** `C:\Users\Guest1\TriGO\config\cors.php`

2. **Update this section:**
   ```php
   'allowed_origins' => [
       'http://localhost:5175',  // ← Add this
   ],
   'supports_credentials' => true,  // ← Make sure this is true
   ```

3. **Clear cache:**
   ```bash
   cd C:\Users\Guest1\TriGO
   php artisan config:clear
   php artisan cache:clear
   ```

4. **Restart backend** (stop with Ctrl+C, then start again)

---

## 📋 Checklist

- [ ] Backend server started (`php artisan serve`)
- [ ] Backend accessible at http://localhost:8000
- [ ] CORS configured (if needed)
- [ ] Backend terminal still open
- [ ] Frontend can connect (test login)

---

## 🐛 Common Issues

### Issue: "php: command not found"
**Solution:** Install PHP or use XAMPP/Laragon

### Issue: "Port 8000 is already in use"
**Solution:** 
```bash
php artisan serve --port=8001
```
Then update frontend `.env`:
```
VITE_API_BASE_URL=http://localhost:8001
```

### Issue: "Could not open input file: artisan"
**Solution:** You're not in the backend directory. Run `cd C:\Users\Guest1\TriGO` first.

---

## 🆘 Still Not Working?

1. **Check browser console (F12)** - Look for error messages
2. **Check backend terminal** - Look for error messages
3. **Share the error** - Copy the exact error message

---

## 📝 Summary

**Backend Location:** `C:\Users\Guest1\TriGO`  
**Start Command:** `php artisan serve`  
**Expected URL:** http://localhost:8000  
**Frontend URL:** http://localhost:5175

**Both must run simultaneously!**

