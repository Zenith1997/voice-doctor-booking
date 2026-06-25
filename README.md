# VoiceCare - Voice-Assisted Doctor Booking

VoiceCare is a full-stack prototype that supports:
- Patient booking by manual form or voice command.
- AI-assisted transcript parsing with confirmation before save.
- Admin dashboard for doctors, availability slots, appointment status, and voice logs.
- SQLite-backed persistence using Node's built-in `node:sqlite` (`DatabaseSync`).

## Tech stack

- Frontend: HTML, CSS, Bootstrap, vanilla JavaScript
- Backend: Node.js + Express (CommonJS modular structure)
- Database: SQLite (`db/app.db`)
- AI parsing: OpenAI API (optional fallback parser when no API key is configured)

## Run locally

```bash
npm install
npm start
```

Open: [http://localhost:3000](http://localhost:3000)

## Default admin account

- Email: `admin@voicecare.local`
- Password: `admin123`

## Environment variable (optional)

- `OPENAI_API_KEY`: enables AI parsing for `/api/voice/parse`.
  - If omitted, a local rule-based parser is used.
