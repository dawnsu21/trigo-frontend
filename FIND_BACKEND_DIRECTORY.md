# 🔍 How to Find Your Backend Directory

## Error You're Seeing
```
Could not open input file: artisan
```

This means you're **not in the Laravel backend directory**.

---

## ✅ Solution: Find and Navigate to Backend

### Method 1: Search for Backend Directory

Run this command to find your backend:

```powershell
Get-ChildItem -Path C:\Users\Guest1 -Filter "artisan" -Recurse -ErrorAction SilentlyContinue | Select-Object -First 5 FullName
```

This will show you where the `artisan` file is located. The **parent folder** of `artisan` is your backend directory.

### Method 2: Common Locations

Check these common locations:

**XAMPP:**
```bash
cd C:\xampp\htdocs\your-project-name
```

**Laragon:**
```bash
cd C:\laragon\www\your-project-name
```

**WAMP:**
```bash
cd C:\wamp64\www\your-project-name
```

**User Directory:**
```bash
cd C:\Users\Guest1\my-backend
cd C:\Users\Guest1\backend
cd C:\Users\Guest1\laravel-project
```

**Desktop/Downloads:**
```bash
cd C:\Users\Guest1\Desktop\your-project
cd C:\Users\Guest1\Downloads\your-project
```

### Method 3: Check Your IDE/Editor

1. Open your code editor (VS Code, PHPStorm, etc.)
2. Look at your open projects
3. Find the Laravel backend project
4. Check the folder path shown in the editor

### Method 4: Check Where You Cloned/Downloaded It

- Did you clone from Git? Check your Git repositories folder
- Did you download it? Check your Downloads folder
- Did you extract a ZIP? Check where you extracted it

---

## ✅ Once You Find It

### Step 1: Navigate to Backend Directory

```bash
cd C:\path\to\your\backend
```

**Verify you're in the right place:**
```bash
# You should see the artisan file
dir artisan

# Or list files - you should see:
# - artisan
# - app/
# - config/
# - routes/
# - composer.json
```

### Step 2: Start the Server

```bash
php artisan serve
```

You should see:
```
Laravel development server started: http://localhost:8000
```

---

## 🔍 What to Look For

Your backend directory should contain:

**Required Files:**
- ✅ `artisan` (Laravel command file)
- ✅ `composer.json` (PHP dependencies)
- ✅ `.env` (environment configuration)

**Required Folders:**
- ✅ `app/` (application code)
- ✅ `config/` (configuration files)
- ✅ `routes/` (route definitions)
- ✅ `public/` (public files)

---

## 🆘 Still Can't Find It?

### Option 1: Ask Yourself
- Where did you save/download the backend code?
- Did you create it with `composer create-project`?
- Is it in a Git repository?
- Did someone give you the code? Where did they say it is?

### Option 2: Check Recent Files
```powershell
# Check recent folders
Get-ChildItem -Path C:\Users\Guest1 -Directory | Sort-Object LastWriteTime -Descending | Select-Object -First 10 FullName
```

### Option 3: Search by Project Name
If you know your project name:
```powershell
Get-ChildItem -Path C:\Users\Guest1 -Filter "*your-project-name*" -Recurse -Directory -ErrorAction SilentlyContinue | Select-Object -First 5 FullName
```

---

## 📝 Quick Checklist

- [ ] Found the `artisan` file location
- [ ] Navigated to the parent directory of `artisan`
- [ ] Verified with `dir artisan` or `ls artisan`
- [ ] Ran `php artisan serve`
- [ ] Saw "Laravel development server started"
- [ ] Backend terminal is still open

---

## 💡 Pro Tip

Once you find it, **bookmark the path** or create a shortcut so you can easily navigate there next time!

