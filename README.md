# BizData Manager — Full Stack App

A professional, secure business data management platform connected to **AWS RDS (MySQL)**.

---

## Project Structure

```
app/
├── backend/          ← Express API (Node.js)
│   ├── server.js
│   ├── db.js
│   ├── middleware/auth.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── records.js
│   │   └── audit.js
│   └── package.json
├── frontend/         ← React app
│   ├── src/
│   │   ├── App.js
│   │   ├── index.css
│   │   ├── context/AuthContext.js
│   │   ├── utils/api.js
│   │   ├── components/Layout.js
│   │   └── pages/
│   │       ├── LoginPage.js
│   │       ├── DashboardPage.js
│   │       ├── RecordsPage.js
│   │       ├── UsersPage.js
│   │       ├── AuditPage.js
│   │       └── ProfilePage.js
│   └── package.json
├── render.yaml       ← Render.com deploy config
└── .gitignore
```

---

## Features

| Feature | Details |
|---|---|
| **Authentication** | JWT-based, 8h expiry, bcrypt password hashing |
| **Rate limiting** | 20 login attempts per 15 min, 200 API req/min |
| **Security headers** | Helmet.js (XSS, HSTS, CSP, etc.) |
| **Role-based access** | Admin / Manager / Viewer |
| **Audit log** | Immutable trail of all actions |
| **CRUD Records** | Filter, search, paginate business records |
| **User management** | Create, edit, deactivate, reset passwords |
| **Dashboard** | Stats cards + charts (Recharts) |
| **AWS RDS** | Only AWS service used — MySQL via SSL |

---

## STEP 1 — Prepare your AWS RDS

In the AWS Console, make sure:
1. Your RDS instance is **publicly accessible** (or accessible from Render's IPs)
2. The **Security Group inbound rule** allows port `3306` from `0.0.0.0/0` (or Render's IP range)
3. Note down your: endpoint, database name, username, password, port

---

## STEP 2 — Run locally

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Fill in your RDS details in .env
npm run dev         # runs on port 5000
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
# Set REACT_APP_API_URL=http://localhost:5000/api  (for local dev)
npm start           # runs on port 3000
```

Visit: http://localhost:3000

Default login:
- Email: `admin@bizdata.local`
- Password: `Admin@1234!`
⚠️ **Change this immediately after first login!**

---

## STEP 3 — Deploy backend to Render.com (Free)

1. Push this project to a GitHub repository
2. Go to https://render.com → **New Web Service**
3. Connect your GitHub repo
4. Set:
   - **Root directory:** `backend`
   - **Build command:** `npm install`
   - **Start command:** `npm start`
5. Add environment variables (from `.env.example`):
   - `DB_HOST` → your RDS endpoint
   - `DB_NAME` → your database name
   - `DB_USER` → your RDS username
   - `DB_PASSWORD` → your RDS password
   - `DB_PORT` → `3306`
   - `JWT_SECRET` → click "Generate" in Render
   - `FRONTEND_URL` → your frontend URL (add after deploying frontend)
   - `NODE_ENV` → `production`
6. Deploy. Render gives you a URL like: `https://bizdata-api.onrender.com`

---

## STEP 4 — Deploy frontend to Netlify / Vercel (Free)

### Netlify
1. Go to https://netlify.com → **Add new site** → **Import from Git**
2. Set **Base directory:** `frontend`
3. Set **Build command:** `npm run build`
4. Set **Publish directory:** `frontend/build`
5. Add environment variable:
   - `REACT_APP_API_URL` = `https://your-render-url.onrender.com/api`
6. Deploy

### Vercel
```bash
cd frontend
npx vercel --prod
# Set REACT_APP_API_URL when prompted
```

---

## STEP 5 — Connect frontend ↔ backend

After both are deployed:
1. In Render backend settings → add/update `FRONTEND_URL` = your Netlify/Vercel URL
2. In your frontend `.env` → set `REACT_APP_API_URL` = your Render URL + `/api`
3. Redeploy both if needed

---

## Security Checklist

- [ ] Change the default admin password immediately
- [ ] Use a strong, unique `JWT_SECRET` (64+ chars)
- [ ] Set `FRONTEND_URL` to your exact domain (not `*`) in production
- [ ] Restrict RDS Security Group to only allow Render's IPs (optional, more secure)
- [ ] Enable SSL on RDS (already configured in `db.js`)
- [ ] Regularly rotate passwords

---

## API Endpoints Reference

```
POST   /api/auth/login                  Public
GET    /api/auth/me                     Auth required
PUT    /api/auth/change-password        Auth required

GET    /api/users                       Admin/Manager
POST   /api/users                       Admin
PUT    /api/users/:id                   Admin
DELETE /api/users/:id                   Admin
PUT    /api/users/:id/reset-password    Admin

GET    /api/records                     All roles
GET    /api/records/stats               All roles
GET    /api/records/:id                 All roles
POST   /api/records                     Admin/Manager
PUT    /api/records/:id                 Admin/Manager
DELETE /api/records/:id                 Admin only

GET    /api/audit                       Admin only

GET    /health                          Public
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, React Router 6, Axios, Recharts |
| Backend | Node.js, Express 4, JWT, bcryptjs, Helmet |
| Database | AWS RDS MySQL (your instance) |
| Hosting | Render.com (backend) + Netlify/Vercel (frontend) |
| Auth | JWT Bearer tokens, role-based middleware |

---

Built for **ImEx-Tek Global Ltd** | AWS RDS only — no other AWS charges.
