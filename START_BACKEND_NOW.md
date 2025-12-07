# 🚨 URGENT: Backend Server is NOT Running

## ❌ Current Status
**Backend Server:** NOT RUNNING  
**Tested Ports:** 8000, 3000, 8080, 8001, 5000  
**Result:** None of these ports are responding

---

## ✅ IMMEDIATE ACTION REQUIRED

### Step 1: Open a NEW Terminal/Command Prompt

**DO NOT close your frontend terminal!** Open a **NEW** terminal window.

### Step 2: Navigate to Your Backend Directory

```bash
# Replace with your actual backend path
cd C:\path\to\your\backend
```

**Common locations:**
- `C:\Users\Guest1\my-backend`
- `C:\xampp\htdocs\your-project`
- `C:\laragon\www\your-project`
- `C:\wamp64\www\your-project`

### Step 3: Start the Laravel Server

```bash
php artisan serve
```

**You should see:**
```
Laravel development server started: http://localhost:8000
```

### Step 4: Keep This Terminal Open!

**DO NOT close this terminal!** The server must keep running.

---

## 🔍 How to Find Your Backend Directory

### Option 1: If you know where it is
Just navigate there and run `php artisan serve`

### Option 2: Search for it
```powershell
# In PowerShell, search for artisan file
Get-ChildItem -Path C:\ -Filter "artisan" -Recurse -ErrorAction SilentlyContinue | Select-Object -First 5 FullName
```

### Option 3: Check common locations
- Check your project folder
- Check where you cloned/downloaded the backend
- Check your IDE's project list

---

## ✅ Verification Steps

### After Starting Backend:

1. **Check the terminal** - Should show:
   ```
   Laravel development server started: http://localhost:8000
   ```

2. **Test in browser:**
   - Open: http://localhost:8000
   - You should see Laravel welcome page or your app

3. **Test API endpoint:**
   - Open: http://localhost:8000/api/login
   - You might see an error (that's OK - means server is running)

4. **Check frontend:**
   - Go back to your frontend
   - Try logging in
   - Check browser console (F12) for errors

---

## 🐛 Common Issues

### Issue 1: "php: command not found"
**Solution:** PHP is not installed or not in PATH
- Install PHP or add it to your system PATH
- Or use XAMPP/Laragon which includes PHP

### Issue 2: "Could not open input file: artisan"
**Solution:** You're not in the backend directory
- Make sure you're in the Laravel project root (where `artisan` file is)

### Issue 3: "Port 8000 is already in use"
**Solution:** Use a different port:
```bash
php artisan serve --port=8001
```
Then update frontend `.env`:
```bash
VITE_API_BASE_URL=http://localhost:8001
```

### Issue 4: "Class 'PDO' not found"
**Solution:** PHP PDO extension not enabled
- Enable `php_pdo_mysql` in your PHP configuration

---

## 📋 Quick Checklist

- [ ] Opened NEW terminal (frontend still running in first terminal)
- [ ] Navigated to backend directory
- [ ] Ran `php artisan serve`
- [ ] Saw "Laravel development server started" message
- [ ] Tested http://localhost:8000 in browser
- [ ] Backend terminal is still open and running
- [ ] Frontend can now connect to backend

---

## 🆘 Still Not Working?

### Check These:

1. **Is PHP installed?**
   ```bash
   php -v
   ```
   Should show PHP version. If not, install PHP.

2. **Is Laravel installed?**
   ```bash
   php artisan --version
   ```
   Should show Laravel version.

3. **Is the backend directory correct?**
   - Should have `artisan` file
   - Should have `composer.json` file
   - Should have `app` folder

4. **Are there any error messages?**
   - Check the terminal output
   - Look for red error messages
   - Share the error if you see one

---

## 📞 Next Steps After Backend Starts

Once backend is running:

1. **Test CORS** (see below)
2. **Try logging in** from frontend
3. **Check browser console** for any errors
4. **Check Network tab** to see API requests

---

## 🔧 CORS Configuration (After Backend Starts)

Once backend is running, verify CORS in `config/cors.php`:

```php
'allowed_origins' => [
    'http://localhost:5173',
],
'supports_credentials' => true,
```

Then clear cache:
```bash
php artisan config:clear
php artisan cache:clear
```

---

## 💡 Remember

- **Two terminals needed:**
  1. Frontend: `npm run dev` (running on port 5173)
  2. Backend: `php artisan serve` (running on port 8000)

- **Both must run simultaneously!**

- **Don't close either terminal!**

