# 🚀 UPDATE BACKEND CORS - Quick Guide

## ⚡ FASTEST WAY TO UPDATE

### Step 1: Open Backend CORS File

Open this file in Notepad or your code editor:
```
C:\Users\Guest1\TriGO\config\cors.php
```

### Step 2: Find and Replace

**Find this line:**
```php
'http://localhost:5173',
```

**Replace with:**
```php
'http://localhost:5175',
```

**Also update if you see:**
```php
'http://127.0.0.1:5173',
```

**Replace with:**
```php
'http://127.0.0.1:5175',
```

### Step 3: Save the File

Save the file (Ctrl+S)

### Step 4: Clear Cache

Open a terminal in your backend directory and run:
```bash
cd C:\Users\Guest1\TriGO
php artisan config:clear
php artisan cache:clear
```

### Step 5: Restart Backend

If your backend is running:
1. Stop it (press Ctrl+C in the backend terminal)
2. Start it again: `php artisan serve`

---

## ✅ Complete CORS Configuration

Your `config/cors.php` should have this:

```php
<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => [
        'http://localhost:5175',  // ← Frontend on port 5175
        'http://127.0.0.1:5175',
    ],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,
];
```

---

## 🧪 Test After Update

1. **Go to:** http://localhost:5175
2. **Try logging in**
3. **Check browser console (F12)** - Should see no CORS errors

---

## 📋 Quick Checklist

- [ ] Opened `C:\Users\Guest1\TriGO\config\cors.php`
- [ ] Changed `5173` to `5175` in `allowed_origins`
- [ ] Saved the file
- [ ] Ran `php artisan config:clear`
- [ ] Ran `php artisan cache:clear`
- [ ] Restarted backend server
- [ ] Tested login at http://localhost:5175

---

## 🆘 Still Getting CORS Errors?

1. **Verify the file was saved** - Check the file again
2. **Check for typos** - Make sure it's exactly `5175`
3. **Clear all caches:**
   ```bash
   php artisan config:clear
   php artisan cache:clear
   php artisan route:clear
   php artisan view:clear
   ```
4. **Restart backend completely** - Stop and start again
5. **Check browser console** - Share the exact error message

---

## 💡 Pro Tip

You can also allow all origins for development (NOT for production):
```php
'allowed_origins' => ['*'],  // ⚠️ Development only!
```

But it's better to specify the exact port (5175).

