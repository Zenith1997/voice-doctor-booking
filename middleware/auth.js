const sessions = new Map();

function createSession(user) {
  const token = `${user.id}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  sessions.set(token, {
    userId: user.id,
    email: user.email,
    role: user.role,
    name: user.name
  });
  return token;
}

function getSession(token) {
  if (!token) {
    return null;
  }
  return sessions.get(token) || null;
}

function destroySession(token) {
  sessions.delete(token);
}

function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : req.headers["x-auth-token"];
  const session = getSession(token);

  if (!session) {
    return res.status(401).json({ message: "You must be logged in to perform this action." });
  }

  req.user = session;
  req.token = token;
  next();
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Only administrators can access this endpoint." });
  }
  next();
}

module.exports = {
  createSession,
  getSession,
  destroySession,
  requireAuth,
  requireAdmin
};
