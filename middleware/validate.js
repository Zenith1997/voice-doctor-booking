function sanitizeText(value) {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim().replace(/\s+/g, " ");
}

function validateCredentials(body) {
  const email = sanitizeText(body.email).toLowerCase();
  const password = sanitizeText(body.password);

  if (!email || !password) {
    return { ok: false, message: "Email and password are required." };
  }

  if (!email.includes("@")) {
    return { ok: false, message: "A valid email is required." };
  }

  if (password.length < 6) {
    return { ok: false, message: "Password must be at least 6 characters." };
  }

  return { ok: true, data: { email, password } };
}

function validateAppointmentInput(body) {
  const patientName = sanitizeText(body.patientName);
  const patientEmail = sanitizeText(body.patientEmail).toLowerCase();
  const reason = sanitizeText(body.reason || "General consultation");
  const date = sanitizeText(body.date);
  const time = sanitizeText(body.time);
  const doctorId = Number(body.doctorId);
  const voiceConfidence = body.voiceConfidence == null ? null : Number(body.voiceConfidence);

  if (!patientName || !date || !time || !Number.isInteger(doctorId)) {
    return {
      ok: false,
      message: "Doctor, patient name, date, and time are required."
    };
  }

  if (patientEmail && !patientEmail.includes("@")) {
    return { ok: false, message: "Patient email must be valid." };
  }

  return {
    ok: true,
    data: { patientName, patientEmail: patientEmail || null, reason, date, time, doctorId, voiceConfidence }
  };
}

function validateDoctorInput(body) {
  const name = sanitizeText(body.name);
  const specialty = sanitizeText(body.specialty);
  const location = sanitizeText(body.location);
  const bio = sanitizeText(body.bio || "");

  if (!name || !specialty || !location) {
    return { ok: false, message: "Name, specialty, and location are required." };
  }

  return { ok: true, data: { name, specialty, location, bio: bio || null } };
}

function validateAvailabilityInput(body) {
  const doctorId = Number(body.doctorId);
  const date = sanitizeText(body.date);
  const startTime = sanitizeText(body.startTime);
  const endTime = sanitizeText(body.endTime);

  if (!Number.isInteger(doctorId) || !date || !startTime || !endTime) {
    return {
      ok: false,
      message: "Doctor, date, start time, and end time are required."
    };
  }

  return { ok: true, data: { doctorId, date, startTime, endTime } };
}

module.exports = {
  sanitizeText,
  validateCredentials,
  validateAppointmentInput,
  validateDoctorInput,
  validateAvailabilityInput
};
