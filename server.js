import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

// Load OPENAI_API_KEY from .env
// Never expose this key in browser-side JavaScript.
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const doctors = [
  { id: "sarah-nguyen", name: "Dr Sarah Nguyen", specialty: "Cardiology", location: "Geelong Central", next: "Tomorrow 10:00 AM" },
  { id: "james-patel", name: "Dr James Patel", specialty: "General Practice", location: "Waurn Ponds", next: "Today 4:30 PM" },
  { id: "emily-chen", name: "Dr Emily Chen", specialty: "Dentistry", location: "Belmont", next: "Monday 2:00 PM" },
  { id: "michael-brown", name: "Dr Michael Brown", specialty: "Physiotherapy", location: "Highton", next: "Wednesday 11:30 AM" }
];

app.get("/api/doctors", (_req, res) => {
  res.json({ doctors });
});

app.post("/api/voice-command", async (req, res) => {
  try {
    const { transcript } = req.body;

    if (!transcript || typeof transcript !== "string") {
      return res.status(400).json({ error: "transcript is required" });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "Missing OPENAI_API_KEY in .env" });
    }

    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content: `You control a doctor appointment booking UI. Convert the user voice transcript into JSON only.

Available doctors:
${JSON.stringify(doctors, null, 2)}

Return exactly this JSON shape:
{
  "intent": "book_form" | "submit_booking" | "show_doctors" | "clear_form" | "unknown",
  "doctorId": string | null,
  "specialty": string | null,
  "date": string | null,
  "time": string | null,
  "patientName": string | null,
  "reason": string | null,
  "message": string
}

Rules:
- Choose the closest doctor by doctor name or specialty.
- Do not invent medical advice.
- If the user says book/confirm/submit without enough details, use submit_booking and leave missing fields null.
- If unclear, use unknown and a helpful message.`
        },
        { role: "user", content: transcript }
      ],
      text: {
        format: {
          type: "json_object"
        }
      }
    });

    const parsed = JSON.parse(response.output_text);
    res.json(parsed);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Could not process voice command" });
  }
});

app.post("/api/bookings", (req, res) => {
  const { doctorId, patientName, date, time, reason } = req.body;

  if (!doctorId || !patientName || !date || !time) {
    return res.status(400).json({
      error: "Please select a doctor and enter patient name, date, and time."
    });
  }

  const doctor = doctors.find((d) => d.id === doctorId);
  if (!doctor) return res.status(404).json({ error: "Doctor not found" });

  // Prototype only: replace with a database in a real app.
  const booking = {
    id: `BK-${Date.now()}`,
    doctor,
    patientName,
    date,
    time,
    reason: reason || "General consultation",
    status: "Confirmed"
  };

  res.json({ booking });
});

app.listen(port, () => {
  console.log(`Voice doctor booking app running at http://localhost:${port}`);
});
