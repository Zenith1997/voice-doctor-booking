function getAdminSummary(db) {
  return (_req, res) => {
    const summary = {
      todayBookings: db.prepare(`
        SELECT COUNT(*) AS count
        FROM appointments
        WHERE date(created_at) = date('now')
      `).get().count,
      pendingRequests: db.prepare(`
        SELECT COUNT(*) AS count
        FROM appointments
        WHERE status = 'Pending'
      `).get().count,
      cancelledBookings: db.prepare(`
        SELECT COUNT(*) AS count
        FROM appointments
        WHERE status = 'Cancelled'
      `).get().count,
      activeDoctors: db.prepare(`
        SELECT COUNT(*) AS count
        FROM doctors
        WHERE active = 1
      `).get().count
    };

    return res.json({ summary });
  };
}

function getAdminActions(db) {
  return (_req, res) => {
    const actions = db.prepare(`
      SELECT a.id, a.action_type AS actionType, a.target_record AS targetRecord,
             a.timestamp,
             u.name AS adminName
      FROM admin_actions a
      JOIN users u ON u.id = a.admin_id
      ORDER BY a.id DESC
      LIMIT 100
    `).all();

    return res.json({ actions });
  };
}

function getAdminPatients(db) {
  return (_req, res) => {
    const patients = db.prepare(`
      SELECT
        patient_name AS patientName,
        COALESCE(patient_email, 'N/A') AS patientEmail,
        COUNT(*) AS totalBookings,
        MAX(created_at) AS lastBookingAt
      FROM appointments
      GROUP BY patient_name, patient_email
      ORDER BY lastBookingAt DESC
    `).all();

    return res.json({ patients });
  };
}

function getAdminDoctors(db) {
  return (_req, res) => {
    const doctors = db.prepare(`
      SELECT id, name, specialty, location, bio, active, created_at AS createdAt
      FROM doctors
      ORDER BY id DESC
    `).all();

    return res.json({ doctors });
  };
}

module.exports = {
  getAdminSummary,
  getAdminActions,
  getAdminPatients,
  getAdminDoctors
};
