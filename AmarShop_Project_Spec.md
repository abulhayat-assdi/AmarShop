# AmarShop — Multi-Tenant SaaS E-Commerce Platform

> **প্রজেক্ট স্পেসিফিকেশন (Project Specification)**
> এই ফাইলটি Claude Code-এ দিয়ে ধাপে ধাপে ডেভেলপমেন্ট শুরু করার জন্য তৈরি।
> **ভাষা নীতি:** টেকনিক্যাল স্পেক ইংরেজিতে, ব্যাখ্যামূলক কমেন্ট বাংলায়।

---

## 0. Document Meta / ডকুমেন্ট পরিচিতি

- **Project Name:** AmarShop
- **Owner:** Abul Hayat (Coordinator & Trainer, As-Sunnah Skill Development Institute)
- **Context / প্রেক্ষাপট:** একটি ওপেন SaaS প্ল্যাটফর্ম, যেখানে যে কেউ (institute-এর শিক্ষার্থী বা বাইরের যে কোনো গ্রাহক) কোড না জেনেই নিজের ওয়েবসাইট তৈরি ও পরিচালনা করতে পারবে। শুরুর অনুপ্রেরণা "The Art of Sales & Marketing" কোর্সের শিক্ষার্থীরা হলেও, সেবা সবার জন্য উন্মুক্ত।
- **Build Method:** Vibe coding via Claude Code, deployed to a VPS.
- **Developer:** Solo (Abul Hayat) + later review by a senior developer.
- **Timeline Target:** MVP live within 3–6 months, phased.

---

## 1. Product Vision / প্রোডাক্ট ভিশন

একটি **multi-tenant SaaS** প্ল্যাটফর্ম (Shopify/Wix-অনুপ্রাণিত, কিন্তু ছোট স্কেলে বাস্তবসম্মত), যেখানে:

- প্রতিটি ইউজার একটি অ্যাকাউন্ট খুলে রেডি-মেড টেমপ্লেট থেকে বেছে নিজের সাইট বানাবে।
- **সব ধরনের সাইট সাপোর্ট করবে** — ই-কমার্স, blog, portfolio, agency, landing page ইত্যাদি। যার যেটা দরকার সে সেটা বেছে নেবে।
- **প্রধান ফোকাস ই-কমার্স** — সবচেয়ে বেশি টেমপ্লেট, ফিচার ও যত্ন এই ক্যাটাগরিতে; বাকিগুলো সাপোর্টেড কিন্তু গৌণ।
- ইউজার কোড না জেনেই লোগো, রঙ, কন্টেন্ট, সেকশন পরিবর্তন করতে পারবে (drag-and-drop + পরে AI দিয়ে)।
- **Payment:** ডিফল্টভাবে সবাই প্ল্যাটফর্মের নিজস্ব (একবার কেনা) gateway ব্যবহার করবে; super-admin approval পেলে কোনো ইউজার নিজের আলাদা gateway যুক্ত করতে পারবে (বিস্তারিত §6.2)।

### Guiding Principles / মূলনীতি
1. **One codebase, many tenants** — একবার ফিচার যোগ করলে সবার জন্য প্রযোজ্য (feature flag দিয়ে selective control)।
2. **All site types, e-commerce first** — ই-কমার্স প্রধান ফোকাস, তবে blog/portfolio/agency ইত্যাদিও category হিসেবে সাপোর্টেড।
3. **Template = blueprint, Client site = deep copy** — একজনের পরিবর্তন অন্যের সাইটে প্রভাব ফেলবে না।
4. **No raw code from users** — ইউজার কখনো raw HTML/JS লিখবে না; সব পরিবর্তন structured JSON-এর মধ্যে সীমাবদ্ধ (security + editability)।
5. **Security & performance planned from day one.**

---

## 2. Target Users / টার্গেট ইউজার

- **Anyone / সবার জন্য উন্মুক্ত** — institute-এর শিক্ষার্থী হোক বা বাইরের যে কোনো গ্রাহক, সবাই সেবা নিতে পারবে।
- **Initial seed audience:** As-Sunnah Skill Development Institute-এর "The Art of Sales & Marketing" কোর্সের শিক্ষার্থীরা (প্রথম pilot ব্যবহারকারী)।
- **Site categories:** ই-কমার্স (প্রধান — fashion, food/grocery, handicraft, electronics, cosmetics, general store), এবং এছাড়াও blog, portfolio, agency, landing page ইত্যাদি।

