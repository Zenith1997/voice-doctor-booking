const state = {
  token: null
};

const loginForm = document.getElementById("doctorPanelLoginForm");
const logoutBtn = document.getElementById("doctorPanelLogoutBtn");
const messageBox = document.getElementById("doctorPanelMessage");
const doctorCreateForm = document.getElementById("doctorCreateForm");
const slotCreateForm = document.getElementById("slotCreateForm");
const slotDoctorId = document.getElementById("slotDoctorId");
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
    const option = document.createElement("option");
    option.value = doctor.id;
    option.textContent = doctor.name;
    slotDoctorId.appendChild(option);

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${doctor.id}</td>
      <td>${doctor.name}</td>
      <td>${doctor.specialty}</td>
      <td>${doctor.location}</td>
      <td>${doctor.active ? "Active" : "Inactive"}</td>
      <td><button class="btn btn-sm btn-outline-danger">Deactivate</button></td>
    `;
    row.querySelector("button").addEventListener("click", async () => {
      await fetch(`/api/doctors/${doctor.id}`, { method: "DELETE", headers: authHeaders() });
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
  const payload = {
    doctorId: Number(slotDoctorId.value),
    date: document.getElementById("slotDate").value.trim(),
    startTime: document.getElementById("slotStart").value.trim(),
    endTime: document.getElementById("slotEnd").value.trim()
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
