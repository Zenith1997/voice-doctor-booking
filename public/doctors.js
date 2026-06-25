const doctorList = document.getElementById("doctorList");
const reloadDoctors = document.getElementById("reloadDoctors");

async function loadDoctors() {
  const response = await fetch("/api/doctors");
  const data = await response.json();
  const doctors = data.doctors || [];

  doctorList.innerHTML = "";
  doctors.forEach((doctor) => {
    const card = document.createElement("div");
    card.className = "col-md-6 col-lg-3";
    card.innerHTML = `
      <div class="card h-100 border-0 shadow-sm doctor-card">
        <div class="card-body">
          <h5 class="card-title fw-bold">${doctor.name}</h5>
          <p class="card-text mb-1"><strong>Specialty:</strong> ${doctor.specialty}</p>
          <p class="card-text mb-1"><strong>Location:</strong> ${doctor.location}</p>
          <p class="card-text text-muted"><strong>Next:</strong> ${doctor.nextAvailable || "Not listed"}</p>
          <a class="btn btn-outline-primary w-100" href="/?doctorId=${doctor.id}#booking">Book this doctor</a>
        </div>
      </div>
    `;
    doctorList.appendChild(card);
  });
}

if (reloadDoctors) {
  reloadDoctors.addEventListener("click", loadDoctors);
}

document.addEventListener("DOMContentLoaded", loadDoctors);
