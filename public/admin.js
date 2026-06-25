const state = { adminToken: null };

const adminLoginForm = document.getElementById("adminLoginForm");
const adminLogoutBtn = document.getElementById("adminLogoutBtn");
const adminAuthMessage = document.getElementById("adminAuthMessage");
const adminAppointmentsTable = document.getElementById("adminAppointmentsTable");
const adminPatientsTable = document.getElementById("adminPatientsTable");
const adminActionsList = document.getElementById("adminActionsList");
const voiceLogsList = document.getElementById("voiceLogsList");

const kpiToday = document.getElementById("kpiToday");
const kpiPending = document.getElementById("kpiPending");
const kpiCancelled = document.getElementById("kpiCancelled");
const kpiDoctors = document.getElementById("kpiDoctors");

function adminHeaders() {
  return state.adminToken ? { Authorization: `Bearer ${state.adminToken}` } : {};
}

async function adminLogin(event) {
  event.preventDefault();
  const email = document.getElementById("adminEmail").value.trim();
  const password = document.getElementById("adminPassword").value.trim();

  const response = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  const data = await response.json();
  if (!response.ok) {
    adminAuthMessage.textContent = data.message || "Login failed.";
    return;
  }

  if (data.user.role !== "admin") {
    adminAuthMessage.textContent = "This account is not an admin.";
    return;
  }

  state.adminToken = data.token;
  adminLogoutBtn.classList.remove("d-none");
  adminAuthMessage.textContent = `Logged in as ${data.user.name}`;
  await refreshAdminDashboard();
}

async function adminLogout() {
  if (!state.adminToken) return;
  await fetch("/api/logout", { method: "POST", headers: adminHeaders() });
  state.adminToken = null;
  adminLogoutBtn.classList.add("d-none");
  adminAuthMessage.textContent = "Signed out.";
  adminAppointmentsTable.innerHTML = `<tr><td colspan="6" class="text-muted">Login required.</td></tr>`;
  adminPatientsTable.innerHTML = `<tr><td colspan="4" class="text-muted">Login required.</td></tr>`;
  adminActionsList.textContent = "Login required.";
  voiceLogsList.textContent = "Login required.";
}

async function refreshAdminDashboard() {
  if (!state.adminToken) {
    return;
  }

  const [summaryRes, appointmentsRes, logsRes, patientsRes, actionsRes] = await Promise.all([
    fetch("/api/admin/summary", { headers: adminHeaders() }),
    fetch("/api/appointments", { headers: adminHeaders() }),
    fetch("/api/voice/logs", { headers: adminHeaders() }),
    fetch("/api/admin/patients", { headers: adminHeaders() }),
    fetch("/api/admin/actions", { headers: adminHeaders() })
  ]);

  if (!summaryRes.ok || !appointmentsRes.ok || !logsRes.ok || !patientsRes.ok || !actionsRes.ok) {
    adminAuthMessage.textContent = "Admin session expired. Please login again.";
    state.adminToken = null;
    adminLogoutBtn.classList.add("d-none");
    return;
  }

  const summary = (await summaryRes.json()).summary;
  const appointments = (await appointmentsRes.json()).appointments;
  const logs = (await logsRes.json()).logs;
  const patients = (await patientsRes.json()).patients;
  const actions = (await actionsRes.json()).actions;

  kpiToday.textContent = summary.todayBookings;
  kpiPending.textContent = summary.pendingRequests;
  kpiCancelled.textContent = summary.cancelledBookings;
  kpiDoctors.textContent = summary.activeDoctors;

  adminAppointmentsTable.innerHTML = "";
  appointments.forEach((item) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${item.id}</td>
      <td>${item.patientName}</td>
      <td>${item.doctorName}</td>
      <td>${item.date} ${item.time}</td>
      <td>${item.status}</td>
      <td>
        <select class="form-select form-select-sm" aria-label="Appointment status">
          <option ${item.status === "Pending" ? "selected" : ""}>Pending</option>
          <option ${item.status === "Confirmed" ? "selected" : ""}>Confirmed</option>
          <option ${item.status === "Cancelled" ? "selected" : ""}>Cancelled</option>
          <option ${item.status === "Completed" ? "selected" : ""}>Completed</option>
          <option ${item.status === "Rescheduled" ? "selected" : ""}>Rescheduled</option>
        </select>
      </td>
    `;
    row.querySelector("select").addEventListener("change", async (event) => {
      await fetch(`/api/appointments/${item.id}/status`, {
        method: "PUT",
        headers: { ...adminHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ status: event.target.value })
      });
      await refreshAdminDashboard();
    });
    adminAppointmentsTable.appendChild(row);
  });

  voiceLogsList.innerHTML = logs
    .slice(0, 8)
    .map((log) => `<div class="mb-2"><strong>${log.parsedIntent}</strong> (${log.confidence})<br>${log.transcriptSnippet}</div>`)
    .join("");

  adminPatientsTable.innerHTML = "";
  patients.forEach((patient) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${patient.patientName}</td>
      <td>${patient.patientEmail}</td>
      <td>${patient.totalBookings}</td>
      <td>${patient.lastBookingAt}</td>
    `;
    adminPatientsTable.appendChild(row);
  });

  adminActionsList.innerHTML = actions
    .slice(0, 8)
    .map((action) => `<div class="mb-2"><strong>${action.actionType}</strong><br>${action.targetRecord}</div>`)
    .join("");
}

if (adminLoginForm) adminLoginForm.addEventListener("submit", adminLogin);
if (adminLogoutBtn) adminLogoutBtn.addEventListener("click", adminLogout);
