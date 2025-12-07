# 🔧 Backend Troubleshooting Guide

## 🚨 Common Backend Issues

### Issue 1: Backend Server Not Running

**Symptoms:**
- Network errors in browser console
- "Cannot connect to server" messages
- 404 errors on API calls

**Solution:**
1. Navigate to your backend directory
2. Start the Laravel server:
   ```bash
   php artisan serve
   ```
3. Verify it's running on `http://localhost:8000`

---

### Issue 2: Backend Running on Different Port

**Symptoms:**
- Frontend can't connect to backend
- CORS errors
- Network errors

**Solution:**

**Option A: Change Backend Port to 8000**
```bash
php artisan serve --port=8000
```

**Option B: Update Frontend Config**

1. Create `.env` file in frontend root:
   ```bash
   VITE_API_BASE_URL=http://localhost:YOUR_PORT
   ```

2. Example if backend is on port 3000:
   ```bash
   VITE_API_BASE_URL=http://localhost:3000
   ```

3. Restart frontend dev server

---

### Issue 3: CORS (Cross-Origin Resource Sharing) Errors

**Symptoms:**
- Browser console shows: "CORS policy: No 'Access-Control-Allow-Origin' header"
- Network requests fail with CORS errors

**Solution:**

**In your Laravel backend, check `config/cors.php`:**

```php
'paths' => ['api/*', 'sanctum/csrf-cookie'],
'allowed_methods' => ['*'],
'allowed_origins' => ['http://localhost:5173'], // Add your frontend URL
'allowed_origins_patterns' => [],
'allowed_headers' => ['*'],
'exposed_headers' => [],
'max_age' => 0,
'supports_credentials' => true,
```

**Or in your middleware/app configuration, ensure:**
```php
// In app/Http/Kernel.php or bootstrap/app.php
'allowed_origins' => ['http://localhost:5173'],
```

---

### Issue 4: Database Not Set Up

**Symptoms:**
- 500 errors from backend
- Database connection errors

**Solution:**
```bash
# In backend directory
php artisan migrate
php artisan db:seed  # If you have seeders
```

---

### Issue 5: Backend Routes Not Working

**Symptoms:**
- 404 errors on API endpoints
- "Route not found" errors

**Solution:**

1. **Check routes exist:**
   ```bash
   php artisan route:list
   ```

2. **Verify API routes are registered** in `routes/api.php`

3. **Check route prefix** - should be `/api/...`

---

### Issue 6: Authentication/Token Issues

**Symptoms:**
- 401 Unauthorized errors
- Login fails

**Solution:**

1. **Check Laravel Sanctum/Passport is configured:**
   ```bash
   php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"
   php artisan migrate
   ```

2. **Verify `.env` has correct settings:**
   ```env
   APP_URL=http://localhost:8000
   SANCTUM_STATEFUL_DOMAINS=localhost:5173
   ```

---

## 🔍 How to Verify Backend is Working

### Step 1: Check Backend is Running

Open in browser: **http://localhost:8000**

You should see:
- Laravel welcome page, OR
- Your app's homepage, OR
- A JSON error (which is fine - means server is running)

### Step 2: Test API Endpoint

Open in browser: **http://localhost:8000/api/login**

You should see:
- A JSON response (even if it's an error like "Method not allowed" for GET)
- This confirms the API route exists

### Step 3: Test from Frontend

1. Open browser console (F12)
2. Try logging in
3. Check Network tab for `/api/login` request
4. Look at the response

---

## 🛠️ Quick Backend Setup Checklist

```bash
# 1. Navigate to backend directory
cd path/to/your/backend

# 2. Install dependencies
composer install

# 3. Copy environment file
cp .env.example .env

# 4. Generate app key
php artisan key:generate

# 5. Configure database in .env file
# DB_CONNECTION=mysql
# DB_HOST=127.0.0.1
# DB_PORT=3306
# DB_DATABASE=your_database
# DB_USERNAME=your_username
# DB_PASSWORD=your_password

# 6. Run migrations
php artisan migrate

# 7. Seed database (if needed)
php artisan db:seed

# 8. Start server
php artisan serve
```

---

## 📋 Backend Requirements for Frontend

Your backend must have these endpoints:

### Authentication
- `POST /api/login` - User login
- `POST /api/logout` - User logout
- `POST /api/register/passenger` - Passenger registration
- `POST /api/register/driver` - Driver registration

### Admin
- `GET /api/admin/dashboard` - Admin dashboard stats
- `GET /api/admin/drivers` - List drivers
- `GET /api/admin/rides` - List rides
- `PUT /api/admin/drivers/{id}/status` - Update driver status

### Driver
- `GET /api/driver/profile` - Driver profile
- `PUT /api/driver/profile` - Update driver profile
- `PUT /api/driver/availability` - Toggle availability
- `PUT /api/driver/location` - Update location
- `GET /api/driver/rides/queue` - Get ride queue
- `POST /api/driver/rides/{id}/accept` - Accept ride
- `POST /api/driver/rides/{id}/decline` - Decline ride
- `POST /api/driver/rides/{id}/complete` - Complete ride
- `GET /api/driver/rides/history` - Ride history

### Passenger
- `POST /api/passenger/rides` - Request ride
- `GET /api/passenger/rides/current` - Get current ride
- `GET /api/passenger/drivers/available` - Get available drivers
- `POST /api/passenger/rides/{id}/cancel` - Cancel ride
- `GET /api/passenger/rides/history` - Ride history

### Places
- `GET /api/places` - Get all places

---

## 🐛 Debugging Steps

### 1. Check Backend Logs

```bash
# View Laravel logs
tail -f storage/logs/laravel.log
```

### 2. Check Browser Console

Open DevTools (F12) → Console tab
- Look for `[API]` prefixed logs
- Check for error messages

### 3. Check Network Tab

Open DevTools (F12) → Network tab
- Find the failed request
- Check Request URL
- Check Response status
- Check Response body

### 4. Test Backend Directly

Use Postman, curl, or browser:

```bash
# Test login endpoint
curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}'
```

---

## ✅ Quick Test Commands

### Test if Backend is Running
```bash
# Windows PowerShell
Invoke-WebRequest -Uri http://localhost:8000 -Method GET

# Linux/Mac
curl http://localhost:8000
```

### Test API Endpoint
```bash
# Windows PowerShell
Invoke-WebRequest -Uri http://localhost:8000/api/login -Method GET

# Linux/Mac
curl http://localhost:8000/api/login
```

---

## 🆘 Still Not Working?

1. **Share the error message** from browser console
2. **Share the Network tab** response for failed requests
3. **Check backend logs** (`storage/logs/laravel.log`)
4. **Verify backend is running** on the correct port
5. **Check CORS configuration** in backend

---

## 📝 Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| `Network error: Could not connect to server` | Backend not running | Start backend with `php artisan serve` |
| `CORS policy: No 'Access-Control-Allow-Origin'` | CORS not configured | Update `config/cors.php` |
| `404 Not Found` | Route doesn't exist | Check `routes/api.php` |
| `500 Internal Server Error` | Backend error | Check `storage/logs/laravel.log` |
| `401 Unauthorized` | Auth issue | Check token/authentication setup |
| `422 Unprocessable Entity` | Validation error | Check request body format |