### End-user site language / ইউজারের সাইটের ভাষা
- **Bilingual (Bangla + English)** — টেমপ্লেট ও admin panel উভয় ভাষা সাপোর্ট করবে (i18n ready)।

---

## 3. Tech Stack / টেকনোলজি স্ট্যাক (Confirmed)

| Layer | Choice | কেন |
|---|---|---|
| **Framework** | **Next.js 16.x (App Router)** | সর্বশেষ Active LTS (Next.js 14 EOL হয়েছে অক্টোবর ২০২৫)। Frontend + backend এক codebase; Claude Code-বান্ধব; Turbopack default, দ্রুত build |
| **Runtime** | Node.js 20+ | Next.js 16-এর ন্যূনতম প্রয়োজন |
| **Language** | TypeScript | Type-safety, কম বাগ |
| **React** | React 19 | Next.js 16-এর সাথে সামঞ্জস্যপূর্ণ |
| **Database** | PostgreSQL | Schema-per-tenant isolation-এর জন্য সেরা |
| **ORM** | Prisma | Type-safe, multi-schema migration handling |
| **Connection Pooling** | PgBouncer | Schema-switch দ্রুত করা, connection reuse |
| **Auth** | NextAuth.js (Auth.js) | Security-audited; JWT-তে tenant_id embed |
| **File Storage** | VPS (self-hosted, local) | প্রোডাক্ট ছবি, লোগো, static assets — সব VPS-এ isolated |
| **CDN (optional)** | Cloudflare proxy (free) | VPS-এর সামনে cache/CDN, চাইলে যোগ করা যায় |
| **Backup only** | Cloudflare R2 | শুধুমাত্র DB + assets-এর off-server backup |
| **Cache / Queue** | Redis + BullMQ | Session cache + async background jobs |
| **Image Processing** | Sharp | Upload-এর সময় auto compress + WebP |
| **Template Editor** | GrapesJS (বা Craft.js/Puck) | Block-based drag-and-drop |
| **AI Editing (Phase 3)** | Claude API | JSON schema-বাউন্ডেড ডিজাইন পরিবর্তন |
| **Payment** | bKash + SSLCommerz SDK | Custom abstraction; প্রতি tenant নিজের gateway |
| **Containerization** | Docker + Docker Compose | Reproducible environment |
| **Reverse Proxy + SSL** | Traefik | Auto Let's Encrypt, custom domain auto-SSL |
| **PaaS / Deploy** | Coolify (self-hosted) | GitHub push → auto build/deploy |
| **Hosting** | Hostinger KVM 2 VPS | 2 vCPU, 8GB RAM, 100GB NVMe, 8TB BW |
| **Monitoring** | UptimeRobot + resource alerts | Downtime + RAM/CPU alert |

---

## 4. Multi-Tenancy Architecture / মাল্টি-টেন্যান্ট আর্কিটেকচার

### 4.1 Chosen model: **Schema-per-Tenant**
- একটি PostgreSQL database, প্রতিটি tenant-এর জন্য আলাদা schema (`client_a`, `client_b`, ...)।
- একটি **shared/public schema** থাকবে global data-র জন্য (users, tenants, templates, subscriptions, feature_flags)।

```
PostgreSQL (single DB)
├── public schema (global)
│   ├── users
│   ├── tenants
│   ├── templates            (master template library)
│   ├── subscriptions
│   ├── plans
│   └── tenant_features      (feature flags)
│
├── tenant_client_a schema
│   ├── site_config          (তার সাইটের JSON structure)
│   ├── products
│   ├── orders
│   ├── inventory
│   └── customers
│
└── tenant_client_b schema
    └── ... (same structure)
```

### 4.2 Tenant provisioning flow / নতুন tenant তৈরির ধাপ
1. ইউজার sign-up করে → `public.users` + `public.tenants`-এ row তৈরি।
2. সিস্টেম প্রোগ্রাম্যাটিকভাবে নতুন schema তৈরি করে (`CREATE SCHEMA tenant_xxx`)।
3. সেই schema-তে সব প্রয়োজনীয় টেবিল migrate করে (template migration script)।
4. Subdomain assign হয় (`xxx.amarshop.com`)।

