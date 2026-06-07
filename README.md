# 🚀 Headless WordPress with Next.js

**The ultimate headless WordPress solution** - Transform any WordPress site into a blazing-fast, modern web application powered by Next.js 16 and React 19.

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)

> 🌐 Created by [Whspe](https://www.whspe.com) - Free & Open Source

---

## 🆕 What's New in v1.2.0

- 🔐 **Hardened security** — signed, expiring sessions, server-side auth guards on every admin action, and salted scrypt password hashing
- 🛠️ **Fixed auto-updater** — update checks now point at the correct repository
- 🧹 **Cleaner codebase** — zero ESLint warnings and stronger TypeScript types throughout

See the full [CHANGELOG](CHANGELOG.md). Built and maintained by [Whspe](https://www.whspe.com).

---

## ✨ Features

### 🎯 Core Features
- **⚡ Lightning Fast** - Next.js 16 with React 19 and React Compiler
- **🔌 Easy Setup** - Connect to any WordPress site in minutes
- **🎨 Visual Customization** - Theme colors, fonts, and layouts from admin panel
- **📱 Fully Responsive** - Mobile-first design that looks great everywhere
- **🔍 SEO Optimized** - Automatic meta tags, sitemaps, and hreflang support

### 🛠️ Admin Dashboard
- **Homepage Builder** - Drag & drop sections (Hero, Posts Grid, CTA, etc.)
- **Menu Management** - Primary & footer menus with submenu support
- **Theme Editor** - Real-time color customization
- **Ads Management** - Configure ad slots across your site
- **Pages Manager** - Create local pages without WordPress
- **Language Settings** - 80+ languages with customizable UI strings
- **Security** - Password-protected admin panel

### 📊 Technical Highlights
- **GraphQL Integration** - Efficient data fetching from WordPress
- **ISR Support** - Incremental Static Regeneration for fresh content
- **Image Optimization** - Next.js Image component with lazy loading
- **CSS Modules** - Scoped, optimized styling
- **TypeScript** - Full type safety

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- A WordPress site with GraphQL plugin (WPGraphQL)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/Turkeyseo/headlesswordpress.git
cd headlesswordpress
```

2. **Install dependencies**
```bash
npm install
```

3. **Start development server**
```bash
npm run dev
```

4. **Open your browser**
Navigate to `http://localhost:3000/install` and follow the setup wizard.

---

## 📖 Configuration

### WordPress Setup

1. Install [WPGraphQL](https://wordpress.org/plugins/wp-graphql/) plugin on your WordPress site
2. (Optional) Install [Yoast SEO](https://wordpress.org/plugins/wordpress-seo/) for enhanced SEO data
3. Ensure your WordPress permalinks are set to "Post name"

### Environment Variables (Optional)

Create a `.env.local` file:

```env
# Optional: Override WordPress URL (otherwise set via admin panel)
WORDPRESS_URL=https://your-wordpress-site.com

# Recommended in production (see the Security section for details)
SESSION_SECRET=change-me-to-a-long-random-string
# REVALIDATION_SECRET=another-random-string
# NEXT_PUBLIC_IMAGE_HOSTS=cdn.example.com,images.example.org
# SERVER_ACTION_ORIGINS=your-domain.com
```

---

## 🏗️ Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── manager/           # Admin dashboard
│   ├── install/           # Setup wizard
│   ├── category/          # Category pages
│   └── [...slug]/         # Dynamic post/page routes
├── components/
│   ├── layout/            # Header, Footer
│   ├── sections/          # Homepage sections
│   ├── ui/                # Reusable UI components
│   └── manager/           # Admin components
├── lib/
│   ├── wordpress.ts       # GraphQL queries
│   ├── config.ts          # Site configuration
│   ├── actions.ts         # Server actions
│   └── utils.ts           # Helper functions
└── styles/                # Global styles
```

---

## 🎨 Customization

### Theme Colors

Access the admin panel at `/manager` and navigate to **Theme** tab to customize:
- Primary & Secondary colors
- Background & Foreground
- Accent colors
- Border & Muted colors

### Homepage Sections

Available section types:
- **Hero** - Full-width banner with CTA
- **Posts Grid** - Card-based post layout
- **Posts List** - Compact list layout
- **Posts Carousel** - Sliding post cards
- **Category Tabs** - Tabbed post navigation
- **CTA** - Call-to-action blocks
- **HTML Block** - Custom HTML content

---

## 🌍 Multi-Language Support

The system supports 80+ languages including:
- Major European languages (EN, DE, FR, ES, IT, PT, etc.)
- Asian languages (ZH, JA, KO, HI, TH, VI, etc.)
- Middle Eastern languages (AR, FA, HE, TR, etc.)
- African languages (SW, AM, HA, etc.)
- And many more...

Configure language and customize all UI strings from the **Languages** tab in admin panel.

---

## 📢 Ads Management

Built-in ad management with predefined slots:
- Header Top
- Homepage - Below Hero
- Post Top / Middle / Bottom
- Sidebar Top
- Footer Top

Simply paste your ad code (Google AdSense, etc.) and toggle activation.

---

## 🚀 Deployment

### Vercel / Netlify (Read-Only Environments)

This project uses a JSON-based configuration file (`site-config.json`) which requires write access.
Serverless platforms like Vercel and Netlify use a **Read-Only Filesystem**, meaning:
1.  **Installation Wizard will not work** (cannot save config).
2.  **Admin Panel changes will not be saved** (theme, menus, etc. will reset).

**Recommended Workflow for Vercel/Netlify:**
1.  Run the project locally (`npm run dev`).
2.  Complete the installation and customize your site (Theme, Menus, Homepage) via `http://localhost:3000/manager`.
3.  Your changes are saved to `site-config.json`.
4.  Commit and Push the `site-config.json` file to your Git repository.
5.  Deploy to Vercel/Netlify (connect your repo).
    *   *Note: Ensure you set the `WORDPRESS_URL` environment variable in your Vercel project settings.*

### Self-Hosted (VPS / Node.js)

```bash
npm run build
npm start
```

---

## 🔒 Security

- Admin panel is password-protected
- Passwords stored as **salted scrypt** hashes (legacy SHA-256 hashes are auto-upgraded on next login)
- Sessions use **HMAC-signed, expiring tokens** (cannot be forged by setting a cookie)
- Every admin server action and the update endpoint enforce authentication server-side
- No direct database access from frontend
- WordPress remains hidden from visitors

### Recommended environment variables for production

| Variable | Purpose |
|----------|---------|
| `SESSION_SECRET` | Secret used to sign session tokens. Set a long random value (≥32 chars) — important when running multiple instances. If unset, a per-site secret is generated and stored in `site-config.json`. |
| `REVALIDATION_SECRET` | When set, the `/api/revalidate` webhook requires this secret in the request body (`{ "secret": "..." }`). |
| `NEXT_PUBLIC_IMAGE_HOSTS` | Comma-separated extra image hosts to allow through the Next.js image optimizer (your WordPress domain is allowed automatically). |
| `SERVER_ACTION_ORIGINS` | Comma-separated allowed origins for server actions. Omit to keep the secure same-origin default. |

---

## 🔄 Auto-Update System

This project includes a built-in update system that checks for new versions from GitHub:

### Features
- **Version Check** - Automatically checks for new releases on startup
- **One-Click Update** - Update directly from the admin panel
- **Configuration Preserved** - Your `site-config.json` (settings, menus, theme) is preserved during updates
- **Release Notes** - View what's new before updating

### How to Update

1. Open the admin panel at `/manager`
2. Click on the **Updates** tab
3. If a new version is available, click **Install Update**
4. Restart the application after the update

### Manual Update

If you prefer to update manually:

```bash
# Backup your configuration
cp site-config.json site-config.backup.json

# Pull latest changes
git fetch origin main
git reset --hard origin/main

# Restore your configuration
cp site-config.backup.json site-config.json

# Install dependencies and rebuild
npm install
npm run build
```

---

## 📝 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 💬 Support

- 🌐 Website: [https://www.whspe.com](https://www.whspe.com)
- 🐛 Issues: [GitHub Issues](https://github.com/Turkeyseo/headlesswordpress/issues)

---

## ⭐ Star History

If you find this project useful, please consider giving it a star! ⭐

---

<p align="center">
  Made with ❤️ by <a href="https://www.whspe.com">Whspe</a>
</p>
