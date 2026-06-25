const { validateAvailabilityInput } = require("../middleware/validate");

function getAvailability(db) {
  return (req, res) => {
    const doctorId = Number(req.query.doctorId);

    if (!Number.isInteger(doctorId)) {
      return res.status(400).json({ message: "doctorId query parameter is required." });
    }

    const slots = db.prepare(`
      SELECT id, doctor_id AS doctorId, date, start_time AS startTime, end_time AS endTime, status
      FROM availability_slots
      WHERE doctor_id = ? AND status = 'available'
      ORDER BY id ASC
    `).all(doctorId);

    return res.json({ slots });
  };
}

function createAvailability(db) {
  return (req, res) => {
    const validation = validateAvailabilityInput(req.body);
    if (!validation.ok) {
      return res.status(400).json({ message: validation.message });
    }

    const doctor = db.prepare("SELECT id FROM doctors WHERE id = ? AND active = 1").get(validation.data.doctorId);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found." });
    }

    const insertResult = db.prepare(`
      INSERT INTO availability_slots (doctor_id, date, start_time, end_time, status)
      VALUES (?, ?, ?, ?, 'available')
    `).run(
      validation.data.doctorId,
      validation.data.date,
      validation.data.startTime,
      validation.data.endTime
    );

    db.prepare(`
      INSERT INTO admin_actions (admin_id, action_type, target_record)
      VALUES (?, 'CREATE_SLOT', ?)
    `).run(req.user.userId, `slot:${insertResult.lastInsertRowid}`);

    return res.status(201).json({ message: "Availability slot created." });
  };
}

module.exports = {
  getAvailability,
  createAvailability
};
