const { validateAppointmentInput } = require("../middleware/validate");

function createAppointment(db) {
  return (req, res) => {
    const validation = validateAppointmentInput(req.body);
    if (!validation.ok) {
      return res.status(400).json({ message: validation.message });
    }

    const doctor = db.prepare(`
      SELECT id, name, specialty, location
      FROM doctors
      WHERE id = ? AND active = 1
    `).get(validation.data.doctorId);

    if (!doctor) {
      return res.status(404).json({ message: "Selected doctor was not found." });
    }

    const slot = db.prepare(`
      SELECT id
      FROM availability_slots
      WHERE doctor_id = ? AND date = ? AND start_time = ? AND status = 'available'
      LIMIT 1
    `).get(validation.data.doctorId, validation.data.date, validation.data.time);

    let slotId = null;
    if (slot) {
      slotId = slot.id;
      db.prepare("UPDATE availability_slots SET status = 'booked' WHERE id = ?").run(slot.id);
    }

    const result = db.prepare(`
      INSERT INTO appointments (
        patient_name,
        patient_email,
        doctor_id,
        slot_id,
        reason,
        status,
        voice_confidence
      )
      VALUES (?, ?, ?, ?, ?, 'Pending', ?)
    `).run(
      validation.data.patientName,
      validation.data.patientEmail,
      validation.data.doctorId,
      slotId,
      validation.data.reason,
      validation.data.voiceConfidence
    );

    const appointment = db.prepare(`
      SELECT a.id, a.patient_name AS patientName, a.patient_email AS patientEmail, a.reason, a.status,
             a.created_at AS createdAt, d.name AS doctorName, d.specialty, d.location
      FROM appointments a
      JOIN doctors d ON d.id = a.doctor_id
      WHERE a.id = ?
    `).get(result.lastInsertRowid);

    return res.status(201).json({
      message: "Appointment submitted. It is pending clinic confirmation.",
      appointment
    });
  };
}

function getAllAppointments(db) {
  return (_req, res) => {
    const appointments = db.prepare(`
      SELECT a.id, a.patient_name AS patientName, a.patient_email AS patientEmail, a.reason,
             a.status, a.created_at AS createdAt, d.name AS doctorName,
             COALESCE(s.date, 'N/A') AS date, COALESCE(s.start_time, 'N/A') AS time
      FROM appointments a
      JOIN doctors d ON d.id = a.doctor_id
      LEFT JOIN availability_slots s ON s.id = a.slot_id
      ORDER BY a.id DESC
    `).all();

    return res.json({ appointments });
  };
}

function updateAppointmentStatus(db) {
  return (req, res) => {
    const id = Number(req.params.id);
    const status = typeof req.body.status === "string" ? req.body.status.trim() : "";

    const allowedStatuses = new Set(["Pending", "Confirmed", "Cancelled", "Completed", "Rescheduled"]);
    if (!Number.isInteger(id) || !allowedStatuses.has(status)) {
      return res.status(400).json({ message: "Invalid appointment id or status." });
    }

    const existing = db.prepare("SELECT id, slot_id FROM appointments WHERE id = ?").get(id);
    if (!existing) {
      return res.status(404).json({ message: "Appointment not found." });
    }

    db.prepare(`
      UPDATE appointments
      SET status = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(status, id);

    if (existing.slot_id && status === "Cancelled") {
      db.prepare("UPDATE availability_slots SET status = 'available' WHERE id = ?").run(existing.slot_id);
    }

    db.prepare(`
      INSERT INTO admin_actions (admin_id, action_type, target_record)
      VALUES (?, 'UPDATE_APPOINTMENT_STATUS', ?)
    `).run(req.user.userId, `appointment:${id}:${status}`);

    return res.json({ message: "Appointment status updated." });
  };
}

module.exports = {
  createAppointment,
  getAllAppointments,
  updateAppointmentStatus
};
