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
const dbDir = path.join(__dirname, "db");

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new DatabaseSync(path.join(dbDir, "app.db"));
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));

createTables(db);
seedDatabase(db);

app.use("/api", authRoutes(db));
app.use("/api", doctorRoutes(db));
app.use("/api", availabilityRoutes(db));
app.use("/api", appointmentRoutes(db));
app.use("/api", voiceRoutes(db, openai));
app.use("/api/admin", adminRoutes(db));

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
