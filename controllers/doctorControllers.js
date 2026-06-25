const { validateDoctorInput } = require("../middleware/validate");

function getAllDoctors(db) {
  return (_req, res) => {
    const doctors = db.prepare(`
      SELECT d.id, d.name, d.specialty, d.location, d.bio, d.active,
      (
        SELECT s.date || ' ' || s.start_time
        FROM availability_slots s
        WHERE s.doctor_id = d.id AND s.status = 'available'
        ORDER BY s.id ASC
        LIMIT 1
      ) AS nextAvailable
      FROM doctors d
      WHERE d.active = 1
      ORDER BY d.name ASC
    `).all();

    res.json({ doctors });
  };
}

function createDoctor(db) {
  return (req, res) => {
    const validation = validateDoctorInput(req.body);
    if (!validation.ok) {
      return res.status(400).json({ message: validation.message });
    }

    try {
      const result = db.prepare(`
        INSERT INTO doctors (name, specialty, location, bio, active)
        VALUES (?, ?, ?, ?, 1)
      `).run(
        validation.data.name,
        validation.data.specialty,
        validation.data.location,
        validation.data.bio
      );

      db.prepare(`
        INSERT INTO admin_actions (admin_id, action_type, target_record)
        VALUES (?, 'CREATE_DOCTOR', ?)
      `).run(req.user.userId, `doctor:${result.lastInsertRowid}`);

      return res.status(201).json({ message: "Doctor created successfully." });
    } catch (error) {
      return res.status(400).json({ message: "Could not create doctor.", error: error.message });
    }
  };
}

function updateDoctor(db) {
  return (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ message: "Invalid doctor id." });
    }

    const validation = validateDoctorInput(req.body);
    if (!validation.ok) {
      return res.status(400).json({ message: validation.message });
    }

    const result = db.prepare(`
      UPDATE doctors
      SET name = ?, specialty = ?, location = ?, bio = ?
      WHERE id = ?
    `).run(
      validation.data.name,
      validation.data.specialty,
      validation.data.location,
      validation.data.bio,
      id
    );

    if (result.changes === 0) {
      return res.status(404).json({ message: "Doctor not found." });
    }

    db.prepare(`
      INSERT INTO admin_actions (admin_id, action_type, target_record)
      VALUES (?, 'UPDATE_DOCTOR', ?)
    `).run(req.user.userId, `doctor:${id}`);

    return res.json({ message: "Doctor updated successfully." });
  };
}

function deleteDoctor(db) {
  return (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ message: "Invalid doctor id." });
    }

    const result = db.prepare("UPDATE doctors SET active = 0 WHERE id = ?").run(id);
    if (result.changes === 0) {
      return res.status(404).json({ message: "Doctor not found." });
    }

    db.prepare(`
      INSERT INTO admin_actions (admin_id, action_type, target_record)
      VALUES (?, 'DEACTIVATE_DOCTOR', ?)
    `).run(req.user.userId, `doctor:${id}`);

    return res.json({ message: "Doctor deactivated successfully." });
  };
}

module.exports = {
  getAllDoctors,
  createDoctor,
  updateDoctor,
  deleteDoctor
};
