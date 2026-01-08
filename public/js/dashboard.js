import {
  auth,
  db,
  query,
  collection,
  where,
  orderBy,
  onSnapshot,
  onAuthStateChanged,
} from "./firebase.js";

const listContainer = document.getElementById("my-oer-list");
const userEmailSpan = document.getElementById("user-email");

let unsubscribe = null;

onAuthStateChanged(auth, (user) => {
  if (user) {
    userEmailSpan.textContent = user.email;
    loadUserRequests(user.uid);
  } else {
    userEmailSpan.textContent = "";
    listContainer.innerHTML = "";
    if (unsubscribe) unsubscribe();
  }
});

function loadUserRequests(userId) {
  const q = query(
    collection(db, "requests"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );

  unsubscribe = onSnapshot(q, (querySnapshot) => {
    listContainer.innerHTML = "";
    if (querySnapshot.empty) {
      listContainer.innerHTML =
        '<p style="text-align: center; color: #666; margin-top: 2rem;">Belum ada request.</p>';
      return;
    }

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const card = createCard(data);
      listContainer.appendChild(card);
    });
  });
}

function createCard(data) {
  const div = document.createElement("div");
  div.className = "card";

  const date =
    data.createdAt && data.createdAt.toDate
      ? data.createdAt.toDate().toLocaleDateString("id-ID")
      : "Baru saja";

  let detailsHtml = "";
  if (data.category === "PC") {
    detailsHtml = `
            <div class="detail-row"><span class="detail-label">Project:</span> ${
              data.project || "-"
            }</div>
        `;
  } else if (data.category === "NB_MN_TAB") {
    detailsHtml = `
            <div class="detail-row"><span class="detail-label">Tipe:</span> ${
              data.subType || "-"
            }</div>
        `;
  } else if (data.category === "Software") {
    detailsHtml = `
            <div class="detail-row"><span class="detail-label">Software:</span> ${
              data.softwareList || "-"
            }</div>
        `;
  } else if (data.category === "Lain-lain") {
    detailsHtml = `
            <div class="detail-row"><span class="detail-label">Keperluan:</span> ${
              data.details || "-"
            }</div>
        `;
  }

  const statusClass =
    data.status === "Active" ? "status-active" : "status-closed";

  div.innerHTML = `
        <div class="card-header">
            <div class="user-info">
                <h3>${data.category}</h3>
                <span>${date}</span>
            </div>
            <span class="status-badge ${statusClass}">${data.status}</span>
        </div>
        <div class="card-body">
            <div class="detail-row"><span class="detail-label">User:</span> ${
              data.userName || "-"
            }</div>
            <div class="detail-row"><span class="detail-label">Job Title:</span> ${
              data.jobTitle || data.department || "-"
            }</div>
            ${detailsHtml}
        </div>
    `;

  return div;
}
