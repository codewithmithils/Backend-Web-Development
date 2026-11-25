const jwt = require('jsonwebtoken');

function signToken(sub, role) {
  return jwt.sign({ sub, role }, process.env.ACCESS_SECRET, {
    algorithm: 'HS256',
    expiresIn: '1h',
  });
}

module.exports = { signToken };
