// ===============================
// VoiceCare Doctor Booking App
// Full app.js
// ===============================

// Example doctor data
const doctors = [
  {
    id: 1,
    name: "Dr Sarah Nguyen",
    specialty: "GP",
    location: "Geelong Medical Centre",
    available: "Today 4:30 PM"
  },
  {
    id: 2,
    name: "Dr James Carter",
    specialty: "Dentist",
    location: "Smile Dental Clinic",
    available: "Monday 2:00 PM"
  },
  {
    id: 3,
    name: "Dr Emily Wilson",
    specialty: "Cardiology",
    location: "Heart Care Clinic",
    available: "Tomorrow 10:00 AM"
  },
  {
    id: 4,
    name: "Dr Michael Brown",
    specialty: "Physiotherapy",
    location: "Health Plus Clinic",
    available: "Friday 11:00 AM"
  }
];

// ===============================
// Get HTML elements
// ===============================

const doctorList = document.getElementById("doctorList");
const doctorId = document.getElementById("doctorId");
const patientName = document.getElementById("patientName");
const dateInput = document.getElementById("date");
const timeInput = document.getElementById("time");
const reasonInput = document.getElementById("reason");

const bookingForm = document.getElementById("bookingForm");
const bookingResult = document.getElementById("bookingResult");
const clearBtn = document.getElementById("clearBtn");
const reloadDoctors = document.getElementById("reloadDoctors");

const voiceBtn = document.getElementById("voiceBtn");
const transcript = document.getElementById("transcript");
const assistantMessage = document.getElementById("assistantMessage");

const heroVoiceBtn = document.getElementById("heroVoiceBtn");

const voiceChatbot = document.getElementById("voiceChatbot");
const openChatBtn = document.getElementById("openChatBtn");
const closeChatBtn = document.getElementById("closeChatBtn");

// ===============================
// Render doctors
// ===============================

function renderDoctors() {
  if (!doctorList) return;

  doctorList.innerHTML = "";

  doctors.forEach((doctor) => {
    const card = document.createElement("div");
    card.className = "col-md-6 col-lg-3";

    card.innerHTML = `
      <div class="card h-100 border-0 shadow-sm">
        <div class="card-body">
          <h5 class="card-title fw-bold">${doctor.name}</h5>
          <p class="card-text mb-1">
            <strong>Specialty:</strong> ${doctor.specialty}
          </p>
          <p class="card-text mb-1">
            <strong>Location:</strong> ${doctor.location}
          </p>
          <p class="card-text text-muted">
            <strong>Next:</strong> ${doctor.available}
          </p>
          <button class="btn btn-outline-primary w-100" onclick="selectDoctor(${doctor.id})">
            Book this doctor
          </button>
        </div>
      </div>
    `;

    doctorList.appendChild(card);
  });
}

// ===============================
// Load doctors into select dropdown
// ===============================

function loadDoctorOptions() {
  if (!doctorId) return;

  doctorId.innerHTML = `<option value="">Choose doctor</option>`;

  doctors.forEach((doctor) => {
    const option = document.createElement("option");
    option.value = doctor.id;
    option.textContent = `${doctor.name} - ${doctor.specialty}`;
    doctorId.appendChild(option);
  });
}

// ===============================
// Select doctor from card
// ===============================

function selectDoctor(id) {
  if (!doctorId) return;

  doctorId.value = id;

  const selectedDoctor = doctors.find((doctor) => doctor.id === id);

  if (assistantMessage && selectedDoctor) {
    assistantMessage.textContent = `${selectedDoctor.name} selected. Please choose date and time.`;
  }

  const bookingSection = document.getElementById("booking");
  if (bookingSection) {
    bookingSection.scrollIntoView({ behavior: "smooth" });
  }
}

// Make function available to inline onclick
window.selectDoctor = selectDoctor;

// ===============================
// Clear booking form
// ===============================

function clearForm() {
  if (doctorId) doctorId.value = "";
  if (patientName) patientName.value = "";
  if (dateInput) dateInput.value = "";
  if (timeInput) timeInput.value = "";
  if (reasonInput) reasonInput.value = "";

  if (transcript) transcript.textContent = "No voice command yet.";
  if (assistantMessage) assistantMessage.textContent = "Voice assistant is ready.";
  if (bookingResult) bookingResult.textContent = "No appointment booked yet.";
}

