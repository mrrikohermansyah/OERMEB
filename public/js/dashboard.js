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

    // Export All Button Container
    const exportAllContainer = document.createElement("div");
    exportAllContainer.style.textAlign = "right";
    exportAllContainer.style.marginBottom = "20px";

    const exportAllBtn = document.createElement("button");
    exportAllBtn.className = "btn btn-primary";
    exportAllBtn.style.width = "auto";
    exportAllBtn.textContent = "Export All to Image";
    exportAllBtn.onclick = () => exportToImage(listContainer, "All_Requests");

    exportAllContainer.appendChild(exportAllBtn);
    listContainer.appendChild(exportAllContainer);

    const categories = {
      PC: "PC",
      NB_MN_TAB: "NB / MN / TAB",
      Software: "Software",
      "Lain-lain": "Lain-lain",
    };

    const categoryContainers = {};

    // Initialize containers
    for (const [key, label] of Object.entries(categories)) {
      const section = document.createElement("div");
      section.className = "category-section";
      section.style.marginBottom = "30px";
      // section.style.padding = "10px"; // Optional padding

      const header = document.createElement("div");
      header.style.display = "flex";
      header.style.justifyContent = "space-between";
      header.style.alignItems = "center";
      header.style.marginBottom = "15px";
      header.style.borderBottom = "2px solid #eee";
      header.style.paddingBottom = "10px";

      const title = document.createElement("h3");
      title.textContent = label;
      title.style.margin = "0";
      title.style.color = "#1877f2"; // var(--primary-color)

      const exportBtn = document.createElement("button");
      exportBtn.className = "btn btn-secondary";
      exportBtn.style.width = "auto";
      exportBtn.style.fontSize = "0.9rem";
      exportBtn.style.padding = "6px 12px";
      exportBtn.textContent = "Export to Image";
      exportBtn.onclick = () => exportToImage(section, `Requests_${key}`);

      header.appendChild(title);
      header.appendChild(exportBtn);
      section.appendChild(header);

      const cardsContainer = document.createElement("div");
      cardsContainer.className = "cards-wrapper";
      section.appendChild(cardsContainer);

      categoryContainers[key] = { section, cardsContainer, hasItems: false };
    }

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const card = createCard(data);
      const catKey = data.category;

      if (categoryContainers[catKey]) {
        categoryContainers[catKey].cardsContainer.appendChild(card);
        categoryContainers[catKey].hasItems = true;
      }
    });

    // Append sections
    for (const key in categoryContainers) {
      if (categoryContainers[key].hasItems) {
        listContainer.appendChild(categoryContainers[key].section);
      }
    }
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

function exportToImage(element, filename) {
  if (typeof html2canvas === "undefined") {
    alert("Library html2canvas belum dimuat. Silakan refresh halaman.");
    return;
  }

  html2canvas(element, {
    ignoreElements: (node) => {
      return node.tagName === "BUTTON";
    },
    backgroundColor: "#f0f2f5",
    scale: 2,
  })
    .then((canvas) => {
      const link = document.createElement("a");
      link.download = `${filename}_${new Date()
        .toISOString()
        .slice(0, 10)}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    })
    .catch((err) => {
      console.error("Export failed:", err);
      alert("Gagal mengekspor gambar.");
    });
}
