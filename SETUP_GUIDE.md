# 🔥 FREE FIRE ARENA — COMPLETE SETUP GUIDE
### Build & Deploy Your Tournament Website in 1 Day

---

## WHAT YOU'LL BUILD
A real tournament website where players can register, join tournaments, win coins, and withdraw money to UPI. You (admin) can create tournaments, add results, and manage everything from a dashboard.

---

## PART 1: INSTALL TOOLS ON YOUR COMPUTER

### Step 1: Install Node.js
1. Open this link: https://nodejs.org
2. Click **"LTS"** (the green button)
3. Download the installer for your computer
4. Install it (just click Next → Next → Install)
5. To check it worked, open **Command Prompt** (Windows) or **Terminal** (Mac)
6. Type: `node --version`
7. You should see something like `v20.0.0` ✅

### Step 2: Install VS Code (Code Editor)
1. Open: https://code.visualstudio.com
2. Download and install it
3. This is where you'll open and edit code

### Step 3: Install Git
1. Open: https://git-scm.com
2. Download and install
3. In terminal, type: `git --version` to confirm ✅

---

## PART 2: SET UP FIREBASE (FREE DATABASE)

### Step 4: Create Firebase Project
1. Go to: https://console.firebase.google.com
2. Click **"Add project"**
3. Name it: `freefire-arena` (or anything)
4. Click Continue → Continue → **Create project**
5. Wait for it to create (30 seconds)

### Step 5: Set Up Firebase Authentication
1. In Firebase Console, click **"Authentication"** in left menu
2. Click **"Get started"**
3. Click **"Email/Password"**
4. Toggle the first option **ON**
5. Click **Save**

### Step 6: Set Up Firestore Database
1. Click **"Firestore Database"** in left menu
2. Click **"Create database"**
3. Choose **"Start in test mode"** (for now)
4. Select a location closest to India (e.g., `asia-south1`)
5. Click **Enable**

### Step 7: Set Up Security Rules
1. In Firestore, click **"Rules"** tab
2. Replace everything with this code:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own data
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }
    
    // Tournaments are public to read, admin to write
    match /tournaments/{tourId} {
      allow read: if true;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
    }
    
    // Joined players
    match /joinedPlayers/{docId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
    }
    
    // Transactions
    match /transactions/{docId} {
      allow read: if request.auth != null && 
        (resource.data.userId == request.auth.uid ||
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true);
      allow write: if request.auth != null;
    }
    
    // Withdrawals
    match /withdrawals/{docId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
    }
    
    // Admin collection
    match /admins/{docId} {
      allow read, write: if request.auth != null &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
    }
  }
}
```

3. Click **Publish**

### Step 8: Get Firebase Config Keys
1. Click the **gear icon** ⚙️ next to "Project Overview"
2. Click **"Project settings"**
3. Scroll down to **"Your apps"**
4. Click the **</>** (Web) icon
5. App nickname: `freefire-web`
6. Click **Register app**
7. You'll see code like this — **COPY IT AND SAVE IT SOMEWHERE**:

```
apiKey: "AIzaSy..."
authDomain: "your-project.firebaseapp.com"
projectId: "your-project-id"
storageBucket: "your-project.appspot.com"
messagingSenderId: "123456789"
appId: "1:123456:web:abc123"
```

8. Click **Continue to console**

---

## PART 3: SET UP THE PROJECT

### Step 9: Download the Code
1. Extract the provided ZIP file to a folder on your Desktop
2. Name the folder: `freefire-tournament`

### Step 10: Open Project in VS Code
1. Open VS Code
2. Click **File → Open Folder**
3. Select your `freefire-tournament` folder
4. Click **Open**

### Step 11: Create Your Environment File
1. In VS Code, look at the left panel (file explorer)
2. You'll see a file called `.env.example`
3. Right-click it → **Copy**
4. Right-click the folder → **Paste**
5. Rename the copied file to: `.env.local` (exactly this name)
6. Open `.env.local`
7. Fill in your Firebase values (from Step 8):

```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy... (your actual key)
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456:web:abc123
```

8. Save the file (Ctrl+S)

### Step 12: Install Dependencies
1. In VS Code, click **Terminal** in the top menu
2. Click **"New Terminal"**
3. A black box will appear at the bottom
4. Type this and press Enter:

```
npm install
```

5. Wait 2-3 minutes. You'll see lots of text scrolling. That's normal!
6. When it shows `added X packages` — it's done ✅

### Step 13: Test Your Website Locally
1. In the terminal, type:

```
npm run dev
```

2. Wait for: `Ready - started server on http://localhost:3000`
3. Open your browser and go to: **http://localhost:3000**
4. You should see your Free Fire Arena website! 🎉

