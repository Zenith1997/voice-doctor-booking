const state = {
  token: null
};

const loginForm = document.getElementById("doctorPanelLoginForm");
const logoutBtn = document.getElementById("doctorPanelLogoutBtn");
const messageBox = document.getElementById("doctorPanelMessage");
const doctorCreateForm = document.getElementById("doctorCreateForm");
const slotCreateForm = document.getElementById("slotCreateForm");
const slotDoctorId = document.getElementById("slotDoctorId");
const slotDate = document.getElementById("slotDate");
const slotStart = document.getElementById("slotStart");
const slotEnd = document.getElementById("slotEnd");
const doctorRecordsTable = document.getElementById("doctorRecordsTable");

function authHeaders() {
  return state.token ? { Authorization: `Bearer ${state.token}` } : {};
}

async function login(event) {
  event.preventDefault();
  const email = document.getElementById("panelEmail").value.trim();
  const password = document.getElementById("panelPassword").value.trim();

  const response = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  const data = await response.json();

  if (!response.ok) {
    messageBox.textContent = data.message || "Login failed.";
    return;
  }

  if (data.user.role !== "admin") {
    messageBox.textContent = "Only admin users can manage doctor data.";
    return;
  }

  state.token = data.token;
  logoutBtn.classList.remove("d-none");
  messageBox.textContent = `Logged in as ${data.user.name}`;
  await refreshDoctorData();
}

async function logout() {
  if (!state.token) return;
  await fetch("/api/logout", { method: "POST", headers: authHeaders() });
  state.token = null;
  logoutBtn.classList.add("d-none");
  messageBox.textContent = "Signed out.";
  doctorRecordsTable.innerHTML = `<tr><td colspan="6" class="text-muted">Login required.</td></tr>`;
  slotDoctorId.innerHTML = `<option value="">Choose doctor</option>`;
}

async function refreshDoctorData() {
  if (!state.token) {
    return;
  }

  const doctorsRes = await fetch("/api/admin/doctors", { headers: authHeaders() });
  if (!doctorsRes.ok) {
    messageBox.textContent = "Session expired. Please login again.";
    state.token = null;
    logoutBtn.classList.add("d-none");
    return;
  }

  const doctors = (await doctorsRes.json()).doctors;
  slotDoctorId.innerHTML = `<option value="">Choose doctor</option>`;
  doctorRecordsTable.innerHTML = "";

  doctors.forEach((doctor) => {
    const isActive = Number(doctor.active) === 1;
    const option = document.createElement("option");
    option.value = doctor.id;
    option.textContent = doctor.name;
    slotDoctorId.appendChild(option);

    const row = document.createElement("tr");
    const toggleButtonLabel = isActive ? "Deactivate" : "Reactivate";
    const toggleButtonClass = isActive ? "btn-outline-warning" : "btn-outline-success";
    row.innerHTML = `
      <td>${doctor.id}</td>
      <td>${doctor.name}</td>
      <td>${doctor.specialty}</td>
      <td>${doctor.location}</td>
      <td data-role="status">${isActive ? "Active" : "Inactive"}</td>
      <td class="d-flex gap-2">
        <button class="btn btn-sm ${toggleButtonClass}" data-role="toggle">${toggleButtonLabel}</button>
        <button class="btn btn-sm btn-outline-danger" data-role="delete">Delete</button>
      </td>
    `;
    row.querySelector('[data-role="toggle"]').addEventListener("click", async () => {
      const endpoint = isActive
        ? `/api/doctors/${doctor.id}`
        : `/api/doctors/${doctor.id}/reactivate`;
      const method = isActive ? "DELETE" : "PUT";

      const response = await fetch(endpoint, { method, headers: authHeaders() });
      const data = await response.json();
      messageBox.textContent = data.message || "Doctor status updated.";

      if (response.ok) {
        const statusCell = row.querySelector('[data-role="status"]');
        if (statusCell) {
          statusCell.textContent = isActive ? "Inactive" : "Active";
        }
      }
      await refreshDoctorData();
    });

    row.querySelector('[data-role="delete"]').addEventListener("click", async () => {
      const confirmed = window.confirm(
        `Permanently delete ${doctor.name}? This cannot be undone.`
      );
      if (!confirmed) {
        return;
      }

      const response = await fetch(`/api/doctors/${doctor.id}/permanent`, {
        method: "DELETE",
        headers: authHeaders()
      });
      const data = await response.json();
      messageBox.textContent = data.message || "Delete request sent.";
      await refreshDoctorData();
    });

    doctorRecordsTable.appendChild(row);
  });
}

async function createDoctor(event) {
  event.preventDefault();
  const payload = {
    name: document.getElementById("doctorName").value.trim(),
    specialty: document.getElementById("doctorSpecialty").value.trim(),
    location: document.getElementById("doctorLocation").value.trim(),
    bio: document.getElementById("doctorBio").value.trim()
  };

  const response = await fetch("/api/doctors", {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await response.json();
  messageBox.textContent = data.message || "Doctor request sent.";

  if (response.ok) {
    doctorCreateForm.reset();
    await refreshDoctorData();
  }
}

async function createSlot(event) {
  event.preventDefault();
  const startTime = slotStart.value.trim();
  const endTime = slotEnd.value.trim();

  if (!startTime || !endTime) {
    messageBox.textContent = "Please choose both start and end time.";
    return;
  }

  if (startTime === endTime) {
    messageBox.textContent = "End time must be later than start time.";
    return;
  }

  const payload = {
    doctorId: Number(slotDoctorId.value),
    date: slotDate.value.trim(),
    startTime,
    endTime
  };

  const response = await fetch("/api/availability", {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await response.json();
  messageBox.textContent = data.message || "Availability request sent.";

  if (response.ok) {
    slotCreateForm.reset();
  }
}

if (loginForm) loginForm.addEventListener("submit", login);
if (logoutBtn) logoutBtn.addEventListener("click", logout);
if (doctorCreateForm) doctorCreateForm.addEventListener("submit", createDoctor);
if (slotCreateForm) slotCreateForm.addEventListener("submit", createSlot);

document.addEventListener("DOMContentLoaded", () => {
  if (slotDate) {
    slotDate.min = new Date().toISOString().slice(0, 10);
  }
});
