const state = {
  doctors: [],
  voiceConfidence: null
};

const doctorList = document.getElementById("doctorList");
const reloadDoctors = document.getElementById("reloadDoctors");
const doctorId = document.getElementById("doctorId");
const patientName = document.getElementById("patientName");
const patientEmail = document.getElementById("patientEmail");
const dateInput = document.getElementById("date");
const timeInput = document.getElementById("time");
const reasonInput = document.getElementById("reason");
const bookingForm = document.getElementById("bookingForm");
const bookingResult = document.getElementById("bookingResult");
const clearBtn = document.getElementById("clearBtn");

const voiceBtn = document.getElementById("voiceBtn");
const transcript = document.getElementById("transcript");
const assistantMessage = document.getElementById("assistantMessage");
const heroVoiceBtn = document.getElementById("heroVoiceBtn");
const voiceChatbot = document.getElementById("voiceChatbot");
const openChatBtn = document.getElementById("openChatBtn");
const closeChatBtn = document.getElementById("closeChatBtn");

function getQueryDoctorId() {
  const params = new URLSearchParams(window.location.search);
  const value = params.get("doctorId");
  return value ? String(Number(value)) : null;
}

async function loadDoctors() {
  const response = await fetch("/api/doctors");
  const data = await response.json();
  state.doctors = data.doctors || [];
  renderDoctors();
  loadDoctorOptions();
}

function renderDoctors() {
  if (!doctorList) {
    return;
  }

  doctorList.innerHTML = "";
  state.doctors.forEach((doctor) => {
    const card = document.createElement("div");
    card.className = "col-md-6 col-lg-3";
    card.innerHTML = `
      <div class="card h-100 border-0 shadow-sm doctor-card">
        <div class="card-body">
          <h5 class="card-title fw-bold">${doctor.name}</h5>
          <p class="card-text mb-1"><strong>Specialty:</strong> ${doctor.specialty}</p>
          <p class="card-text mb-1"><strong>Location:</strong> ${doctor.location}</p>
          <p class="card-text text-muted"><strong>Next:</strong> ${doctor.nextAvailable || "Not listed"}</p>
          <button class="btn btn-outline-primary w-100">Book this doctor</button>
        </div>
      </div>
    `;
    card.querySelector("button").addEventListener("click", () => {
      doctorId.value = String(doctor.id);
      document.getElementById("booking").scrollIntoView({ behavior: "smooth" });
      assistantMessage.textContent = "Doctor selected. Please enter date and time.";
    });
    doctorList.appendChild(card);
  });
}

function loadDoctorOptions() {
  if (!doctorId) {
    return;
  }

  doctorId.innerHTML = `<option value="">Choose doctor</option>`;
  state.doctors.forEach((doctor) => {
    const option = document.createElement("option");
    option.value = doctor.id;
    option.textContent = `${doctor.name} - ${doctor.specialty}`;
    doctorId.appendChild(option);
  });

  const preselectedDoctorId = getQueryDoctorId();
  if (preselectedDoctorId) {
    doctorId.value = preselectedDoctorId;
    assistantMessage.textContent = "Doctor pre-selected from doctors page.";
  }
}

function clearForm() {
  doctorId.value = "";
  patientName.value = "";
  patientEmail.value = "";
  dateInput.value = "";
  timeInput.value = "";
  reasonInput.value = "";
  state.voiceConfidence = null;
  transcript.textContent = "No voice command yet.";
  assistantMessage.textContent = "Voice assistant is ready.";
}