### 4.3 Request routing / রিকোয়েস্ট রাউটিং
- প্রতিটি request-এ subdomain বা custom domain দেখে tenant resolve করা হবে (middleware)।
- JWT-তে `tenant_id` embed থাকবে; middleware সঠিক schema-তে DB connection set করবে।
- **Row-Level Security (RLS)** অতিরিক্ত সেফটি নেট হিসেবে থাকবে।

### 4.4 Migration strategy
- Prisma migrate + একটি custom script যা **সব tenant schema-তে একসাথে migration চালায়**।
- নতুন schema তৈরির সময় সর্বশেষ migration state apply করা হবে।

---

## 5. Template System / টেমপ্লেট সিস্টেম (Block + JSON)

### 5.1 Core concept / মূল ধারণা
একটি টেমপ্লেট = **Structure JSON + Default data JSON + Rendering components**।
ইউজার কখনো raw HTML দেখে না — সে একটি সম্পূর্ণ live preview দেখে, যা Renderer তৈরি করে।

### 5.2 Building blocks / বিল্ডিং ব্লক
Reusable React components, প্রতিটি props দিয়ে ডাটা নেয় (কিছুই hardcode নয়):
- **Common:** `Navbar`, `HeroBanner`, `AboutSection`, `Testimonial`, `Banner/CTA`, `Gallery`, `ContactSection`, `Footer`
- **E-commerce (প্রধান):** `ProductGrid`, `ProductCard`, `CartSummary`, `CategoryBar`
- **Blog/Portfolio/Agency:** `BlogList`, `BlogPost`, `PortfolioGrid`, `ServiceList`, `TeamSection`
- প্রতিটি ব্লকের ২-৩টি স্টাইল ভ্যারিয়েশন → বেশি টেমপ্লেট দ্রুত বানানো যায়।
- **Category-aware:** টেমপ্লেটের `category` অনুযায়ী কোন ব্লকগুলো available তা নির্ধারিত হবে (ই-কমার্স টেমপ্লেটে ProductGrid, blog টেমপ্লেটে BlogList, ইত্যাদি)।

### 5.3 Template structure JSON (উদাহরণ)
```json
{
  "templateName": "Fashion Store 01",
  "category": "fashion",
  "blocks": [
    { "type": "Navbar", "data": { "logo": "/dummy/logo.png", "links": ["Home","Shop","About"] } },
    { "type": "HeroBanner", "data": { "heading": "নতুন কালেকশন ২০২৬", "subheading": "সেরা দামে", "buttonText": "এখনই কিনুন", "bgColor": "#1a1a2e" } },
    { "type": "ProductGrid", "data": { "columns": 3, "products": [] } },
    { "type": "Footer", "data": { "text": "© ২০২৬ আমার শপ" } }
  ]
}
```

### 5.4 Renderer
একটি `TemplateRenderer` component যে `blocks` array পড়ে সঠিক component render করে (block `type` → component map)। এই একই Renderer সব tenant-এর সাইট render করবে।

### 5.5 How a template is added / টেমপ্লেট যোগ করার পদ্ধতি
- **Phase 1 (code-based):** প্রতিটি টেমপ্লেট `/templates/<name>/` ফোল্ডারে `structure.json` + `default-data.json` + `preview.jpg`। App boot-এ seed script এগুলো `public.templates`-এ ঢোকাবে।
- **Phase 3 (admin-based):** Super-admin panel-এ "Add Template" UI দিয়ে কোড ছাড়াই টেমপ্লেট যোগ।

### 5.6 Template vs Instance (গুরুত্বপূর্ণ)
- Master template = read-only blueprint (শুধু admin এডিট করে)।
- ইউজার select করলে → **deep copy** তার `tenant_xxx.site_config`-এ সেভ হয়।
- এরপর ইউজারের সব এডিট শুধু তার copy-তে হয়; master বা অন্য কারো সাইটে প্রভাব পড়ে না।

