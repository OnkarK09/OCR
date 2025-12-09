# 🔐 How to Push Code to GitHub

## Current Status

Your code is ready to push, but authentication is required. Here's how to complete it:

## Method 1: Use Windows Credential Manager (Easiest)

1. **Open Windows Credential Manager:**
   - Press `Win + R`
   - Type: `control /name Microsoft.CredentialManager`
   - Press Enter

2. **Go to Windows Credentials tab**

3. **Look for `git:https://github.com`**
   - If it exists, remove it (to force re-authentication)
   - If it doesn't exist, that's fine

4. **Try pushing again:**
   ```bash
   git push -u origin main
   ```

5. **When prompted:**
   - A browser window should open
   - Sign in to GitHub
   - Authorize the action
   - OR use a Personal Access Token (see Method 2)

## Method 2: Use Personal Access Token (Recommended)

1. **Create a GitHub Personal Access Token:**
   - Go to: https://github.com/settings/tokens
   - Click **"Generate new token"** → **"Generate new token (classic)"**
   - Name: `OCR Project`
   - Expiration: Choose your preference (90 days recommended)
   - Select scope: **`repo`** (Full control of private repositories)
   - Click **"Generate token"**
   - **COPY THE TOKEN** (you won't see it again!)

2. **Push using the token:**
   ```bash
   git push -u origin main
   ```

3. **When prompted:**
   - **Username**: Enter your GitHub username (`OnkarK09`)
   - **Password**: **Paste the token** (NOT your GitHub password)

## Method 3: Use GitHub CLI

If you have GitHub CLI installed:
```bash
gh auth login
git push -u origin main
```

## Verify Push Success

After pushing, check:
```bash
git branch -vv
```

You should see:
```
* main e3893ed [origin/main] Add next steps documentation
```

Or visit: https://github.com/OnkarK09/OCR
You should see all your files there!

## Quick Push Command

Once authenticated, you can push with:
```bash
git push
```

No need for `-u origin main` after the first time!

---

**Need help?** The push command should prompt you for credentials. Follow the prompts!

