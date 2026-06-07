# Voice Doctor Booking Website

A responsive Bootstrap website where users can book doctors by normal clicks or by voice commands. The frontend uses the browser Web Speech API for voice input. The backend uses OpenAI to understand flexible voice commands and turn them into booking actions.

## Run locally

```bash
npm install
cp .env.example .env
# paste your OpenAI API key into .env
npm start
```

Open: http://localhost:3000

## Example voice commands

- "Book Dr Sarah Nguyen tomorrow at 10 AM for cardiology"
- "I need a dentist appointment with Dr Chen on Monday at 2 PM"
- "Show me doctors"
- "Clear the form"
- "Book appointment"

## Notes

- Keep your OpenAI API key only in `.env`, never in frontend JavaScript.
- This is a prototype. A real medical booking system needs authentication, privacy/security review, database storage, audit logs, and integration with a clinic scheduling system.