### 5.7 Editing / এডিটিং
- **Phase 2:** Drag-and-drop editor (block reorder, add/remove section, রঙ/টেক্সট/ছবি পরিবর্তন) → সব `site_config` JSON-এ সেভ।
- **Phase 3:** AI editor — ইউজার ন্যাচারাল ভাষায় বলে ("হিরো ব্যানার নীল করো") → Claude API নির্দিষ্ট JSON schema-তে valid পরিবর্তন দেয় → backend validate করে → render। কখনো raw code নয়।

---

## 6. Core Features / কোর ফিচার

### 6.1 Domain / ডোমেইন
- **Default:** auto subdomain `shop-name.amarshop.com` (Wildcard DNS `*.amarshop.com`)।
- **Custom domain:** ইউজার নিজের ডোমেইন যুক্ত করবে; Traefik + Let's Encrypt দিয়ে auto-SSL; DNS verification (A/CNAME instruction) flow।

### 6.2 Payment gateway / পেমেন্ট গেটওয়ে (Platform-default + optional per-tenant)
পরিবর্তিত মডেল — ইউজার ডিফল্টভাবে নিজের gateway আনবে না:

- **Platform gateway (default):** super-admin একবার একটি gateway (bKash/SSLCommerz) কিনে/সেটআপ করবে। **সব tenant ডিফল্টভাবে এই shared gateway ব্যবহার করবে** তাদের কাস্টমারের পেমেন্ট নিতে।
- **Own gateway (approval-gated):** কোনো tenant নিজের আলাদা gateway যুক্ত করতে চাইলে, **super-admin approval দিলেই তবে** সে নিজের credential যুক্ত করতে পারবে। Approval না থাকলে অপশনটি locked।
- একটি generic `PaymentGateway` interface/abstraction — platform gateway ও per-tenant gateway উভয়কেই একই ভাবে handle করবে।
- Tenant-এর নিজস্ব credential দিলে → **encrypted** store (Node.js `crypto`, plain text কখনো নয়)।
- Hosted checkout ব্যবহার (কার্ড ডাটা নিজে store করা হবে না → PCI এড়ানো)।
- **নোট (fund routing):** platform gateway ব্যবহার করলে টাকা কোথায় জমা হবে ও কীভাবে tenant-কে settle করা হবে — এটি একটি ব্যবসায়িক সিদ্ধান্ত (§13-এ open question হিসেবে রাখা হলো)।

### 6.3 Admin panel (per-tenant) / প্রতি tenant-এর অ্যাডমিন
- Order tracking, inventory management, content management, basic analytics।

### 6.4 Subscription & Billing / সাবস্ক্রিপশন
- **Plans:** Basic / Pro / Premium (তিন স্তর)। প্ল্যান অনুযায়ী feature flag auto-set।
- **One account = one site** ডিফল্ট; একাধিক সাইট চাইলে প্রতিটির জন্য অতিরিক্ত ফি।
- **Billing methods (দুটোই):**
  1. **Automated:** platform-এর নিজস্ব gateway দিয়ে online subscription payment।
  2. **Manual:** bKash personal/send money → super-admin হাতে activate করবে।
- Payment fail হলে: grace period → তারপর site suspend।

### 6.5 Feature Flags / ফিচার ফ্ল্যাগ
- `public.tenant_features` টেবিল: `tenant_id | feature_key | enabled`।
- Backend `hasFeature(tenantId, key)` চেক; frontend-এ login-এ feature list পাঠানো হয় (UI hide/show)।
- Selective (নির্দিষ্ট ক্লায়েন্ট) + plan-based (Basic/Pro/Premium) উভয় ভাবেই কাজ করবে।

### 6.6 Super-Admin Panel / সুপার-অ্যাডমিন (আপনার নিয়ন্ত্রণ) — **Full from Phase 1**
সিদ্ধান্ত: minimal/full ভাগ না করে, **শুরু থেকেই সম্পূর্ণ super-admin panel** তৈরি হবে। এতে থাকবে:
- Tenant management: list, add, suspend, delete, subdomain/custom domain দেখা
- Manual payment activation + subscription/billing management
- Template management: template add/edit/remove (builder UI)
- Feature-flag toggle UI (per-tenant + plan-based)
- Payment gateway approval (কোন tenant নিজের gateway ব্যবহার করতে পারবে — §6.2)
- Billing analytics ও revenue dashboard
- Impersonate (support-এর জন্য নিরাপদভাবে ইউজার অ্যাকাউন্টে ঢোকা)
- **Access Management page (§6.7)**

