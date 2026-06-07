const doctorList = document.getElementById("doctorList");
const doctorSelect = document.getElementById("doctorId");
const bookingForm = document.getElementById("bookingForm");
const transcriptEl = document.getElementById("transcript");
const assistantMessage = document.getElementById("assistantMessage");
const bookingResult = document.getElementById("bookingResult");
const voiceBtn = document.getElementById("voiceBtn");
const heroVoiceBtn = document.getElementById("heroVoiceBtn");
const clearBtn = document.getElementById("clearBtn");
const reloadDoctors = document.getElementById("reloadDoctors");

let doctors = [];

async function loadDoctors() {
  const res = await fetch("/api/doctors");
  const data = await res.json();
  doctors = data.doctors;

  doctorList.innerHTML = doctors.map((doctor) => `
    <div class="col-md-6 col-lg-3">
      <div class="card doctor-card border-0 shadow-sm h-100">
        <div class="card-body p-4">
          <span class="badge text-bg-primary mb-3">${doctor.specialty}</span>
          <h3 class="h5 fw-bold">${doctor.name}</h3>
          <p class="text-muted mb-2">📍 ${doctor.location}</p>
          <p class="mb-3">Next: <strong>${doctor.next}</strong></p>
          <button class="btn btn-outline-primary w-100" onclick="selectDoctor('${doctor.id}')">Select</button>
        </div>
      </div>
    </div>
  `).join("");

  doctorSelect.innerHTML = '<option value="">Select doctor</option>' + doctors.map((doctor) =>
    `<option value="${doctor.id}">${doctor.name} — ${doctor.specialty}</option>`
  ).join("");
}

window.selectDoctor = function selectDoctor(id) {
  doctorSelect.value = id;
  document.getElementById("booking").scrollIntoView({ behavior: "smooth" });
};

function setAssistantMessage(message, type = "info") {
  assistantMessage.className = `alert alert-${type} mt-3 mb-0`;
  assistantMessage.textContent = message;
}

function clearForm() {
  bookingForm.reset();
  setAssistantMessage("Form cleared.", "secondary");
}

function fillFormFromCommand(command) {
  if (command.doctorId) doctorSelect.value = command.doctorId;
  if (command.patientName) document.getElementById("patientName").value = command.patientName;
  if (command.date) document.getElementById("date").value = command.date;
  if (command.time) document.getElementById("time").value = command.time;
  if (command.reason) document.getElementById("reason").value = command.reason;
}

async function processVoiceTranscript(transcript) {
  transcriptEl.textContent = transcript;
  setAssistantMessage("Understanding your command...", "info");

  const res = await fetch("/api/voice-command", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ transcript })
  });

  const command = await res.json();

  if (!res.ok) {
    setAssistantMessage(command.error || "Something went wrong.", "danger");
    return;
  }

  setAssistantMessage(command.message || "Command processed.", "success");

  switch (command.intent) {
    case "book_form":
      fillFormFromCommand(command);
      document.getElementById("booking").scrollIntoView({ behavior: "smooth" });
      break;
    case "submit_booking":
      fillFormFromCommand(command);
      bookingForm.requestSubmit();
      break;
    case "show_doctors":
      document.getElementById("doctors").scrollIntoView({ behavior: "smooth" });
      break;
    case "clear_form":
      clearForm();
      break;
    default:
      setAssistantMessage(command.message || "I did not understand that command.", "warning");
  }
}

function startListening() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    setAssistantMessage("Your browser does not support speech recognition. Try Chrome or Edge.", "warning");
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = "en-AU";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  voiceBtn.classList.add("listening");
  voiceBtn.textContent = "Listening...";
  setAssistantMessage("Listening now. Speak your booking request.", "primary");

  recognition.start();

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    processVoiceTranscript(transcript);
  };

  recognition.onerror = (event) => {
    setAssistantMessage(`Voice error: ${event.error}`, "danger");
  };

  recognition.onend = () => {
    voiceBtn.classList.remove("listening");
    voiceBtn.textContent = "🎙 Start listening";
  };
}

bookingForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const payload = {
    doctorId: doctorSelect.value,
    patientName: document.getElementById("patientName").value.trim(),
    date: document.getElementById("date").value.trim(),
    time: document.getElementById("time").value.trim(),
    reason: document.getElementById("reason").value.trim()
  };

  const res = await fetch("/api/bookings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const data = await res.json();

  if (!res.ok) {
    bookingResult.innerHTML = `<div class="alert alert-danger mb-0">${data.error}</div>`;
    return;
  }

  bookingResult.innerHTML = `
    <div class="alert alert-success">Appointment confirmed.</div>
    <p><strong>Booking ID:</strong> ${data.booking.id}</p>
    <p><strong>Doctor:</strong> ${data.booking.doctor.name}</p>
    <p><strong>Patient:</strong> ${data.booking.patientName}</p>
    <p><strong>Date/time:</strong> ${data.booking.date} at ${data.booking.time}</p>
    <p><strong>Reason:</strong> ${data.booking.reason}</p>
  `;
});

voiceBtn.addEventListener("click", startListening);
heroVoiceBtn.addEventListener("click", startListening);
clearBtn.addEventListener("click", clearForm);
reloadDoctors.addEventListener("click", loadDoctors);

loadDoctors();
