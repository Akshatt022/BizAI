const jwt = require('jsonwebtoken');

/**
 * JWT authentication middleware.
 * Expects: Authorization: Bearer <token>
 * Attaches decoded payload to req.user on success.
 */
const auth = (req, res, next) => {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: 'No token provided. Authorization denied.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, email, name, businessName }
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};

module.exports = auth;
