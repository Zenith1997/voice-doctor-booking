const { sanitizeText } = require("../middleware/validate");

function detectIntent(text) {
  if (text.includes("show doctor")) return "show_doctors";
  if (text.includes("clear")) return "clear_form";
  if (text.includes("confirm booking") || text.includes("confirm appointment")) return "confirm_booking";
  if (text.includes("book") || text.includes("appointment")) return "book_appointment";
  return "unknown";
}

function detectDate(text) {
  if (text.includes("today")) return "Today";
  if (text.includes("tomorrow")) return "Tomorrow";
  const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
  const day = days.find((d) => text.includes(d));
  if (day) return day.charAt(0).toUpperCase() + day.slice(1);

  const dateMatch = text.match(/\d{4}-\d{2}-\d{2}/);
  return dateMatch ? dateMatch[0] : null;
}

function detectTime(text) {
  const match = text.match(/(\d{1,2})([:.]?(\d{2}))?\s?(am|pm)/i);
  if (!match) {
    return null;
  }
  const hour = match[1];
  const minute = match[3] || "00";
  const period = match[4].toUpperCase();
  return `${hour}:${minute} ${period}`;
}

function localParse(transcript, doctors) {
  const text = transcript.toLowerCase();
  const doctor = doctors.find(
    (item) =>
      text.includes(item.name.toLowerCase().replace("dr ", "")) ||
      text.includes(item.specialty.toLowerCase())
  );

  return {
    intent: detectIntent(text),
    doctorId: doctor ? doctor.id : null,
    specialty: doctor ? doctor.specialty : null,
    date: detectDate(text),
    time: detectTime(text),
    patientName: null,
    reason: text.includes("dental")
      ? "Dental consultation"
      : text.includes("heart")
        ? "Cardiology consultation"
        : "General consultation",
    confidence: 0.55,
    needsConfirmation: true,
    message: "Parsed locally. Please review and confirm details."
  };
}

function parseVoiceCommand(db, openai) {
  return async (req, res) => {
    const transcript = sanitizeText(req.body.transcript);
    if (!transcript) {
      return res.status(400).json({ message: "Transcript is required." });
    }

    const doctors = db.prepare(`
      SELECT id, name, specialty
      FROM doctors
      WHERE active = 1
      ORDER BY name ASC
    `).all();

    let parsed = null;
    let status = "processed";

    if (openai) {
      try {
        const response = await openai.responses.create({
          model: "gpt-4.1-mini",
          input: [
            {
              role: "system",
              content: `Parse this voice booking request and return JSON only.
Available doctors: ${JSON.stringify(doctors)}
JSON schema:
{
  "intent": "book_appointment" | "confirm_booking" | "show_doctors" | "clear_form" | "unknown",
  "doctorId": number|null,
  "specialty": string|null,
  "date": string|null,
  "time": string|null,
  "patientName": string|null,
  "reason": string|null,
  "confidence": number,
  "needsConfirmation": true,
  "message": string
}`
            },
            { role: "user", content: transcript }
          ],
          text: { format: { type: "json_object" } }
        });

        parsed = JSON.parse(response.output_text);
      } catch (_error) {
        parsed = localParse(transcript, doctors);
        status = "fallback";
      }
    } else {
      parsed = localParse(transcript, doctors);
      status = "fallback";
    }

    db.prepare(`
      INSERT INTO voice_logs (user_id, transcript_snippet, parsed_intent, confidence, status)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      req.user ? req.user.userId : null,
      transcript.slice(0, 160),
      parsed.intent || "unknown",
      Number(parsed.confidence || 0),
      status
    );

    return res.json(parsed);
  };
}

function getVoiceLogs(db) {
  return (_req, res) => {
    const logs = db.prepare(`
      SELECT id, transcript_snippet AS transcriptSnippet, parsed_intent AS parsedIntent,
             confidence, status, created_at AS createdAt
      FROM voice_logs
      ORDER BY id DESC
      LIMIT 100
    `).all();

    return res.json({ logs });
  };
}

module.exports = {
  parseVoiceCommand,
  getVoiceLogs
};