// ===============================
// Booking form submit
// ===============================

if (bookingForm) {
  bookingForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const selectedDoctor = doctors.find(
      (doctor) => String(doctor.id) === String(doctorId.value)
    );

    if (!selectedDoctor) {
      bookingResult.innerHTML = `
        <div class="alert alert-warning mb-0">
          Please select a doctor before confirming.
        </div>
      `;
      return;
    }

    const name = patientName.value.trim();
    const date = dateInput.value.trim();
    const time = timeInput.value.trim();
    const reason = reasonInput.value.trim() || "General consultation";

    if (!name || !date || !time) {
      bookingResult.innerHTML = `
        <div class="alert alert-warning mb-0">
          Please fill patient name, date, and time.
        </div>
      `;
      return;
    }

    bookingResult.innerHTML = `
      <div class="alert alert-success mb-0">
        <h5 class="fw-bold">Appointment confirmed</h5>
        <p class="mb-1"><strong>Doctor:</strong> ${selectedDoctor.name}</p>
        <p class="mb-1"><strong>Patient:</strong> ${name}</p>
        <p class="mb-1"><strong>Date:</strong> ${date}</p>
        <p class="mb-1"><strong>Time:</strong> ${time}</p>
        <p class="mb-0"><strong>Reason:</strong> ${reason}</p>
      </div>
    `;

    if (assistantMessage) {
      assistantMessage.textContent = "Appointment booked successfully.";
    }
  });
}

// ===============================
// Chatbot open / close
// ===============================

if (openChatBtn && voiceChatbot) {
  openChatBtn.addEventListener("click", function () {
    voiceChatbot.classList.remove("collapsed");
  });
}

if (closeChatBtn && voiceChatbot) {
  closeChatBtn.addEventListener("click", function () {
    voiceChatbot.classList.add("collapsed");
  });
}

if (heroVoiceBtn && voiceChatbot) {
  heroVoiceBtn.addEventListener("click", function () {
    voiceChatbot.classList.remove("collapsed");
  });
}

// ===============================
// Voice recognition
// ===============================

function startVoiceRecognition() {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    if (assistantMessage) {
      assistantMessage.textContent =
        "Speech recognition is not supported in this browser. Please use Google Chrome.";
    }

    if (transcript) {
      transcript.textContent = "Voice recognition not supported.";
    }

    return;
  }

  const recognition = new SpeechRecognition();

  recognition.lang = "en-AU";
  recognition.interimResults = false;
  recognition.continuous = false;

  recognition.start();

  if (assistantMessage) {
    assistantMessage.textContent = "Listening...";
  }

  if (transcript) {
    transcript.textContent = "Listening...";
  }

  recognition.onresult = function (event) {
    const voiceText = event.results[0][0].transcript;

    if (transcript) {
      transcript.textContent = voiceText;
    }

    if (assistantMessage) {
      assistantMessage.textContent = "Voice command received.";
    }

    handleVoiceCommand(voiceText);
  };

  recognition.onerror = function () {
    if (assistantMessage) {
      assistantMessage.textContent = "Voice recognition error. Please try again.";
    }

    if (transcript) {
      transcript.textContent = "Could not detect voice clearly.";
    }
  };

  recognition.onend = function () {
    if (assistantMessage && assistantMessage.textContent === "Listening...") {
      assistantMessage.textContent = "No voice command detected.";
    }
  };
}

if (voiceBtn) {
  voiceBtn.addEventListener("click", startVoiceRecognition);
}

// ===============================
// Handle voice commands
// ===============================

