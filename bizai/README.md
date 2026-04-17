# ⚡ BizAI — AI Business Growth Assistant for Local Shops

A full-stack MERN application that helps local shop owners track sales, manage customers, and receive AI-powered growth insights using Google Gemini.

## 🚀 Tech Stack

| Layer     | Technology                          |
|-----------|-------------------------------------|
| Frontend  | React 18 + Vite, Tailwind CSS v4, Recharts |
| Backend   | Node.js + Express.js                |
| Database  | MongoDB (Atlas)                     |
| AI Layer  | Google Gemini 1.5 Flash + Rule-based fallback |
| Auth      | JWT-based authentication (bcrypt)   |

## 📁 Project Structure

```
bizai/
├── server/          # Express API server
│   ├── .env         # Environment variables (never commit this)
│   ├── index.js     # Entry point
│   ├── models/      # Mongoose schemas (User, Sale, Customer)
│   ├── routes/      # API routes (auth, sales, customers, ai)
│   └── middleware/   # JWT auth middleware
├── client/          # React frontend (Vite)
│   ├── src/
│   │   ├── api/         # Axios instance
│   │   ├── context/     # Auth context provider
│   │   ├── pages/       # Login, Register, Dashboard
│   │   └── components/  # Navbar, StatCard, SalesChart, etc.
│   └── index.html
└── README.md
```

## ⚙️ Environment Variables

Create a `server/.env` file with the following:

```env
MONGODB_URI=your_mongodb_connection_string
GEMINI_API_KEY=your_gemini_api_key
JWT_SECRET=your_jwt_secret
PORT=5000
```

## 🛠️ Setup & Run

### Prerequisites
- Node.js 18+ (for native `fetch` support)
- MongoDB Atlas account (or local MongoDB)
- Google Gemini API key

### 1. Clone and install

```bash
# Install server dependencies
cd bizai/server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. Start the backend

```bash
cd bizai/server
npm run dev    # or: node index.js
```

You should see:
```
✅ MongoDB connected successfully
🚀 BizAI server running on http://localhost:5000
```

### 3. Start the frontend

```bash
cd bizai/client
npm run dev
```

Frontend runs at `http://localhost:5173` with API proxy to the backend.

## 📡 API Endpoints

### Auth (`/api/auth`)
| Method | Endpoint    | Description             |
|--------|-------------|-------------------------|
| POST   | `/register` | Create account, get JWT |
| POST   | `/login`    | Login, get JWT          |

### Sales (`/api/sales`) — JWT protected
| Method | Endpoint  | Description                          |
|--------|-----------|--------------------------------------|
| GET    | `/`       | Fetch all sales for user             |
| POST   | `/`       | Add a new sale                       |
| GET    | `/weekly` | Last 7 days revenue aggregated by day|
| GET    | `/stats`  | Total revenue, weekly comparison     |

### Customers (`/api/customers`) — JWT protected
| Method | Endpoint | Description                           |
|--------|----------|---------------------------------------|
| GET    | `/`      | Fetch all customers                   |
| POST   | `/`      | Add a customer                        |
| GET    | `/stats` | Total, new this week, returning count |

### AI (`/api/ai`) — JWT protected
| Method | Endpoint       | Description                           |
|--------|----------------|---------------------------------------|
| POST   | `/insights`    | Get 3-5 AI-generated business insights|
| POST   | `/growth-plan` | Get a 7-day growth action plan        |

## ✨ Features

- 🔐 Secure JWT authentication with bcrypt password hashing
- 📊 Real-time KPI dashboard with 4 stat cards
- 📈 Interactive 7-day revenue chart (Recharts)
- 🤖 AI-powered insights via Google Gemini with smart fallback
- ⚡ 7-day growth plan generator
- 🌙 Stunning dark theme with glassmorphism UI
- 📱 Fully responsive (mobile + desktop)
- 🔔 Toast notifications for all actions
- 💀 Skeleton loading states (no spinners)
- 🔄 Auto-refresh insights after data entry

## 🧠 AI Fallback Engine

If the Gemini API is unavailable, the app uses an intelligent rule-based fallback:
- Sales down >10% → Flash sale / ads suggestion (high priority)
- New customers < 3 → Referral campaign suggestion (high priority)
- Returning customers > 60% → Loyalty program suggestion (medium)
- Revenue growing → Positive reinforcement + upselling tip (low)

## 📝 Known Limitations

- No password reset / forgot password flow
- No data export (CSV/PDF) yet
- Single-user dashboard (no team/multi-user views)
- No real-time WebSocket updates

## 🚀 Future Enhancements

- WhatsApp/SMS integration for customer outreach
- Inventory management module
- Multi-language support (Hindi, regional)
- PWA support for offline use
- Advanced analytics with category breakdowns
- Competitor benchmarking via AI
