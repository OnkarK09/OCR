# ScanAI Pro - OCR Scanner

A React-based OCR application for scanning Aadhaar cards, PAN cards, and bills using Tesseract.js.

## Features

- **Aadhaar Card Scanning**: Extracts 12-digit UID numbers
- **PAN Card Scanning**: Advanced OCR with fuzzy matching and pattern validation
- **Bill/Receipt Scanning**: Extracts store names and total amounts
- Real-time image preprocessing for better OCR accuracy
- Mobile-responsive design

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Development

```bash
npm run dev
```

### 3. Build for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Git & Hostinger Deployment Setup

### Step 1: Initialize Git Repository

```bash
git init
git add .
git commit -m "Initial commit"
```

### Step 2: Create GitHub Repository

1. Go to [GitHub](https://github.com) and create a new repository
2. Copy the repository URL

### Step 3: Connect Local Repository to GitHub

```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

### Step 4: Hostinger Auto-Deployment Setup

#### Option A: Using Hostinger Git Integration (Recommended)

1. **Login to Hostinger hPanel**
2. **Navigate to**: Websites → Your Website → Git Integration
3. **Connect your GitHub repository**:
   - Click "Connect Repository"
   - Authorize Hostinger to access your GitHub account
   - Select your repository
   - Choose the branch (usually `main`)
4. **Configure Build Settings**:
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Node Version**: Select Node.js 18 or higher
5. **Enable Auto-Deploy**: Toggle "Auto-deploy on push" to ON

#### Option B: Manual Deployment via FTP/SFTP

If Git integration is not available, you can use GitHub Actions:

1. Create `.github/workflows/deploy.yml` (see below)
2. Configure FTP credentials in GitHub Secrets

### Step 5: Automatic Deployment Workflow

After setup, every time you push to GitHub:

```bash
git add .
git commit -m "Your commit message"
git push
```

Hostinger will automatically:
1. Pull the latest code
2. Run `npm install`
3. Run `npm run build`
4. Deploy the `dist/` folder to your website

## Manual Deployment (Alternative)

If you need to deploy manually:

1. Build the project:
   ```bash
   npm run build
   ```

2. Upload the contents of the `dist/` folder to your Hostinger public_html directory via:
   - File Manager in hPanel
   - FTP/SFTP client
   - Hostinger's deployment tools

## Project Structure

```
├── src/
│   ├── App.jsx          # Main application component
│   ├── main.jsx         # React entry point
│   └── index.css        # Global styles
├── index.html           # HTML template
├── package.json         # Dependencies and scripts
├── vite.config.js       # Vite configuration
└── dist/                # Build output (generated)
```

## Technologies Used

- React 18
- Vite (Build tool)
- Tesseract.js (OCR engine)
- Tailwind CSS (Styling)
- Lucide React (Icons)

## Notes

- The app uses Tesseract.js loaded from CDN for OCR functionality
- Image preprocessing (grayscale + contrast) improves OCR accuracy
- PAN card scanning includes advanced pattern matching and character repair
- All processing happens client-side (no backend required)

## Support

For issues or questions, please check:
- Hostinger Documentation: https://support.hostinger.com
- Vite Documentation: https://vitejs.dev
- React Documentation: https://react.dev

