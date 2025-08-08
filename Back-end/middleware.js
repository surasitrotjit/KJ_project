const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.SECRET_KEY || 'your-secure-secret';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Token ไม่ถูกต้องหรือหมดอายุ' });

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.status(403).json({ message: 'Token ไม่ถูกต้องหรือหมดอายุ' });
    req.user = user;
    next();
  });
}

module.exports = { authenticateToken, SECRET_KEY };
