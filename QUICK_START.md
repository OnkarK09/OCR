# 🚀 Quick Start - Git + Hostinger Auto-Deployment

## Step-by-Step Guide

### 1️⃣ Install Dependencies
```bash
npm install
```

### 2️⃣ Test Locally (Optional)
```bash
npm run dev
```
Visit `http://localhost:5173` to see your app.

### 3️⃣ Initialize Git

**Option A: Use the setup script (Windows)**
```bash
setup-git.bat
```

**Option B: Manual setup**
```bash
git init
git add .
git commit -m "Initial commit"
```

### 4️⃣ Create GitHub Repository

1. Go to https://github.com/new
2. Create a new repository (name it `scanai-pro` or similar)
3. **Don't** initialize with README (we already have one)
4. Copy the repository URL

### 5️⃣ Connect to GitHub

```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

### 6️⃣ Connect to Hostinger

1. **Login to Hostinger hPanel**
2. Go to **Websites** → Select your website
3. Find **Git Integration** or **Deployments** section
4. Click **Connect Repository**
5. Authorize Hostinger to access GitHub
6. Select your repository
7. Configure:
   - **Branch**: `main`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Node Version**: `18` or higher
8. **Enable Auto-Deploy** ✅

### 7️⃣ Test Auto-Deployment

Make a small change:
```bash
# Edit any file, then:
git add .
git commit -m "Test auto-deployment"
git push
```

Wait 2-3 minutes, then refresh your website! 🎉

## 🔄 Daily Workflow

After setup, whenever you make changes:

```bash
# 1. Make your code changes
# 2. Stage changes
git add .

# 3. Commit
git commit -m "Description of changes"

# 4. Push (triggers auto-deployment)
git push
```

That's it! Hostinger will automatically build and deploy your changes.

## 📝 Important Notes

- **Build time**: Usually 2-5 minutes after push
- **First deployment**: May take longer (5-10 minutes)
- **Check logs**: hPanel → Websites → Your Site → Deployments → View Logs
- **Node version**: Make sure Hostinger uses Node.js 18+ (check in hPanel)

## 🆘 Troubleshooting

**Website not updating?**
- Check deployment status in hPanel
- Verify Git push was successful
- Clear browser cache (Ctrl+Shift+R)

**Build failing?**
- Check Node.js version in Hostinger settings
- Verify `package.json` exists and has build script
- Check deployment logs for errors

**Need help?**
- See `DEPLOYMENT.md` for detailed instructions
- Contact Hostinger support

---

**Ready to go live?** Just push to GitHub and watch the magic happen! ✨

