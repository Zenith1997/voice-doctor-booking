const express = require("express");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");
const { DatabaseSync } = require("node:sqlite");
const OpenAI = require("openai");

const createTables = require("./models/create");
const seedDatabase = require("./seed");

const authRoutes = require("./routes/authRoutes");
const doctorRoutes = require("./routes/doctorRoutes");
const availabilityRoutes = require("./routes/availabilityRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");
const voiceRoutes = require("./routes/voiceRoutes");
const adminRoutes = require("./routes/adminRoutes");

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const dbDir = process.env.DB_DIR || path.join(__dirname, "db");

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new DatabaseSync(process.env.DB_PATH || path.join(dbDir, "app.db"));
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

createTables(db);
seedDatabase(db);

app.get("/health", (req, res) => {
  try {
    db.prepare("SELECT 1").get();
    res.json({ status: "ok" });
  } catch {
    res.status(503).json({ status: "unhealthy" });
  }
});

app.use("/api", authRoutes(db));
app.use("/api", doctorRoutes(db));
app.use("/api", availabilityRoutes(db));
app.use("/api", appointmentRoutes(db));
app.use("/api", voiceRoutes(db, openai));
app.use("/api/admin", adminRoutes(db));

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
}

module.exports = { app, db };
