# 🚀 Start Your Backend - Exact Commands

## ✅ Found Your Backend!

Your backend is located at:
```
C:\Users\Guest1\TriGO
```

---

## 📋 Step-by-Step Instructions

### Step 1: Open a NEW Terminal

**Keep your frontend terminal open!** Open a **NEW** terminal/command prompt.

### Step 2: Navigate to Backend Directory

Copy and paste this command:

```bash
cd C:\Users\Guest1\TriGO
```

### Step 3: Verify You're in the Right Place

```bash
dir artisan
```

You should see the `artisan` file listed.

### Step 4: Start the Laravel Server

```bash
php artisan serve
```

### Step 5: You Should See

```
Laravel development server started: http://localhost:8000
```

**✅ Keep this terminal open!** The server must keep running.

---

## 🔄 Alternative: If Port 8000 is Busy

If you get an error about port 8000 being in use:

```bash
php artisan serve --port=8001
```

Then update frontend `.env` file:
```bash
VITE_API_BASE_URL=http://localhost:8001
```

---

## ✅ Quick Test

After starting, test in browser:
- http://localhost:8000

Or test API:
- http://localhost:8000/api/login

---

## 📝 Summary

**Backend Directory:** `C:\Users\Guest1\TriGO`  
**Command to Start:** `php artisan serve`  
**Expected URL:** http://localhost:8000

---

## 🆘 If You Get Errors

### Error: "php: command not found"
- PHP is not installed or not in PATH
- Install PHP or use XAMPP/Laragon

### Error: "Could not open input file: artisan"
- You're not in the backend directory
- Make sure you ran `cd C:\Users\Guest1\TriGO` first

### Error: "Port 8000 is already in use"
- Use a different port: `php artisan serve --port=8001`
- Or close whatever is using port 8000

