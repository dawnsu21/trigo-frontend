# 🔧 Backend CORS Configuration Fix

## Quick Fix for CORS Issues

If you're getting CORS errors, follow these steps:

---

## Step 1: Locate CORS Configuration File

Navigate to your backend directory:
```bash
cd C:\Users\Guest1\TriGO
```

The CORS configuration file is at:
```
config/cors.php
```

---

## Step 2: Update CORS Configuration

Open `config/cors.php` and ensure it has these settings:

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

## Step 3: Clear Configuration Cache

After updating the CORS config, clear the cache:

```bash
php artisan config:clear
php artisan cache:clear
```

---

## Step 4: Restart Backend Server

Stop the current server (Ctrl+C) and restart:

```bash
php artisan serve
```

---

## Alternative: If Using Laravel 11+

If you're using Laravel 11, CORS might be configured in `bootstrap/app.php`:

```php
->withMiddleware(function (Middleware $middleware) {
    $middleware->api(prepend: [
        \Illuminate\Http\Middleware\HandleCors::class,
    ]);
    
    // Or configure CORS here:
    $middleware->validateCsrfTokens(except: [
        'api/*',
    ]);
})
```

---

## Verify CORS is Working

### Test 1: Browser Console

Open browser console (F12) and run:

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
  console.log('CORS Headers:', {
    'Access-Control-Allow-Origin': r.headers.get('Access-Control-Allow-Origin'),
  });
})
.catch(e => console.error('❌ CORS Error:', e.message))
```

### Test 2: PowerShell

```powershell
$body = @{email='test@test.com'; password='test'} | ConvertTo-Json
$headers = @{'Content-Type'='application/json'; 'Origin'='http://localhost:5175'}
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/api/login" -Method POST -Headers $headers -Body $body
    Write-Host "✅ CORS Working"
} catch {
    if ($_.Exception.Response.Headers['Access-Control-Allow-Origin']) {
        Write-Host "✅ CORS Configured: $($_.Exception.Response.Headers['Access-Control-Allow-Origin'])"
    } else {
        Write-Host "❌ CORS NOT Configured"
    }
}
```

---

## Common CORS Errors

### Error: "No 'Access-Control-Allow-Origin' header"
**Solution:** Update `allowed_origins` in `config/cors.php`

### Error: "Credentials flag is true, but Access-Control-Allow-Credentials is not"
**Solution:** Set `supports_credentials` to `true` in CORS config

### Error: "Method POST is not allowed"
**Solution:** Ensure `allowed_methods` includes `['*']` or `['POST', 'GET', 'PUT', 'DELETE', 'OPTIONS']`

### Error: "Request header field Authorization is not allowed"
**Solution:** Ensure `allowed_headers` includes `['*']` or `['Authorization', 'Content-Type']`

---

## Quick Checklist

- [ ] Updated `config/cors.php`
- [ ] Set `allowed_origins` to include `http://localhost:5175`
- [ ] Set `supports_credentials` to `true`
- [ ] Ran `php artisan config:clear`
- [ ] Ran `php artisan cache:clear`
- [ ] Restarted backend server
- [ ] Tested CORS with browser console or PowerShell

---

## Still Not Working?

1. **Check backend logs:**
   ```bash
   tail -f storage/logs/laravel.log
   ```

2. **Verify middleware is registered:**
   - Check `bootstrap/app.php` (Laravel 11)
   - Or `app/Http/Kernel.php` (Laravel 10)

3. **Check if CORS package is installed:**
   ```bash
   composer show | grep cors
   ```

4. **Try allowing all origins (for testing only):**
   ```php
   'allowed_origins' => ['*'],  // ⚠️ Only for development!
   ```

---

## Production Notes

For production, **never** use `'*'` for `allowed_origins`. Always specify exact domains:

```php
'allowed_origins' => [
    'https://yourdomain.com',
    'https://www.yourdomain.com',
],
```