---

## PART 4: CREATE YOUR ADMIN ACCOUNT

### Step 14: Register an Account
1. On your website, click **Register**
2. Fill in all details and create your account
3. After registering, go to Firebase Console

### Step 15: Make Yourself Admin (IMPORTANT!)
1. Go to Firebase Console → **Firestore Database**
2. Click **"users"** collection
3. Find your user document (click on it)
4. Find the field `isAdmin` — it says `false`
5. Click the pencil ✏️ icon to edit it
6. Change `false` to `true`
7. Click **Update**
8. **Refresh your website** — you'll now see the "⚡ Admin" button in the navbar!

---

## PART 5: UPLOAD TO GITHUB

### Step 16: Create GitHub Account
1. Go to: https://github.com
2. Sign up for a free account

### Step 17: Create a New Repository
1. Click the **+** button in top right
2. Click **"New repository"**
3. Repository name: `freefire-tournament`
4. Keep it **Public**
5. Click **"Create repository"**
6. COPY the repository URL (looks like: `https://github.com/YOUR_NAME/freefire-tournament.git`)

### Step 18: Upload Your Code
1. In VS Code terminal, type these commands ONE BY ONE:

```
git init
```
Press Enter. Wait.

```
git add .
```
Press Enter.

```
git commit -m "Initial commit"
```
Press Enter.

```
git branch -M main
```
Press Enter.

```
git remote add origin https://github.com/YOUR_NAME/freefire-tournament.git
```
(Replace with YOUR actual GitHub URL)
Press Enter.

```
git push -u origin main
```
Press Enter.

2. It may ask for your GitHub username and password. Enter them.
3. Done! Your code is on GitHub ✅

---

## PART 6: DEPLOY ON VERCEL (GO LIVE!)

### Step 19: Create Vercel Account
1. Go to: https://vercel.com
2. Click **"Sign Up"**
3. Choose **"Continue with GitHub"** — this connects them automatically

### Step 20: Deploy Your Website
1. On Vercel dashboard, click **"Add New Project"**
2. Find your `freefire-tournament` repository and click **Import**
3. **IMPORTANT**: Before clicking Deploy, click **"Environment Variables"**
4. Add EACH of your Firebase variables:
   - Click **Add**
   - Name: `NEXT_PUBLIC_FIREBASE_API_KEY` → Value: your actual key
   - Repeat for ALL 6 variables from your `.env.local` file
5. After adding all 6 variables, click **Deploy**
6. Wait 2-3 minutes
7. You'll see a URL like: `https://freefire-tournament.vercel.app` 🎉

### Step 21: Your Website is LIVE!
Share this URL with your players. Everyone can:
- Register and login
- See and join tournaments
- Check their wallet
- Request withdrawals

---

## PART 7: HOW TO USE THE WEBSITE

### As Admin, here's what you do:

#### Creating a Tournament:
1. Login to your website
2. Click **⚡ Admin** in navbar
3. Click **Create Tournament**
4. Fill in: Name, Type (Solo/Duo/Squad), Entry Fee, Prize Pool, Max Players
5. Choose reward type: Per Kill OR Position Based
6. Click **Create Tournament**