### 6.7 Access Management / এক্সেস ম্যানেজমেন্ট (RBAC)
Super-admin তার সহকারী হিসেবে নতুন **Admin / Editor** যুক্ত করতে পারবে, যারা নিজ নিজ এক্সেস অনুযায়ী কাজ করবে (template add, content check, ইত্যাদি)।

- একটি ডেডিকেটেড **"Access Management" page** super-admin panel-এ।
- নতুন staff যোগ করার সময় **checkbox দিয়ে granular permission** — কোন কোন page/action-এ এক্সেস পাবে (যেমন: Templates ✓, Tenants ✗, Billing ✗, Feature Flags ✓ ...)।
- **Role-Based Access Control (RBAC)** model:
  - `super_admin` — সর্বময় ক্ষমতা (access management সহ)।
  - `admin` — super-admin যা checkbox দিয়ে দেবে সেই পরিমাণ।
  - `editor` — সীমিত (সাধারণত template/content সংক্রান্ত)।
- প্রতিটি staff-এর permission ডাটাবেজে store হবে (page/action-ভিত্তিক)।
- Backend-এ প্রতিটি protected route/action-এ permission চেক (শুধু UI hide নয়, server-side enforce)।
- সব admin action **audit log**-এ রাখা (কে কী করল — নিরাপত্তা ও জবাবদিহি)।

---

## 7. Storage & Performance / স্টোরেজ ও পারফরম্যান্স

### 7.1 Storage split
- **VPS (self-hosted, local, isolated):** সবকিছু এখানে — PostgreSQL database **এবং** প্রোডাক্ট ছবি, লোগো, static assets।
- **Cloudflare R2:** শুধুমাত্র **backup** (DB backup + assets backup)। কোনো live serving R2 থেকে হবে না।
- **CDN (ঐচ্ছিক):** চাইলে VPS-এর সামনে Cloudflare free proxy বসিয়ে static assets cache করা যায় — VPS-এর disk I/O ও bandwidth বাঁচবে, কিন্তু ফাইল VPS-এই থাকবে।

> **নোট (image serving):** ফাইল VPS-এ থাকায় Sharp দিয়ে optimize + WebP conversion আরও জরুরি, এবং disk usage মনিটর করতে হবে (§7.2)। ইউজার/tenant বাড়লে ও ডিস্ক চাপে পড়লে তখন object storage-এ move করার সিদ্ধান্ত নেওয়া যাবে।

### 7.2 Performance checklist (must implement)
- **PgBouncer** — connection pooling।
- **Sharp** — image auto-optimize/WebP on upload।
- **Next.js ISR** — প্রোডাক্ট পেজ pre-generated (প্রতিবার DB hit নয়)।
- **Composite indexing** — `(tenant_id, key)` + high-filter columns (product name, order status)।
- **Redis caching** — বারবার চাওয়া ডাটা cache।
- **Monitoring** — UptimeRobot + RAM/CPU alert (noisy-neighbor আগে ধরা)।

---

## 8. Security / নিরাপত্তা

- SSH key-only access (password login বন্ধ), non-root deploy user।
- Firewall (UFW): শুধু port 22, 80, 443।
- Per-request tenant/schema validation — cross-tenant access সম্পূর্ণ ব্লক।
- PostgreSQL **Row-Level Security** অতিরিক্ত সেফটি হিসেবে।
- Admin panel-এ 2FA (অন্তত super-admin-এ)।
- Payment credential encrypted at rest; hosted checkout।
- Automated per-schema backup → R2।
- Input validation + rate limiting (Cloudflare free tier WAF ব্যবহার করা যায়)।
- GitHub Actions/Coolify secrets কখনো কোডে hardcode নয়।

---

## 9. Deployment / ডেপ্লয়মেন্ট

```
Claude Code (local dev + test)
      ↓  git push (main branch)
GitHub
      ↓  auto trigger
Coolify (self-hosted on VPS)
      ↓  docker compose up --build
Docker containers: [ Next.js app | PostgreSQL | Redis | PgBouncer ]
      ↓
Traefik (reverse proxy + auto SSL + domain routing)
      ↓
Live site (subdomain / custom domain)
```

