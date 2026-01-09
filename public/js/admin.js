import {
  auth,
  db,
  query,
  collection,
  orderBy,
  onSnapshot,
  updateDoc,
  doc,
  onAuthStateChanged,
} from "./firebase.js";
import { showToast } from "./toast.js";
import {
  getDoc,
  setDoc,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const userEmailSpan = document.getElementById("user-email");

const ADMIN_EMAILS = ["devi.armanda@meitech-ekabintan.com"];
const IT_MEMBERS = [
  "Riko Hermansyah",
  "Abdurahman Hakim",
  "Moch Wahyu Nugroho",
  "Ade Reinalwi",
];

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

onAuthStateChanged(auth, async (user) => {
  if (user) {
    userEmailSpan.textContent = user.email + " (Admin)";
    const ref = doc(db, "users", user.uid);
    try {
      let userDoc = await getDoc(ref);
      if (!userDoc.exists()) {
        const role = ADMIN_EMAILS.includes(user.email) ? "admin" : "user";
        await setDoc(ref, {
          email: user.email,
          role,
          createdAt: new Date(),
        });
        userDoc = await getDoc(ref);
      }
      const role = userDoc.data()?.role;
      if (role === "admin") {
        loadAllRequests();
      } else {
        alert("Akses ditolak. Area khusus Admin.");
        window.location.href = "index.html";
      }
    } catch (err) {
      console.error("Admin role check failed:", err);
      alert("Gagal memeriksa akses admin.");
    }
  } else {
    userEmailSpan.textContent = "";
  }
});

function loadAllRequests() {
  const q = query(collection(db, "requests"), orderBy("createdAt", "desc"));

  onSnapshot(q, (querySnapshot) => {
    const pcContainer = document.getElementById("list-PC");
    const nbContainer = document.getElementById("list-NB_MN_TAB");
    const swContainer = document.getElementById("list-Software");
    const otherContainer = document.getElementById("list-Lain-lain");

    pcContainer.innerHTML = "";
    nbContainer.innerHTML = "";
    swContainer.innerHTML = "";
    otherContainer.innerHTML = "";

    if (querySnapshot.empty) {
      return;
    }

    const allDocs = [];
    querySnapshot.forEach((docSnap) => {
      allDocs.push({
        docId: docSnap.id,
        data: docSnap.data(),
      });
    });

    // Sort by createdAt desc
    allDocs.sort((a, b) => {
      const ta = a.data.createdAt?.toMillis ? a.data.createdAt.toMillis() : 0;
      const tb = b.data.createdAt?.toMillis ? b.data.createdAt.toMillis() : 0;
      return tb - ta;
    });

    const pcItems = [];
    const nbItems = [];
    const swItems = [];
    const otherItems = [];
    const unknownItems = [];

    allDocs.forEach(({ docId, data }) => {
      if (data.category === "PC") {
        pcItems.push({ docId, data });
      } else if (data.category === "NB_MN_TAB") {
        nbItems.push({ docId, data });
      } else if (data.category === "Software") {
        swItems.push({ docId, data });
      } else if (data.category === "Lain-lain") {
        otherItems.push({ docId, data });
      } else {
        unknownItems.push({ docId, data });
      }
    });

    if (pcItems.length > 0) {
      pcContainer.appendChild(createCombinedCategorySection("PC", pcItems));
    }
    if (nbItems.length > 0) {
      nbContainer.appendChild(
        createCombinedCategorySection("NB_MN_TAB", nbItems)
      );
    }
    if (swItems.length > 0) {
      swContainer.appendChild(
        createCombinedCategorySection("Software", swItems)
      );
    }
    if (otherItems.length > 0) {
      otherContainer.appendChild(
        createCombinedCategorySection("Lain-lain", otherItems)
      );
    }
  });
}

function createCombinedCategorySection(category, items) {
  const div = document.createElement("div");
  div.className = "card";
  const categoryTitle = category === "NB_MN_TAB" ? "NB / MN / TAB" : category;
  div.innerHTML = `
    
    <div class="card-body">
      <table style="width:100%; border-collapse:collapse;">
        <thead>
          <tr>
            <th style="text-align:left; padding:8px; border-bottom:1px solid #eee;">User</th>
            <th style="text-align:left; padding:8px; border-bottom:1px solid #eee;">Job Title</th>
            <th style="text-align:left; padding:8px; border-bottom:1px solid #eee;">Department</th>
            <th style="text-align:left; padding:8px; border-bottom:1px solid #eee;">No Transmittal</th>
            <th style="text-align:left; padding:8px; border-bottom:1px solid #eee;">Done By IT</th>
            <th style="text-align:left; padding:8px; border-bottom:1px solid #eee;">Status</th>
            <th style="text-align:right; padding:8px; border-bottom:1px solid #eee;">Aksi</th>
          </tr>
        </thead>
        <tbody></tbody>
      </table>
    </div>
  `;

  const tbody = div.querySelector("tbody");
  items.forEach(({ docId, data }) => {
    const date =
      data.createdAt && data.createdAt.toDate
        ? data.createdAt.toDate().toLocaleDateString("id-ID")
        : "Baru saja";
    const statusClass =
      data.status === "Active" ? "status-active" : "status-closed";
    const nextStatus = data.status === "Active" ? "OER Close" : "Active";
    const btnClass = data.status === "Active" ? "btn-secondary" : "btn-success";
    const btnText = data.status === "Active" ? "Close OER" : "Re-Open";
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td data-label="User" style="padding:8px; border-bottom:1px solid #f2f2f2;">
        <div style="font-weight:600;">${data.userName || "No Name"}</div>
         <div style="font-size:0.85rem; color:#65676b;">${
           data.userEmail
         } • ${date}</div>
        ${
          category === "Software" && data.softwareList
            ? `<div style="font-size:0.85rem; color:#65676b;">Software: ${data.softwareList}</div>`
            : ""
        }
        ${
          category === "NB_MN_TAB" && data.subType
            ? `<div style="font-size:0.85rem; color:#65676b;">Tipe: ${data.subType}</div>`
            : ""
        }
        ${
          category === "Lain-lain" &&
          (data.otherItems || typeof data.qty !== "undefined")
            ? `<div style="font-size:0.85rem; color:#65676b;">Item: ${
                data.otherItems || "-"
              }${
                typeof data.qty !== "undefined" ? " • Qty: " + data.qty : ""
              }</div>`
            : ""
        }
       </td>
       <td data-label="Job Title" style="padding:8px; border-bottom:1px solid #f2f2f2;">${
         data.jobTitle || "-"
       }</td>
      <td data-label="Department" style="padding:8px; border-bottom:1px solid #f2f2f2;">${
        data.department || "-"
      }</td>
      <td data-label="No Transmittal" style="padding:8px; border-bottom:1px solid #f2f2f2;">${
        data.transmittalNo || "-"
      }</td>
      <td data-label="Done By IT" style="padding:8px; border-bottom:1px solid #f2f2f2;">${
        data.doneBy || "-"
      }</td>
      <td data-label="Status" style="padding:8px; border-bottom:1px solid #f2f2f2; vertical-align:middle;">
        <span class="status-badge ${statusClass}">${data.status}</span>
      </td>
      <td data-label="Aksi" style="padding:8px; border-bottom:1px solid #f2f2f2; text-align:right; vertical-align:middle;">
        <div style="display:inline-flex; align-items:center; justify-content:flex-end; gap:8px;">
          <button class="btn ${btnClass}" style="width:auto; height:36px; min-height:36px; padding:0 12px; font-size:0.7rem;" data-action="toggle" data-id="${docId}" data-next="${nextStatus}">${btnText}</button>
          <button class="btn" style="width:36px; height:36px; min-height:36px; padding:0; display:inline-flex; align-items:center; justify-content:center; background-color: var(--primary-color); color:#fff; border-radius:6px;" data-action="edit-transmittal" data-id="${docId}" data-current="${
      data.transmittalNo || ""
    }" data-current-doneby="${
      data.doneBy || ""
    }" aria-label="Edit Transmittal / Done By">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="white">
              <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 0 0 0-1.42L18.37 3.29a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.83z"/>
            </svg>
          </button>
          <button class="btn" style="width:36px; height:36px; min-height:36px; padding:0; display:inline-flex; align-items:center; justify-content:center; background-color: var(--danger-color); color:#fff; border-radius:6px;" data-action="delete" data-id="${docId}" aria-label="Delete">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="white">
              <rect x="7" y="9" width="10" height="11" rx="2"></rect>
              <rect x="8" y="5" width="8" height="3" rx="1"></rect>
              <rect x="10" y="3" width="4" height="2" rx="1"></rect>
            </svg>
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });

  const toggleButtons = div.querySelectorAll(
    'button[data-action="toggle"][data-id]'
  );
  toggleButtons.forEach((btn) => {
    btn.addEventListener("click", async () => {
      const newStatus = btn.getAttribute("data-next");
      const id = btn.getAttribute("data-id");
      try {
        await updateDoc(doc(db, "requests", id), { status: newStatus });
      } catch (error) {
        alert("Gagal update status: " + error.message);
      }
    });
  });

  const deleteButtons = div.querySelectorAll(
    'button[data-action="delete"][data-id]'
  );
  deleteButtons.forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-id");
      const doDelete = async () => {
        try {
          const { deleteDoc } = await import("./firebase.js");
          await deleteDoc(doc(db, "requests", id));
          showToast("Berhasil menghapus request", "success");
        } catch (error) {
          alert("Gagal menghapus: " + error.message);
        }
      };
      if (typeof Swal !== "undefined") {
        Swal.fire({
          title: "Hapus Request?",
          text: "Tindakan ini tidak dapat dibatalkan.",
          icon: "warning",
          showCancelButton: true,
          confirmButtonColor: "#d33",
          cancelButtonColor: "#3085d6",
          confirmButtonText: "Ya, Hapus",
          cancelButtonText: "Batal",
        }).then((result) => {
          if (result.isConfirmed) {
            doDelete();
          }
        });
      } else {
        if (confirm("Anda yakin ingin menghapus request ini?")) {
          doDelete();
        }
      }
    });
  });
  const editButtons = div.querySelectorAll(
    'button[data-action="edit-transmittal"][data-id]'
  );
  editButtons.forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-id");
      const current = btn.getAttribute("data-current") || "";
      const currentDoneBy = btn.getAttribute("data-current-doneby") || "";
      const saveValue = async (value) => {
        try {
          const transmittalNo = (value?.transmittalNo || "").trim();
          const doneBy = (value?.doneBy || "").trim();
          await updateDoc(doc(db, "requests", id), {
            transmittalNo,
            doneBy,
          });
          showToast("No Transmittal & Done By diperbarui", "success");
        } catch (error) {
          alert("Gagal menyimpan perubahan: " + error.message);
        }
      };
      if (typeof Swal !== "undefined") {
        const optionsHtml = [
          `<option value="" ${
            currentDoneBy ? "" : "selected"
          }>Pilih IT Member...</option>`,
          ...IT_MEMBERS.map(
            (name) =>
              `<option value="${name}" ${
                name === currentDoneBy ? "selected" : ""
              }>${name}</option>`
          ),
        ].join("");

        const result = await Swal.fire({
          title: "Add No Transmittal & IT Member",
          html: `
            <input id="swal-transmittal" class="swal2-input" style="width: calc(100% - 2em); margin: 1em 1em 0; box-sizing: border-box;" placeholder="No Transmittal" value="${escapeHtml(
              current
            )}">
            <select id="swal-doneby" class="swal2-select" style="width: calc(100% - 2em); margin: 1em 1em 0; box-sizing: border-box;">
              ${optionsHtml}
            </select>
          `,
          focusConfirm: false,
          showCancelButton: true,
          confirmButtonText: "Simpan",
          cancelButtonText: "Batal",
          preConfirm: () => {
            const transmittalNo =
              document.getElementById("swal-transmittal")?.value || "";
            const doneBy = document.getElementById("swal-doneby")?.value || "";
            if (!doneBy) {
              Swal.showValidationMessage("Pilih IT Member");
              return;
            }
            return { transmittalNo, doneBy };
          },
        });
        if (result.isConfirmed) {
          await saveValue(result.value);
        }
      } else {
        const transmittalNo = prompt("Masukkan No Transmittal:", current);
        if (transmittalNo === null) return;
        const doneBy = prompt(
          `Done By (pilih salah satu):\n- ${IT_MEMBERS.join("\n- ")}`,
          currentDoneBy
        );
        if (doneBy === null) return;
        if (!IT_MEMBERS.includes(doneBy)) {
          alert("Done By harus pilih salah satu IT Member.");
          return;
        }
        await saveValue({ transmittalNo, doneBy });
      }
    });
  });
  return div;
}

// Export Functionality
function exportToImage(elementId, filename) {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id ${elementId} not found`);
    return;
  }

  if (typeof html2canvas === "undefined") {
    alert("Library html2canvas belum dimuat. Silakan refresh halaman.");
    return;
  }

  html2canvas(element, {
    ignoreElements: (node) => {
      // Ignore export buttons in the screenshot
      return (
        node.tagName === "BUTTON" &&
        (node.textContent.includes("Export") ||
          node.classList.contains("export-btn"))
      );
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

// Make it global for onclick handlers
window.exportToImage = exportToImage;

// Since it's a module, DOMContentLoaded might have already fired or behaves differently.
// We can also just run the check immediately.
const exportAllBtn = document.getElementById("export-all-btn");
if (exportAllBtn) {
  exportAllBtn.addEventListener("click", () => {
    exportToImage("all-requests-container", "All_Requests_Admin");
  });
}

const exportBtns = document.querySelectorAll(".export-btn");
exportBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const targetId = btn.getAttribute("data-target");
    const filename = btn.getAttribute("data-filename");
    if (targetId && filename) {
      exportToImage(targetId, filename);
    }
  });
});