#### Before the Match (Add Room Details):
1. Go to **Admin → Manage Tournaments**
2. Find your tournament
3. Click **🏠 Room** button
4. Enter the room ID and password
5. Click Save — players will see this automatically!

#### After the Match (Add Results & Distribute Money):

**For Per Kill tournaments:**
1. Click **🏆 Results** on the tournament
2. Enter each player's FF UID and their kill count
3. The website automatically calculates: kills × per kill reward
4. Click **Distribute Rewards** — coins go to each player's wallet instantly!

**For Position tournaments:**
1. Click **🏆 Results**
2. Select 1st, 2nd, 3rd position
3. Enter the winner's FF UID for each position
4. Click **Distribute Rewards** — money added automatically!

#### Adding Coins to a User:
1. Go to **Admin → Manage Users**
2. Search for the user
3. Click **Manage Coins**
4. Enter amount and choose Add or Remove
5. Click the button — wallet updates instantly!

#### Processing Withdrawals:
1. Go to **Admin → Withdrawals**
2. See all pending requests with UPI ID
3. Send the money to their UPI manually
4. Come back and click **✓ Approve** — their balance gets deducted automatically
5. Or click **✕ Reject** if something is wrong

---

## PART 8: UPDATING YOUR WEBSITE

Whenever you make changes to the code:

1. Save your files in VS Code
2. Open terminal and type:

```
git add .
git commit -m "Updated something"
git push
```

3. Vercel automatically re-deploys! Your live website updates in 2-3 minutes.

---

## COMMON PROBLEMS & FIXES

**Problem**: Website shows "Firebase error"
**Fix**: Check your `.env.local` file — make sure all 6 values are correct with no spaces

**Problem**: I can't see the Admin button
**Fix**: Go to Firestore → users → your user → set `isAdmin` to `true` → refresh page

**Problem**: `npm install` fails
**Fix**: Make sure Node.js is installed. Try closing terminal, opening a new one, run again.

**Problem**: Vercel shows build error
**Fix**: Check that you added ALL 6 environment variables in Vercel settings

**Problem**: Player can't join — says "not enough balance"
**Fix**: Go to Admin → Users → find that player → click Manage Coins → Add coins

---

## FILE STRUCTURE (What each file does)

```
freefire-tournament/
├── pages/
│   ├── index.js          ← Homepage (shows all tournaments)
│   ├── login.js          ← Login page
│   ├── register.js       ← Register page
│   ├── dashboard.js      ← User profile page
│   ├── wallet.js         ← Wallet & withdrawal page
│   ├── tournament/
│   │   └── [id].js       ← Single tournament detail page
│   └── admin/
│       ├── index.js      ← Admin dashboard
│       ├── create-tournament.js  ← Create new tournament
│       ├── tournaments.js        ← Manage tournaments
│       ├── users.js              ← Manage users & coins
│       └── withdrawals.js        ← Approve withdrawals
├── components/
│   ├── Navbar.js         ← Top navigation bar
│   └── TournamentCard.js ← Tournament card design
├── lib/
│   ├── firebase.js       ← Firebase connection
│   └── AuthContext.js    ← Login/logout system
├── styles/
│   └── globals.css       ← All styles and colors
├── .env.example          ← Template for your Firebase keys
├── .env.local            ← YOUR actual Firebase keys (don't share!)
└── package.json          ← Project dependencies
```

---

## FIREBASE COLLECTIONS EXPLAINED

- **users** — stores each user's profile, balance, joined tournaments
- **tournaments** — all tournament info (name, type, rewards, status)
- **joinedPlayers** — records who joined which tournament
- **transactions** — history of all money in/out of wallets
- **withdrawals** — withdrawal requests from users

---

*Built with Next.js, Firebase, Tailwind CSS, and deployed on Vercel — all 100% FREE!*
