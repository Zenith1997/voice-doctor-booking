const bcrypt = require("bcryptjs");

function seedDatabase(db) {
  const userCount = db.prepare("SELECT COUNT(*) AS count FROM users").get().count;

  if (userCount === 0) {
    const adminPasswordHash = bcrypt.hashSync("admin123", 10);

    db.prepare(`
      INSERT INTO users (name, email, password_hash, role)
      VALUES (?, ?, ?, ?)
    `).run("Clinic Admin", "admin@voicecare.local", adminPasswordHash, "admin");
  }

  const doctorCount = db.prepare("SELECT COUNT(*) AS count FROM doctors").get().count;
  if (doctorCount === 0) {
    const insertDoctor = db.prepare(`
      INSERT INTO doctors (name, specialty, location, bio, active)
      VALUES (?, ?, ?, ?, 1)
    `);

    insertDoctor.run("Dr Sarah Nguyen", "General Practice", "Geelong Central", "Experienced GP focused on family medicine.");
    insertDoctor.run("Dr James Patel", "Dentistry", "Waurn Ponds", "Dental specialist in preventative and restorative care.");
    insertDoctor.run("Dr Emily Chen", "Cardiology", "Belmont", "Cardiologist helping patients with heart health planning.");
    insertDoctor.run("Dr Michael Brown", "Physiotherapy", "Highton", "Physiotherapist supporting musculoskeletal recovery.");
  }

  const slotCount = db.prepare("SELECT COUNT(*) AS count FROM availability_slots").get().count;
  if (slotCount === 0) {
    const insertSlot = db.prepare(`
      INSERT INTO availability_slots (doctor_id, date, start_time, end_time, status)
      VALUES (?, ?, ?, ?, 'available')
    `);

    insertSlot.run(1, "Tomorrow", "10:00 AM", "10:30 AM");
    insertSlot.run(1, "Friday", "02:00 PM", "02:30 PM");
    insertSlot.run(2, "Today", "04:30 PM", "05:00 PM");
    insertSlot.run(3, "Monday", "11:00 AM", "11:30 AM");
    insertSlot.run(4, "Wednesday", "09:00 AM", "09:30 AM");
  }
}

module.exports = seedDatabase;
