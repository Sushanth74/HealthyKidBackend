// middleware/validate.js
const validateRegister = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  // Add more validation as needed (e.g., regex for email)
  next();
};

module.exports = { validateRegister };