function handleVoiceCommand(command) {
  const text = command.toLowerCase();

  if (text.includes("show doctors")) {
    const doctorsSection = document.getElementById("doctors");

    if (doctorsSection) {
      doctorsSection.scrollIntoView({ behavior: "smooth" });
    }

    if (assistantMessage) {
      assistantMessage.textContent = "Showing available doctors.";
    }

    return;
  }

  if (text.includes("clear form") || text.includes("clear")) {
    clearForm();

    if (assistantMessage) {
      assistantMessage.textContent = "Form cleared.";
    }

    return;
  }

  if (text.includes("confirm booking") || text.includes("confirm appointment")) {
    if (bookingForm) {
      bookingForm.requestSubmit();
    }

    return;
  }

  // Detect patient name
  if (text.includes("for zenith")) {
    if (patientName) patientName.value = "Zenith";
  } else if (patientName && patientName.value.trim() === "") {
    patientName.value = "Zenith";
  }

  // Detect doctor or specialty
  let selectedDoctor = null;

  if (text.includes("sarah") || text.includes("gp") || text.includes("general practitioner")) {
    selectedDoctor = doctors.find((doctor) => doctor.name.includes("Sarah"));
  } else if (text.includes("james") || text.includes("dentist") || text.includes("dental")) {
    selectedDoctor = doctors.find((doctor) => doctor.name.includes("James"));
  } else if (text.includes("emily") || text.includes("cardiology") || text.includes("heart")) {
    selectedDoctor = doctors.find((doctor) => doctor.name.includes("Emily"));
  } else if (text.includes("michael") || text.includes("physio") || text.includes("physiotherapy")) {
    selectedDoctor = doctors.find((doctor) => doctor.name.includes("Michael"));
  }

  if (selectedDoctor && doctorId) {
    doctorId.value = selectedDoctor.id;
  }

  // Detect date
  const detectedDate = detectDate(text);
  if (detectedDate && dateInput) {
    dateInput.value = detectedDate;
  }

  // Detect time
  const detectedTime = detectTime(text);
  if (detectedTime && timeInput) {
    timeInput.value = detectedTime;
  }

  // Detect reason
  if (reasonInput) {
    if (text.includes("tooth") || text.includes("dentist") || text.includes("dental")) {
      reasonInput.value = "Dental consultation";
    } else if (text.includes("heart") || text.includes("cardiology")) {
      reasonInput.value = "Cardiology consultation";
    } else if (text.includes("back pain") || text.includes("physio")) {
      reasonInput.value = "Physiotherapy consultation";
    } else if (text.includes("gp") || text.includes("general")) {
      reasonInput.value = "General consultation";
    } else if (reasonInput.value.trim() === "") {
      reasonInput.value = "General consultation";
    }
  }

  if (assistantMessage) {
    assistantMessage.textContent =
      "I filled the booking form. Please check the details and confirm.";
  }

  const bookingSection = document.getElementById("booking");
  if (bookingSection) {
    bookingSection.scrollIntoView({ behavior: "smooth" });
  }
}

// ===============================
// Detect date from voice command
// ===============================

function detectDate(text) {
  if (text.includes("today")) {
    return "Today";
  }

  if (text.includes("tomorrow")) {
    return "Tomorrow";
  }

  const days = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday"
  ];

  for (const day of days) {
    if (text.includes(day)) {
      return capitalise(day);
    }
  }

  // Detect YYYY-MM-DD format
  const datePattern = /\d{4}-\d{2}-\d{2}/;
  const match = text.match(datePattern);

  if (match) {
    return match[0];
  }

  return "";
}

// ===============================
// Detect time from voice command
// ===============================

function detectTime(text) {
  // Matches examples:
  // 10 AM
  // 10:30 AM
  // 4.30 PM
  // 2 pm
  const timePattern = /(\d{1,2})([:.]?(\d{2}))?\s?(am|pm)/i;
  const match = text.match(timePattern);

  if (!match) {
    return "";
  }

  let hour = match[1];
  let minute = match[3] || "00";
  let period = match[4].toUpperCase();

  return `${hour}:${minute} ${period}`;
}

// ===============================
// Helper function
// ===============================

function capitalise(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

// ===============================
// Reload doctors button
// ===============================

if (reloadDoctors) {
  reloadDoctors.addEventListener("click", function () {
    renderDoctors();
    loadDoctorOptions();

    if (assistantMessage) {
      assistantMessage.textContent = "Doctor list reloaded.";
    }
  });
}

// ===============================
// Clear button
// ===============================

if (clearBtn) {
  clearBtn.addEventListener("click", clearForm);
}

// ===============================
// Initialise app
// ===============================

document.addEventListener("DOMContentLoaded", function () {
  renderDoctors();
  loadDoctorOptions();
});