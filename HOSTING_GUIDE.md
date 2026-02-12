# 🚀 Hosting Guide - Chess Learning App

This app is **100% client-side** and requires only static file hosting. No backend server needed!

## ✅ What Runs Client-Side

- ✅ Chess engine (js-chess-engine)
- ✅ AI opponents (all difficulty levels)
- ✅ Game state management
- ✅ Tutorial system
- ✅ Data persistence (IndexedDB)
- ✅ Progress tracking

## 🎯 Recommended Free Hosting Options

### 1️⃣ GitHub Pages (Easiest)

**Setup:**
```bash
# 1. Build the app
npm run build

# 2. Install gh-pages
npm install -D gh-pages

# 3. Add to package.json scripts:
"deploy": "gh-pages -d dist"

# 4. Deploy
npm run deploy
```

**Or use GitHub Actions:** (Already configured in `.github/workflows/deploy.yml`)
1. Go to GitHub repo → Settings → Pages
2. Source: GitHub Actions
3. Push to `main` branch → Auto deploy!

**URL:** `https://<username>.github.io/<repo-name>/`

---

### 2️⃣ Vercel (Best Developer Experience)

**Setup:**
```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Deploy (one command!)
vercel --prod
```

**Or connect GitHub:**
1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repo
3. Auto-deploys on every push!

**Features:**
- ✅ Free: 100GB bandwidth/month
- ✅ Global CDN
- ✅ Automatic HTTPS
- ✅ Custom domains
- ✅ Preview deployments for PRs

---

### 3️⃣ Netlify

**Setup:**
```bash
# 1. Install Netlify CLI
npm i -g netlify-cli

# 2. Login
netlify login

# 3. Deploy
netlify deploy --prod --dir=dist
```

**Or drag & drop:**
1. Build: `npm run build`
2. Go to [app.netlify.com/drop](https://app.netlify.com/drop)
3. Drag the `dist/` folder

**Features:**
- ✅ Free: 100GB bandwidth/month
- ✅ Forms & serverless functions
- ✅ Branch previews
- ✅ Split testing

---

### 4️⃣ Cloudflare Pages

**Setup:**
```bash
# 1. Install Wrangler
npm i -g wrangler

# 2. Login
wrangler login

# 3. Deploy
wrangler pages deploy dist
```

**Features:**
- ✅ **Unlimited bandwidth** (FREE!)
- ✅ Global CDN (fastest)
- ✅ DDoS protection
- ✅ Workers for edge computing

---

### 5️⃣ Other Free Options

| Platform | Bandwidth | Build Time | Custom Domain |
|----------|-----------|------------|---------------|
| **Firebase Hosting** | 10GB/month | ✅ | ✅ |
| **Surge.sh** | Unlimited | ❌ | ✅ |
| **Render** | 100GB/month | ✅ | ✅ |
| **Railway** | 100GB/month | ✅ | ✅ |

---

## 📦 Build for Production

```bash
# Install dependencies
npm install

# Build optimized bundle
npm run build

# Preview locally
npm run preview
```

**Output:** `dist/` folder (~2-5MB)

---

## 🔧 Configuration Files

### Vercel (`vercel.json`)
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite"
}
```

### Netlify (`netlify.toml`)
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### GitHub Pages (`vite.config.ts`)
```typescript
export default defineConfig({
  base: '/chess-learning/', // Replace with your repo name
  // ... rest of config
})
```

---

## 🌐 Custom Domain Setup

### All platforms support free custom domains:

1. **Buy domain** (optional): Namecheap, Cloudflare, Google Domains
2. **Add to platform**: Settings → Domains → Add custom domain
3. **Update DNS**: 
   - CNAME: `www` → `<platform-url>`
   - A record: `@` → Platform IP (if provided)

---

## 🚢 Docker Deployment (Optional)

If you prefer Docker hosting (e.g., AWS ECS, Google Cloud Run):

```bash
# Build Docker image
docker build -t chess-learning .

# Run locally
docker run -p 80:80 chess-learning

# Deploy to cloud (pre-configured)
./scripts/deploy-aws.sh
```

**Note:** This is overkill for a static site. Use Vercel/Netlify instead!

---

## 📊 Comparison

| Platform | Setup Difficulty | Speed | Free Tier | Recommended For |
|----------|-----------------|-------|-----------|-----------------|
| **Vercel** | ⭐ Easy | 🚀 Fast | ✅ Great | **Best overall** |
| **GitHub Pages** | ⭐ Easy | ⚡ Good | ✅ Great | Open source projects |
| **Netlify** | ⭐ Easy | 🚀 Fast | ✅ Great | Teams with forms |
| **Cloudflare** | ⭐⭐ Medium | 🚀🚀 Fastest | ✅ Best | High traffic apps |

---

## 🎯 Quick Start (Recommended)

**For beginners → GitHub Pages**
**For production → Vercel or Cloudflare Pages**

```bash
# One-line deploy to Vercel:
npx vercel --prod

# Or GitHub Pages:
npm install -D gh-pages
npm run build
npx gh-pages -d dist
```

---

## 🔒 Security Notes

- ✅ All hosting platforms provide free HTTPS
- ✅ No server = no server vulnerabilities
- ✅ No API keys exposed (client-side only)
- ✅ User data stays in browser (IndexedDB)

---

## 📈 Performance Optimization

All hosting configs include:
- Gzip/Brotli compression
- HTTP/2 & HTTP/3
- Global CDN caching
- Asset fingerprinting
- Tree-shaking & minification

**Expected metrics:**
- First Load: < 2s
- Lighthouse Score: 95-100
- Bundle Size: 2-5MB (includes chess engine)

---

## 🆘 Troubleshooting

**404 on refresh?**
→ Add SPA redirect (see platform configs above)

**Assets not loading?**
→ Check `vite.config.ts` base path

**Slow initial load?**
→ Enable code splitting in Vite config

---

## 📚 Additional Resources

- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [Vercel Docs](https://vercel.com/docs)
- [Netlify Docs](https://docs.netlify.com)
- [GitHub Pages Guide](https://pages.github.com)

---

**Need help?** Open an issue on GitHub!
