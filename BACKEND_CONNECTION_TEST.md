# 🔍 Backend Connection & CORS Test Results

## Test Results

Run this test to check your backend:

```powershell
# Test 1: Check if backend is running
Invoke-WebRequest -Uri "http://localhost:8000" -Method GET -TimeoutSec 5

# Test 2: Check CORS preflight
$headers = @{
    'Origin'='http://localhost:5173'
    'Access-Control-Request-Method'='POST'
    'Access-Control-Request-Headers'='Content-Type'
}
Invoke-WebRequest -Uri "http://localhost:8000/api/login" -Method OPTIONS -Headers $headers

# Test 3: Test actual API call
$body = @{email='test@test.com'; password='test'} | ConvertTo-Json
$headers = @{
    'Content-Type'='application/json'
    'Origin'='http://localhost:5173'
}
Invoke-WebRequest -Uri "http://localhost:8000/api/login" -Method POST -Headers $headers -Body $body
```

## Expected Results

### ✅ Backend Running
- Status: 200 OK (or any status code means server is running)
- If you get a timeout or connection refused, backend is NOT running

### ✅ CORS Configured
- `Access-Control-Allow-Origin: http://localhost:5173` (or `*`)
- `Access-Control-Allow-Methods: POST, GET, PUT, DELETE, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type, Authorization, Accept`
- `Access-Control-Allow-Credentials: true` (if using cookies/auth)

### ✅ API Endpoint Working
- Status: 401, 422, or 404 (means endpoint exists)
- Status: 0 or timeout (means endpoint doesn't exist or CORS blocking)

## Common Issues

### Issue 1: Backend Not Running
**Solution:**
```bash
cd path/to/backend
php artisan serve
```

### Issue 2: CORS Not Configured
**Solution:** Update `config/cors.php` in Laravel:
```php
'paths' => ['api/*', 'sanctum/csrf-cookie'],
'allowed_methods' => ['*'],
'allowed_origins' => ['http://localhost:5173'],
'allowed_origins_patterns' => [],
'allowed_headers' => ['*'],
'exposed_headers' => [],
'max_age' => 0,
'supports_credentials' => true,
```

### Issue 3: CORS Middleware Not Applied
**Solution:** Check `bootstrap/app.php` or `app/Http/Kernel.php`:
```php
// Ensure CORS middleware is registered
\Illuminate\Http\Middleware\HandleCors::class,
```

## Browser Test

1. Open browser console (F12)
2. Go to Network tab
3. Try to login
4. Check the request:
   - **Red request** = CORS error or connection failed
   - **Yellow/Orange request** = CORS preflight failed
   - **Green request** = Success (even if 401/422 is OK, means CORS works)

## Manual CORS Test in Browser

Open browser console and run:
```javascript
fetch('http://localhost:8000/api/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({email: 'test@test.com', password: 'test'})
})
.then(r => console.log('✅ CORS OK - Status:', r.status))
.catch(e => console.error('❌ CORS Error:', e.message))
```

