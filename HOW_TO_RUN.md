# 🚀 How to Run Frontend and Backend

## 📋 Prerequisites

- **Node.js** installed (v16 or higher recommended)
- **npm** or **yarn** package manager
- **Backend server** (Laravel/PHP) running

---

## 🎨 Running the Frontend

### Step 1: Install Dependencies (First Time Only)

```bash
npm install
```

### Step 2: Start the Development Server

```bash
npm run dev
```

### Step 3: Open in Browser

The frontend will start on **http://localhost:5173** (or another port if 5173 is busy).

You should see:
```
  VITE v7.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### Frontend URLs:
- **Landing Page:** http://localhost:5173/
- **Admin Login:** http://localhost:5173/admin/login
- **Driver Login:** http://localhost:5173/driver/login
- **Passenger Login:** http://localhost:5173/passenger/login

---

## 🔧 Backend Configuration

### Backend URL

The frontend expects the backend to be running on:
- **Default:** `http://localhost:8000`

### Change Backend URL (Optional)

If your backend runs on a different port/URL:

1. Create a `.env` file in the root directory:
```bash
VITE_API_BASE_URL=http://localhost:YOUR_PORT
```

2. Example:
```bash
VITE_API_BASE_URL=http://localhost:3000
```

3. Restart the frontend dev server after changing `.env`

---

## 🖥️ Running the Backend

### Laravel Backend (PHP)

1. **Navigate to your backend directory:**
```bash
cd path/to/your/backend
```

2. **Install dependencies (if needed):**
```bash
composer install
```

3. **Set up environment:**
```bash
cp .env.example .env
php artisan key:generate
```

4. **Run migrations:**
```bash
php artisan migrate
```

5. **Start the server:**
```bash
php artisan serve
```

The backend should start on **http://localhost:8000**

---

## ✅ Verify Everything is Working

### 1. Check Backend is Running

Open in browser: **http://localhost:8000/api/login**

You should see a JSON response (or an error page, which is normal - it means the server is running).

### 2. Check Frontend is Running

Open in browser: **http://localhost:5173/**

You should see the landing page.

### 3. Test Login

1. Go to **http://localhost:5173/admin/login**
2. Enter admin credentials
3. Check browser console (F12) for any errors
4. Check Network tab to see if API calls are being made

---

## 🐛 Troubleshooting

### Frontend won't start

**Error: Port already in use**
```bash
# Kill the process using port 5173
# Windows:
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Or use a different port:
npm run dev -- --port 3000
```

**Error: Cannot find module**
```bash
# Delete node_modules and reinstall
rm -rf node_modules
npm install
```

### Backend connection errors

**Error: Network error / CORS error**

1. Check backend is running: `http://localhost:8000`
2. Verify CORS is configured in backend
3. Check backend URL in `src/config.js` or `.env` file

**Error: 404 Not Found**

- Verify backend routes exist
- Check API endpoint URLs match backend routes
- Ensure backend is running on the correct port

### Admin login not working

1. Check browser console (F12) for errors
2. Check Network tab for `/api/login` request
3. Verify backend returns `role: "admin"` in response
4. See `ADMIN_LOGIN_DEBUGGING_GUIDE.md` for detailed debugging

---

## 📝 Quick Commands Reference

### Frontend
```bash
npm install          # Install dependencies
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
```

### Backend (Laravel)
```bash
php artisan serve              # Start development server
php artisan migrate            # Run database migrations
php artisan migrate:fresh      # Fresh migration (drops all tables)
php artisan db:seed           # Seed database
composer install              # Install PHP dependencies
```

---

## 🔗 Important URLs

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:5173 | React app |
| Backend API | http://localhost:8000 | Laravel API |
| Admin Login | http://localhost:5173/admin/login | Admin access |
| Driver Login | http://localhost:5173/driver/login | Driver access |
| Passenger Login | http://localhost:5173/passenger/login | Passenger access |

---

## 💡 Tips

1. **Keep both servers running** - Frontend and backend need to run simultaneously
2. **Check console** - Browser console (F12) shows helpful debug logs
3. **Network tab** - Use DevTools Network tab to see API requests/responses
4. **Hot reload** - Frontend auto-refreshes when you save files
5. **Clear cache** - If issues persist, clear browser cache and localStorage

---

## 🆘 Still Having Issues?

1. Check that both frontend and backend are running
2. Verify backend URL matches in `src/config.js`
3. Check browser console for errors
4. Check Network tab for failed API requests
5. Verify backend CORS settings allow requests from `http://localhost:5173`

