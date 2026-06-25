const bcrypt = require("bcryptjs");
const { createSession, getSession, destroySession } = require("../middleware/auth");
const { validateCredentials } = require("../middleware/validate");

function login(db) {
  return (req, res) => {
    const validation = validateCredentials(req.body);
    if (!validation.ok) {
      return res.status(400).json({ message: validation.message });
    }

    const user = db.prepare(`
      SELECT id, name, email, password_hash, role
      FROM users
      WHERE email = ?
    `).get(validation.data.email);

    if (!user || !bcrypt.compareSync(validation.data.password, user.password_hash)) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const token = createSession(user);
    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  };
}

function logout() {
  return (req, res) => {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : req.headers["x-auth-token"];

    if (token) {
      destroySession(token);
    }

    res.json({ message: "Logged out successfully." });
  };
}

function me() {
  return (req, res) => {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : req.headers["x-auth-token"];
    const session = getSession(token);

    if (!session) {
      return res.status(401).json({ message: "No active session." });
    }

    return res.json({ user: session });
  };
}

module.exports = {
  login,
  logout,
  me
};
