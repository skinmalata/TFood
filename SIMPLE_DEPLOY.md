# 🚀 How to Put TFood on the Internet (Super Easy!)

> Written for someone just starting out. Follow the steps ONE by ONE.

---

## Step 0: What You Need

- The TFood code folder (you already have it! ✅)
- An internet connection
- About 30 minutes

---

## Step 1: Put Your Code on GitHub (Free)

GitHub is like Google Drive for code.

1. Go to **https://github.com** and click "Sign up"
2. Create an account (use your email)
3. Click the **+** icon at top-right → "New repository"
4. Name it `tfood` and click "Create repository"
5. Now you need to upload your code. In the page that appears, look for **"uploading an existing file"** link
6. Open your TFood folder on your computer
7. Drag-and-drop ALL the files and folders into the GitHub page
8. Scroll down, click **"Commit changes"**

✅ Your code is now on GitHub!

---

## Step 2: Deploy the Backend API (The Brain)

We'll use **Render.com** (free, no credit card needed).

1. Go to **https://render.com**
2. Click **"Get Started"** or **"Sign Up"**
3. Click **"Sign up with GitHub"** (it's the easiest)
4. Authorize Render to see your GitHub
5. On the Render dashboard, click **"New +"** → **"Blueprint"**
6. Select your `tfood` repository
7. Click **"Apply"**
8. Wait 5-10 minutes while it builds...

When done, you'll see a URL like: `https://tfood-api.onrender.com`

**Write that URL down!** You'll need it later.

✅ Your API is alive on the internet!

---

## Step 3: Set Up the Database

Render already created a database for you automatically! 🙌

But you need to add the tables.

1. In Render, go to your **Dashboard**
2. Click on your **tfood-db** database
3. Copy the **"Internal Connection String"** (looks like: `postgres://...`)
   
Now you need to run the migrations (it's like setting up the tables):

**Option A - If you have Gitpod/Codespace:**
- Open your GitHub repo
- Press the `.` key on your keyboard — this opens a web editor
- Open the terminal and type:
```
cd packages/backend
npm install
npx knex migrate:latest
npx knex seed:run
```

**Option B - Ask me to help you run the setup commands**

✅ Database is ready!

---

## Step 4: Deploy the Admin Dashboard (The Control Room)

This goes on your **ProFreeHost** cPanel.

### First, Build the Admin Website:

1. Open **Terminal** on your computer
2. Go to the TFood folder: `cd TFood`
3. Type: `cd packages/admin-web`
4. Type: `npm install`
5. Type: `npm run build`
6. A new folder called **dist** will appear

### Now Upload to ProFreeHost:

1. Log in to **https://profreehost.com/login**
2. Click **"cPanel"** (or Client Area → cPanel)
3. Look for **"File Manager"** and click it
4. Go to `public_html` folder (or create a folder like `admin` inside it)
5. Click **"Upload"**
6. Upload ALL the files from the `dist` folder on your computer
7. You need to change one setting: open file **`assets/index-xxxxx.js`** using the editor
8. Find `localhost:5000` and replace it with your Render URL: `https://tfood-api.onrender.com`

✅ Your admin panel is at: `http://your-domain.profreehost.com/admin`

**Login:** admin@tfood.ng / Admin@12345

---

## Step 5: Test It! 🎉

Open your browser and go to:
- **Admin Dashboard:** `http://your-domain.profreehost.com/admin`
- **API Health:** `https://tfood-api.onrender.com/api/health`

You should see "TFood API is running" ✅

---

## For the Mobile Apps (Later)

When you want to run the apps on your phone:
1. Open the app folder on your computer
2. Type: `npx expo start`
3. Scan the QR code with your phone
4. The app will work with your live API!

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Cannot connect to database" | Check your env variables in Render dashboard |
| Admin page is blank | Check the browser console for errors — the API URL might be wrong |
| Orders not showing | Pusher needs to be set up (get free keys from pusher.com) |
| Payments failing | Add your Paystack secret key in Render env variables |

---

**Need help?** Just tell me what step you're on and what error you see — I'll help you fix it! 🎯
