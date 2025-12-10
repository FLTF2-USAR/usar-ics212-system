# Deployment Guide for MBFD Checkout System

## Prerequisites

1. GitHub account (`pdarleyjr`)
2. Git installed locally
3. Node.js and npm installed

## Step 1: Create GitHub Repository

1. Go to [GitHub](https://github.com/new)
2. Create a new **public** repository named `mbfd-checkout-system`
3. Do NOT initialize with README, .gitignore, or license (we already have these)

## Step 2: Initialize Local Git Repository

```bash
cd mbfd-checkout-system
git init
git add .
git commit -m "Initial commit: MBFD Checkout System"
```

## Step 3: Connect to GitHub

```bash
git remote add origin https://github.com/pdarleyjr/mbfd-checkout-system.git
git branch -M main
git push -u origin main
```

## Step 4: Configure GitHub Token

### Create Fine-Grained Personal Access Token

1. Go to [GitHub Settings > Tokens](https://github.com/settings/tokens?type=beta)
2. Click "Generate new token"
3. Configure:
   - **Token name**: `MBFD Checkout System`
   - **Expiration**: 90 days (or as needed)
   - **Repository access**: Only select repositories → `mbfd-checkout-system`
   - **Permissions**:
     - Repository permissions → Issues → **Read and write**
4. Click "Generate token"
5. **COPY THE TOKEN** (you won't see it again!)

### Add Token to Local Environment

```bash
# In the mbfd-checkout-system directory
cp .env.local.example .env.local
```

Edit `.env.local` and add your token:
```
VITE_GITHUB_TOKEN=github_pat_YOUR_TOKEN_HERE
```

**IMPORTANT**: Never commit `.env.local` to Git! (It's already in .gitignore)

## Step 5: Test Locally

```bash
npm install
npm run dev
```

Visit `http://localhost:5173` and test:
- Login screen
- Inspection flow
- Admin dashboard

## Step 6: Deploy to GitHub Pages

```bash
npm run deploy
```

This will:
1. Build the production version
2. Create/update the `gh-pages` branch
3. Push the built files to GitHub

## Step 7: Enable GitHub Pages

1. Go to your repository on GitHub
2. Go to **Settings** → **Pages**
3. Under "Build and deployment":
   - Source: **Deploy from a branch**
   - Branch: **gh-pages** → **/ (root)**
4. Click **Save**

Wait 2-3 minutes for deployment to complete.

## Step 8: Access Your App

Your app will be available at:
```
https://pdarleyjr.github.io/mbfd-checkout-system/
```

## Step 9: Configure Email Notifications (Optional)

### Set up Gmail App Password

1. Enable 2-Factor Authentication on your Gmail account
2. Go to [App Passwords](https://myaccount.google.com/apppasswords)
3. Create a new app password for "Mail"
4. Copy the generated password

### Add Secrets to GitHub

1. Go to repository **Settings** → **Secrets and variables** → **Actions**
2. Click "New repository secret"
3. Add these secrets:
   - Name: `MAIL_USERNAME` Value: `your-email@gmail.com`
   - Name: `MAIL_PASSWORD` Value: `your-app-password`

### Update Email Address

Edit `.github/workflows/notify-admin.yml`:
```yaml
to: admin@mbfd.example.com  # Change to real email
```

Commit and push:
```bash
git add .github/workflows/notify-admin.yml
git commit -m "Configure email notifications"
git push
```

## Updating the App

After making changes:

```bash
# 1. Test locally
npm run dev

# 2. Build and verify
npm run build

# 3. Deploy to GitHub Pages
npm run deploy
```

## Troubleshooting

### "GitHub token not configured" error
- Ensure `.env.local` exists with `VITE_GITHUB_TOKEN`
- Restart dev server after adding token

### Issues not creating/updating
- Verify token has Issues Read & Write permissions
- Check token hasn't expired
- Ensure repository name in `src/lib/github.ts` matches your repo

### Deployment fails
- Ensure GitHub Pages is enabled
- Check that you have write access to the repository
- Verify `gh-pages` branch exists after first deployment

### App shows 404 after deployment
- Verify `base` path in `vite.config.ts` matches repo name
- Clear browser cache and try again
- Wait a few minutes for GitHub Pages to update

## Security Notes

⚠️ **IMPORTANT**: This app stores the GitHub token client-side. This is acceptable for an internal departmental tool but not recommended for public applications.

For production use:
1. Use fine-grained tokens with minimal permissions
2. Set token expiration dates
3. Regularly rotate tokens
4. Consider implementing a backend proxy for enhanced security

## Maintenance

### Update Checklist Data

Edit `public/data/rescue_checklist.json` to modify compartments or items.

### Add New Apparatus

1. Update `src/types/index.ts` - add to `Apparatus` type
2. Update `src/components/LoginScreen.tsx` - add to `apparatuses` array
3. Update `src/components/AdminDashboard.tsx` - add to `apparatusList` array

### Customize Styling

All components use Tailwind CSS. Modify classes in component files or update `tailwind.config.js` for global theme changes.

## Support

For technical issues:
1. Check browser console for errors
2. Verify GitHub token is valid and has correct permissions
3. Review GitHub Issues in repository for existing problems

---

**Built for Miami Beach Fire Department**