- `docker-compose.yml`: app, postgres, redis, pgbouncer, (traefik বা Coolify-managed)।
- Staging ও production environment আলাদা রাখা; env vars/secrets নিরাপদে।
- Local = production parity (একই Docker environment)।

---

## 10. Development Roadmap / রোডম্যাপ (3 Phases)

### Phase 1 — Core Foundation + Full Super-Admin (মাস ১–২)
**লক্ষ্য:** একজন ইউজার sign-up করে একটা টেমপ্লেট দিয়ে সাইট চালাতে পারবে (subdomain-এ), এবং super-admin panel সম্পূর্ণভাবে কাজ করবে।
- [ ] Project setup (Next.js 16 + Node 20 + TS + Prisma + Docker Compose)
- [ ] Auth (NextAuth.js) + JWT with tenant_id
- [ ] Schema-per-tenant provisioning (auto schema create + migrate)
- [ ] Subdomain routing middleware (Wildcard DNS)
- [ ] Block components (৫–৮টি) + TemplateRenderer
- [ ] ৩–৫টি starter template (code-based seed) — ই-কমার্স + অন্তত ১টি non-ecommerce (portfolio/blog)
- [ ] Per-tenant admin panel (product/order/inventory — basic)
- [ ] **Full Super-Admin panel** (§6.6): tenant management, template management, feature-flag UI, billing view, impersonate
- [ ] **Access Management (RBAC)** (§6.7): admin/editor add + checkbox permissions + audit log
- [ ] Self-hosted file storage on VPS (image upload via Sharp) + R2 backup setup

### Phase 2 — Sell-Ready (মাস ৩–৪)
**লক্ষ্য:** ইউজার প্ল্যান কিনে সাইট live করতে ও বিক্রি শুরু করতে পারবে।
- [ ] Payment abstraction + bKash/SSLCommerz integration (per-tenant credential, encrypted)
- [ ] Subscription billing (Basic/Pro/Premium) — automated + manual
- [ ] Grace period / suspend logic
- [ ] Drag-and-drop editor (GrapesJS) — simple version (text/image/color/section)
- [ ] Feature flag system (tenant_features + hasFeature)
- [ ] Pilot test with 3–5 real users (স্যার/সহকর্মী)

### Phase 3 — Polish & Scale (মাস ৫–৬)
**লক্ষ্য:** custom domain, AI editing, full admin — production-grade।
- [ ] Custom domain + auto-SSL (Traefik)
- [ ] AI design editor (Claude API, JSON-schema bounded)
- [ ] Super-admin polish: billing analytics/revenue dashboard refinement (core panel Phase 1-এ done)
- [ ] 20–30 templates (সব category জুড়ে — ই-কমার্স প্রধান)
- [ ] Performance hardening (ISR, indexing, caching audit)
- [ ] Monitoring + automated backup polish

---

## 11. Scaling Plan / স্কেলিং

| Stage | Action |
|---|---|
| 0–100 clients | Hostinger KVM 2 VPS যথেষ্ট |
| 100–500 clients | VPS vertical upgrade (বেশি RAM/CPU) |
| 500–1000+ clients | DB server আলাদা করা; ভারী tenant migrate |
| Enterprise-scale | নির্দিষ্ট বড় ক্লায়েন্টের জন্য dedicated database |

Schema-per-tenant model এই migration path খোলা রাখে (ভারী tenant → আলাদা DB সহজে সরানো যায়)।

---

## 12. Data Model Sketch / ডাটা মডেল (starting point)

