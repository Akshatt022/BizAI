require('dotenv').config();
const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');
const path     = require('path');

const app  = express();
const isProd = process.env.NODE_ENV === 'production';

// ── Middleware ────────────────────────────────────────────────────────────────
const allowedOrigins = isProd
  ? [
      process.env.CLIENT_URL,                     // your exact frontend URL
      /\.onrender\.com$/,                          // any *.onrender.com (covers Render previews)
    ].filter(Boolean)
  : ['http://localhost:5173', 'http://127.0.0.1:5173',
     'http://localhost:5174', 'http://127.0.0.1:5174',
     'http://localhost:5175', 'http://127.0.0.1:5175'];

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // allow non-browser (Postman, curl)
    const allowed = allowedOrigins.some(o =>
      typeof o === 'string' ? o === origin : o.test(origin)
    );
    if (allowed) return cb(null, true);
    cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/sales',     require('./routes/sales'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/ai',        require('./routes/ai'));
app.use('/api/seed',      require('./routes/seed'));
app.use('/api/products',  require('./routes/products'));
app.use('/api/orders',    require('./routes/orders'));
app.use('/api/shops',     require('./routes/shops'));

// ── Serve built React app in production ──────────────────────────────────────
if (isProd) {
  // Works whether started from repo root (Render) or from server/ (local)
  // __dirname is always <repo>/server, so ../ always resolves to <repo>/
  const clientBuild = path.join(__dirname, '..', 'client', 'dist');
  app.use(express.static(clientBuild));
  app.get(/^(?!\/api).*/, (_req, res) =>
    res.sendFile(path.join(clientBuild, 'index.html'))
  );
} else {
  // Dev health-check
  app.get('/', (_req, res) =>
    res.json({ success: true, message: '⚡ BizAI Server is running (dev)' })
  );
}

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ success: false, message: err.message || 'Internal server error' });
});

// ── Database + Server start ───────────────────────────────────────────────────
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () =>
      console.log(`🚀 BizAI running on port ${PORT} [${isProd ? 'production' : 'development'}]`)
    );
  })
  .catch(err => {
    console.error('DB connection failed:', err.message);
    process.exit(1);
  });