async function submitBooking(event) {
  event.preventDefault();
  const payload = {
    doctorId: Number(doctorId.value),
    patientName: patientName.value.trim(),
    patientEmail: patientEmail.value.trim(),
    date: dateInput.value.trim(),
    time: timeInput.value.trim(),
    reason: reasonInput.value.trim(),
    voiceConfidence: state.voiceConfidence
  };

  const response = await fetch("/api/appointments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await response.json();

  if (!response.ok) {
    bookingResult.innerHTML = `<div class="alert alert-warning mb-0">${data.message || "Booking failed."}</div>`;
    return;
  }

  const appointment = data.appointment;
  bookingResult.innerHTML = `
    <div class="alert alert-success mb-0">
      <h5 class="fw-bold">Appointment submitted</h5>
      <p class="mb-1"><strong>Doctor:</strong> ${appointment.doctorName}</p>
      <p class="mb-1"><strong>Patient:</strong> ${appointment.patientName}</p>
      <p class="mb-1"><strong>Status:</strong> ${appointment.status}</p>
      <p class="mb-0"><strong>Created:</strong> ${appointment.createdAt}</p>
    </div>
  `;
  assistantMessage.textContent = "Booking captured. Clinic staff will review it.";
}

async function parseVoiceTranscript(voiceText) {
  const response = await fetch("/api/voice/parse", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ transcript: voiceText })
  });
  const parsed = await response.json();

  if (!response.ok) {
    assistantMessage.textContent = parsed.message || "Could not parse voice command.";
    return;
  }

  if (parsed.intent === "show_doctors") {
    const doctorsSection = document.getElementById("doctors");
    if (doctorsSection) {
      doctorsSection.scrollIntoView({ behavior: "smooth" });
    }
    return;
  }
  if (parsed.intent === "clear_form") {
    clearForm();
    assistantMessage.textContent = "Form cleared.";
    return;
  }
  if (parsed.intent === "confirm_booking") {
    bookingForm.requestSubmit();
    return;
  }

  if (parsed.doctorId) doctorId.value = String(parsed.doctorId);
  if (parsed.date) dateInput.value = parsed.date;
  if (parsed.time) timeInput.value = parsed.time;
  if (parsed.reason) reasonInput.value = parsed.reason;
  if (parsed.patientName && !patientName.value) patientName.value = parsed.patientName;
  state.voiceConfidence = typeof parsed.confidence === "number" ? parsed.confidence : null;

  assistantMessage.textContent = parsed.message || "I filled the form. Please verify and confirm.";
  document.getElementById("booking").scrollIntoView({ behavior: "smooth" });
}

function startVoiceRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    assistantMessage.textContent = "Speech recognition is not supported in this browser.";
    transcript.textContent = "Voice recognition not supported.";
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = "en-AU";
  recognition.interimResults = false;
  recognition.continuous = false;
  recognition.start();

  voiceBtn.classList.add("listening");
  transcript.textContent = "Listening...";
  assistantMessage.textContent = "Listening...";

  recognition.onresult = async (event) => {
    const voiceText = event.results[0][0].transcript;
    transcript.textContent = voiceText;
    assistantMessage.textContent = "Processing your request...";
    await parseVoiceTranscript(voiceText);
  };

  recognition.onerror = () => {
    assistantMessage.textContent = "Voice recognition error. Please try again.";
    transcript.textContent = "Could not detect voice clearly.";
    voiceBtn.classList.remove("listening");
  };

  recognition.onend = () => {
    voiceBtn.classList.remove("listening");
  };
}

if (openChatBtn) openChatBtn.addEventListener("click", () => voiceChatbot.classList.remove("collapsed"));
if (closeChatBtn) closeChatBtn.addEventListener("click", () => voiceChatbot.classList.add("collapsed"));
if (heroVoiceBtn) heroVoiceBtn.addEventListener("click", () => voiceChatbot.classList.remove("collapsed"));
if (voiceBtn) voiceBtn.addEventListener("click", startVoiceRecognition);
if (clearBtn) clearBtn.addEventListener("click", clearForm);
if (reloadDoctors) reloadDoctors.addEventListener("click", loadDoctors);
if (bookingForm) bookingForm.addEventListener("submit", submitBooking);

document.addEventListener("DOMContentLoaded", async () => {
  await loadDoctors();
});