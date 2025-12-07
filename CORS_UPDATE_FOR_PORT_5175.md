# 🔧 CORS Configuration Update - Port 5175

## ⚠️ IMPORTANT: Update Backend CORS Configuration

Your frontend is running on **port 5175**, not 5173. You need to update your backend CORS configuration.

---

## ✅ Quick Fix

### Step 1: Edit Backend CORS Config

Navigate to your backend and edit:
```
C:\Users\Guest1\TriGO\config\cors.php
```

### Step 2: Update Allowed Origins

Change from:
```php
'allowed_origins' => [
    'http://localhost:5173',  // ❌ Wrong port
],
```

To:
```php
'allowed_origins' => [
    'http://localhost:5175',  // ✅ Correct port
    'http://127.0.0.1:5175',
],
```

### Step 3: Clear Cache

```bash
cd C:\Users\Guest1\TriGO
php artisan config:clear
php artisan cache:clear
```

### Step 4: Restart Backend

Stop the backend (Ctrl+C) and restart:
```bash
php artisan serve
```

---

## ✅ Complete CORS Configuration

Your `config/cors.php` should look like this:

```php
<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => [
        'http://localhost:5175',  // ← Your frontend URL
        'http://127.0.0.1:5175',
    ],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,  // ← Important for authentication
];
```

---

## 🧪 Test CORS Configuration

After updating, test in browser console (F12):

```javascript
fetch('http://localhost:8000/api/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({email: 'test@test.com', password: 'test'})
})
.then(r => {
  console.log('✅ CORS OK - Status:', r.status);
  console.log('CORS Header:', r.headers.get('Access-Control-Allow-Origin'));
})
.catch(e => console.error('❌ CORS Error:', e.message))
```

You should see:
- ✅ CORS OK - Status: 401 or 422 (means endpoint works)
- ✅ CORS Header: http://localhost:5175

---

## 📋 Checklist

- [ ] Updated `config/cors.php` with port 5175
- [ ] Cleared config cache (`php artisan config:clear`)
- [ ] Cleared application cache (`php artisan cache:clear`)
- [ ] Restarted backend server
- [ ] Tested CORS in browser console
- [ ] No CORS errors in browser

---

## 🆘 If Still Getting CORS Errors

1. **Verify backend is running:**
   - Open http://localhost:8000 in browser

2. **Check CORS config file:**
   - Make sure you saved the changes
   - Verify the port is 5175 (not 5173)

3. **Clear all caches:**
   ```bash
   php artisan config:clear
   php artisan cache:clear
   php artisan route:clear
   php artisan view:clear
   ```

4. **Restart backend completely:**
   - Stop with Ctrl+C
   - Start again: `php artisan serve`

5. **Check browser console:**
   - Look for exact CORS error message
   - Share the error if it persists

---

## 📝 Summary

**Frontend:** http://localhost:5175  
**Backend:** http://localhost:8000  
**CORS Config:** Must allow `http://localhost:5175`

