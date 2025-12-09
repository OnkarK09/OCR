# Hostinger Deployment Guide

## Quick Setup for Auto-Deployment

### Method 1: Hostinger Git Integration (Easiest)

1. **Prepare your code:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git push -u origin main
   ```

2. **In Hostinger hPanel:**
   - Go to **Websites** → Select your website
   - Click **Git Integration** (or **Deployments**)
   - Click **Connect Repository**
   - Authorize GitHub
   - Select your repository
   - Configure:
     - **Branch**: `main`
     - **Build Command**: `npm run build`
     - **Output Directory**: `dist`
     - **Node Version**: 18.x or higher
   - Enable **Auto-deploy on push**

3. **Test it:**
   ```bash
   # Make a small change
   echo "<!-- Updated -->" >> index.html
   git add .
   git commit -m "Test deployment"
   git push
   ```
   
   Wait 2-3 minutes, then check your website!

### Method 2: GitHub Actions + FTP (If Git Integration unavailable)

1. **Set up GitHub Secrets:**
   - Go to your GitHub repo → **Settings** → **Secrets and variables** → **Actions**
   - Add these secrets:
     - `FTP_SERVER`: Your FTP hostname (e.g., `ftp.yourdomain.com`)
     - `FTP_USERNAME`: Your FTP username
     - `FTP_PASSWORD`: Your FTP password

2. **The workflow file is already created** (`.github/workflows/deploy.yml`)

3. **Push to trigger deployment:**
   ```bash
   git add .
   git commit -m "Setup auto-deployment"
   git push
   ```

### Method 3: Manual Deployment

1. **Build locally:**
   ```bash
   npm install
   npm run build
   ```

2. **Upload to Hostinger:**
   - Login to hPanel
   - Go to **File Manager**
   - Navigate to `public_html/`
   - Upload all files from `dist/` folder
   - Make sure `index.html` is in the root of `public_html/`

## Troubleshooting

### Build fails on Hostinger
- Check Node.js version (should be 18+)
- Verify `package.json` has correct build script
- Check build logs in hPanel

### Website shows blank page
- Ensure `index.html` is in the correct directory
- Check browser console for errors
- Verify all assets are uploaded

### Changes not reflecting
- Clear browser cache (Ctrl+Shift+R)
- Check deployment logs in hPanel
- Verify Git push was successful

## File Structure on Server

After deployment, your `public_html/` should contain:
```
public_html/
├── index.html
├── assets/
│   ├── index-[hash].js
│   └── index-[hash].css
└── (other static files)
```

## Need Help?

- Hostinger Support: https://support.hostinger.com
- Check deployment logs in hPanel → Websites → Your Site → Deployments

