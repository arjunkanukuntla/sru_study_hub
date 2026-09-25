# SRU Study Hub — Academic Resource Platform

> An academic resource hub built specifically for **SR University** students to access previous question papers, lab manuals, syllabi, and study materials.

---

## 🏗️ System Architecture & Folder Structure

```
SRU Study Hub/
├── 📁 src/                     # FRONTEND APPLICATION LAYER (React + Vite + TypeScript)
│   ├── 📁 assets/              # Static media & graphic assets
│   ├── 📁 components/          # Reusable UI Components
│   │   ├── 📁 layout/          # Navigation, Topbar, Sidebar, BottomNav, RootLayout
│   │   └── 📁 papers/          # Paper cards & preview components
│   ├── 📁 data/                # Core academic catalog data & seed definitions
│   ├── 📁 lib/                 # Utilities, Cloud Sync & State Management
│   │   ├── store.ts            # Authoritative Zustand state store + Supabase Realtime
│   │   ├── supabaseSync.ts     # Supabase Storage & Database synchronization
│   │   ├── fileUtils.ts        # Client-side PDF synthesis, image compressor & SHA-256
│   │   ├── adminUtils.ts       # Local-only admin authentication & settings guard
│   │   └── anonId.ts           # Anonymous persistent student session manager
│   ├── 📁 pages/               # Application Page Views
│   │   ├── 📁 admin/           # Local-only Admin Dashboard & Login
│   │   ├── HomePage.tsx        # Hero section, catalog stats & quick exploration
│   │   ├── SubjectsPage.tsx    # Course subjects list & filter catalog
│   │   ├── PapersPage.tsx      # Mid-term & End-term previous paper library
│   │   ├── UploadPage.tsx      # Auto-combine image upload & PDF synthesis
│   │   └── ...                 # Additional study, lab, search & policy pages
│   ├── 📁 types/               # TypeScript interface & schema definitions
│   ├── App.tsx                 # Main router & local-environment route guards
│   ├── index.css               # Core CSS Design System (tokens, utilities, dark components)
│   └── main.tsx                # Application entrypoint
│
├── 📁 supabase/                # BACKEND & DATABASE LAYER (Supabase PostgreSQL & Storage)
│   ├── 📁 migrations/          # Authoritative SQL Database Schemas & Policies
│   │   ├── 01_schema.sql       # PostgreSQL tables: papers, resources, subjects
│   │   ├── 02_setup_storage.sql# Storage buckets & public access policies
│   │   ├── 03_fix_policies.sql # Permissive community insert & RLS rules
│   │   ├── 04_add_sha256.sql   # Server-side SHA-256 deduplication constraints
│   │   ├── 05_dedup.sql        # Database deduplication & cleanup helpers
│   │   └── 06_admin_setup.sql  # Admin RPC functions & site settings schema
│   └── 📁 scripts/             # Maintenance & DB management scripts
│
├── 📁 public/                  # Public static assets & favicons
├── package.json                # Dependencies & npm scripts
├── vite.config.ts              # Vite bundle configuration & alias mappings (@/*)
├── tsconfig.json               # TypeScript compiler configuration
└── vercel.json                 # Vercel deployment configuration
```

---

## 🛠️ Key Architectural Features

1. **Authoritative Cloud Synchronization & Deduplication**:
   - Every file upload is hashed via client-side SHA-256 before upload.
   - Server-side PostgreSQL `sha256` unique constraints prevent duplicate paper uploads across users.
   - Deletions performed in the Admin Panel immediately propagate live across all connected clients via Supabase Realtime PostgreSQL channels.

2. **Automatic Multi-Image PDF Synthesis**:
   - When users select multiple image files (JPEG, PNG, WebP) on the Upload Page, the app automatically synthesizes them into a single PDF document in page order before uploading.

3. **Local-Only Admin Panel Security**:
   - The `/admin` and `/admin/dashboard` routes are strictly restricted to local environments (`localhost` / `127.0.0.1`).
   - Requests on production domains (e.g. Vercel) return a standard 404 page for security.

4. **Educational Fair Use & Non-Official Student Utility**:
   - All uploaded content is community-contributed under Educational Fair Use principles.

---

## 🚀 Development & Build Commands

### Prerequisites
- Node.js (v18 or higher)
- npm or pnpm

### Run Locally
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### Access Local Admin Dashboard
Navigate to [http://localhost:5173/admin](http://localhost:5173/admin) when running locally.

### Production Build Verification
```bash
npm run build
```
Compiles TypeScript types and builds optimized distribution bundle in `dist/`.