### public schema
```
users:          id, email, password_hash, role (user/super_admin/admin/editor), tenant_id, created_at
tenants:        id, name, subdomain, custom_domain, schema_name, status (active/suspended/trial),
                plan_id, site_type (ecommerce/blog/portfolio/agency/landing), own_gateway_approved (bool), created_at
plans:          id, name (Basic/Pro/Premium), price, max_sites, features (json)
subscriptions:  id, tenant_id, plan_id, status, start_date, end_date, payment_method (auto/manual)
templates:      id, name, category (ecommerce/blog/portfolio/agency/landing),
                structure_json, default_data_json, preview_url, is_active
tenant_features: id, tenant_id, feature_key, enabled

-- RBAC / Access Management (§6.7)
staff_members:  id, user_id, role (admin/editor), created_by, created_at
permissions:    id, staff_id, resource (page/action key), can_view, can_edit, can_delete
audit_log:      id, actor_user_id, action, resource, target_id, timestamp, meta (json)

-- Payment (§6.2)
platform_gateway: id, gateway (bkash/sslcommerz), encrypted_credentials, is_active   -- একটি shared gateway
```

### tenant_<x> schema
```
site_config:    id, template_id, blocks_json (live editable structure), theme_json, updated_at
products:       id, name, description, price, stock, images (r2 urls), category, status
orders:         id, customer_id, items_json, total, status, payment_status, created_at
inventory:      id, product_id, quantity, updated_at
customers:      id, name, phone, email, address
payment_config: id, gateway (bkash/sslcommerz), encrypted_credentials, is_active
                -- শুধুমাত্র own_gateway_approved = true হলে ব্যবহৃত; নাহলে platform_gateway ব্যবহার হয়
```
> নোট: exact fields Claude Code-এ implement করার সময় refine হবে; এটি starting schema।

---

## 13. Open Questions / পরে সিদ্ধান্ত নেওয়ার বিষয়

- [ ] প্ল্যান-ভিত্তিক দাম (Basic/Pro/Premium-এর নির্দিষ্ট মূল্য) — পরে ঠিক হবে।
- [ ] প্রতিটি প্ল্যানে কোন কোন feature flag ON থাকবে — পরে map করা হবে।
- [ ] **Fund routing (গুরুত্বপূর্ণ):** platform gateway দিয়ে কাস্টমার পেমেন্ট করলে টাকা প্রথমে কোথায় জমা হবে এবং কীভাবে/কত সময়ে tenant-কে settle করা হবে — ব্যবসায়িক ও আইনি সিদ্ধান্ত।
- [ ] টেমপ্লেট ডিজাইনের সোর্স (নিজে Claude Code দিয়ে বানানো vs রেডিমেড থেকে convert)।
- [ ] Digital Commerce Operator (DCO) রেজিস্ট্রেশন ও bKash/SSLCommerz merchant শর্ত — platform gateway-এর ক্ষেত্রে বিশেষভাবে প্রযোজ্য।
- [ ] Email/SMS provider (order confirmation, subscription reminder)।
- [ ] Non-ecommerce site types (blog/portfolio) কোন প্ল্যানে/কীভাবে monetize হবে (ই-কমার্সের মতোই subscription, নাকি ভিন্ন)।

---

## 14. How to use this file with Claude Code / এই ফাইল কীভাবে ব্যবহার করবেন

1. এই ফাইলটি প্রজেক্ট রুটে `PROJECT_SPEC.md` নামে রাখুন।
2. প্রতিটি module **আলাদা Claude Code session**-এ কাজ করুন (একবারে পুরো সিস্টেম নয় — context হারায়)। যেমন:
   - Session 1: Project scaffold (Next.js 16 + Node 20) + Docker Compose + Prisma setup
   - Session 2: Auth (NextAuth) + schema-per-tenant provisioning
   - Session 3: Subdomain routing middleware
   - Session 4: Block components + TemplateRenderer + starter templates
   - Session 5: Per-tenant admin panel (product/order/inventory)
   - Session 6: Super-admin panel (tenant/template/feature management)
   - Session 7: Access Management / RBAC (roles, permissions, audit log)
   - Session 8: Self-hosted storage (Sharp upload) + R2 backup
   - ... (Phase 2/3 modules একইভাবে আলাদা session-এ)
3. প্রতি session-এ Claude Code-কে এই স্পেকের প্রাসঙ্গিক সেকশন reference করতে বলুন।
4. Phase ধরে এগোন — Phase 1 সম্পূর্ণ ও pilot-tested না হওয়া পর্যন্ত Phase 2-তে যাবেন না।

---

*এই স্পেক একটি জীবন্ত ডকুমেন্ট (living document) — কাজ এগোনোর সাথে সাথে refine করুন।*
