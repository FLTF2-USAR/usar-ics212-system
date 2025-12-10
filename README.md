# MBFD Checkout System

A serverless Progressive Web App (PWA) for Miami Beach Fire Department apparatus daily inspections, built entirely on GitHub Pages with GitHub Issues as the database.

## 🚒 Features

- **Mobile-First Design**: Optimized for tablets and mobile devices
- **Offline Support**: PWA capabilities for offline access
- **IssueOps Backend**: Uses GitHub Issues as a database
- **No External Services**: Completely serverless - runs on GitHub Pages
- **Real-time Fleet Status**: Admin dashboard showing all apparatus status
- **Smart Defect Detection**: Automatically detects existing open defects
- **Email Notifications**: GitHub Actions notify admins of new defects

## 🏗️ Architecture

### Tech Stack
- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Routing**: React Router
- **Data Layer**: GitHub Issues via Octokit REST API
- **Deployment**: GitHub Pages
- **Notifications**: GitHub Actions

### IssueOps Engine

The system uses GitHub Issues as a database:
- **Open Issues with `Defect` label** = Active problems (missing/damaged items)
- **Closed Issues with `Log` label** = Completed daily inspection history
- **Comments on Issues** = Verification updates and resolution notes

## 🚀 Setup Instructions

### 1. Create GitHub Repository

```bash
# Create a new repository on GitHub at github.com/pdarleyjr/mbfd-checkout-system
# Make it public (required for GitHub Pages)
```

### 2. Clone and Install

```bash
git clone https://github.com/pdarleyjr/mbfd-checkout-system.git
cd mbfd-checkout-system
npm install
```

### 3. Configure GitHub Token

1. Go to [GitHub Settings > Tokens](https://github.com/settings/tokens?type=beta)
2. Create a **Fine-Grained Personal Access Token** with:
   - **Repository access**: Only this repository
   - **Permissions**: Issues (Read & Write)
3. Copy `.env.local.example` to `.env.local`
4. Add your token:

```bash
cp .env.local.example .env.local
# Edit .env.local and add your token
```

### 4. Local Development

```bash
npm run dev
```

Visit `http://localhost:5173`

### 5. Deploy to GitHub Pages

```bash
# Build and deploy
npm run deploy
```

### 6. Enable GitHub Pages

1. Go to repository **Settings > Pages**
2. Source: Deploy from branch `gh-pages`
3. Visit: `https://pdarleyjr.github.io/mbfd-checkout-system/`

### 7. Configure Email Notifications (Optional)

1. Go to repository **Settings > Secrets and variables > Actions**
2. Add secrets:
   - `MAIL_USERNAME`: Your Gmail address
   - `MAIL_PASSWORD`: App-specific password
3. Update the email address in `.github/workflows/notify-admin.yml`

## 📱 Usage

### Daily Inspection Flow

1. **Login**: Enter name, rank, and select apparatus
2. **Inspection**: Navigate through each compartment
3. **Mark Status**: 
   - ✅ Present/Working (default)
   - ❌ Missing (opens notes modal)
   - ⚠️ Damaged (opens notes modal)
4. **Submit**: Creates GitHub Issues for defects + Log entry

### Admin Dashboard

- View fleet status at a glance
- See all open defects
- Resolve defects with resolution notes
- Automatic issue closing upon resolution

## 🔒 Security Notes

**IMPORTANT**: This is a **prototype** for internal use. Client-side tokens are generally not recommended for production. For enhanced security:

1. Use fine-grained tokens with minimal permissions
2. Limit token to this repository only
3. Consider implementing a backend proxy for production use
4. Never commit `.env.local` to version control

## 📁 Project Structure

```
mbfd-checkout-system/
├── .github/
│   └── workflows/
│       └── notify-admin.yml      # Email notifications
├── public/
│   ├── data/
│   │   └── rescue_checklist.json # Apparatus inventory
│   ├── manifest.json             # PWA manifest
│   └── sw.js                     # Service worker
├── src/
│   ├── components/
│   │   ├── ui/                   # Reusable UI components
│   │   ├── AdminDashboard.tsx
│   │   ├── InspectionCard.tsx
│   │   ├── InspectionWizard.tsx
│   │   └── LoginScreen.tsx
│   ├── lib/
│   │   ├── github.ts             # GitHub API service
│   │   └── utils.ts              # Utility functions
│   ├── types/
│   │   └── index.ts              # TypeScript types
│   ├── App.tsx                   # Main app with routing
│   └── main.tsx                  # Entry point
├── .env.local.example            # Environment template
├── package.json
├── tailwind.config.js
├── vite.config.ts
└── README.md
```

## 🛠️ Customization

### Adding New Apparatus

Edit `src/types/index.ts`:
```typescript
export type Apparatus = 'Rescue 1' | 'Rescue 2' | 'Your New Truck';
```

### Modifying Checklist

Edit `public/data/rescue_checklist.json`:
```json
{
  "compartments": [
    {
      "id": "new_compartment",
      "title": "New Compartment",
      "items": ["Item 1", "Item 2"]
    }
  ]
}
```

## 📊 Data Flow

```
User Login → Inspection Wizard → GitHub Issues
                                      ↓
                        Open Issues (Defects) ←→ Admin Dashboard
                                      ↓
                        Closed Issues (Logs)
```

## 🐛 Troubleshooting

### "GitHub token not configured" error
- Ensure `.env.local` exists and contains `VITE_GITHUB_TOKEN`
- Verify token has Issues Read & Write permissions
- Restart dev server after adding token

### Issues not appearing
- Check repository name in `src/lib/github.ts` matches your repo
- Verify token permissions in GitHub settings
- Check browser console for API errors

### Deployment issues
- Ensure GitHub Pages is enabled in repository settings
- Verify `base` path in `vite.config.ts` matches repo name
- Check that `gh-pages` branch exists

## 📝 License

Built for Miami Beach Fire Department. For internal use only.

## 🤝 Contributing

This is a department-specific tool. For modifications, contact the IT department.

## 📧 Support

For technical issues, open a GitHub issue or contact the development team.

---

**Built with ❤️ for Miami Beach Fire Department**
