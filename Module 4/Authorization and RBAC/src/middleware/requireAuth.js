const jwt = require('jsonwebtoken');

module.exports = function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({
      error: { code: 'UNAUTHENTICATED', message: 'Bearer token required' },
    });
  }

  try {
    const payload = jwt.verify(token, process.env.ACCESS_SECRET, {
      algorithms: ['HS256'],
    });
    req.user = { id: payload.sub, role: payload.role };
    return next();
  } catch {
    return res.status(401).json({
      error: { code: 'UNAUTHENTICATED', message: 'Invalid or expired token' },
    });
  }
};
