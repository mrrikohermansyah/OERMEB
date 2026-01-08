import { auth, db, addDoc, collection } from "./firebase.js";
import { showToast } from "./toast.js";

const toggleBtn = document.getElementById("toggle-form-btn");
const cancelBtn = document.getElementById("cancel-form-btn");
const formContainer = document.getElementById("oer-form-container");
const form = document.getElementById("oer-form");
const categorySelect = document.getElementById("category");

function getDeptId(cat) {
  const map = {
    PC: "pc-department",
    NB_MN_TAB: "nb-department",
    Software: "sw-department",
    "Lain-lain": "other-department",
  };
  const cid = map[cat];
  if (cid && document.getElementById(cid)) return cid;
  return "department";
}

function clearRequired() {
  const ids = [
    "pc-user-name",
    "pc-job-title",
    "pc-project",
    "nb-type",
    "nb-user-name",
    "nb-job-title",
    "sw-user-name",
    "sw-job-title",
    "other-qty",
    "other-needs",
    "other-user-name",
    "other-job-title",
    "pc-department",
    "nb-department",
    "sw-department",
    "other-department",
    "department",
  ];
  ids.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.required = false;
  });
}

function applyRequired(cat) {
  clearRequired();
  const deptId = getDeptId(cat);
  const deptEl = document.getElementById(deptId);
  if (deptEl) deptEl.required = true;
  if (cat === "PC") {
    ["pc-user-name", "pc-job-title", "pc-project"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.required = true;
    });
  } else if (cat === "NB_MN_TAB") {
    ["nb-type", "nb-user-name", "nb-job-title"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.required = true;
    });
  } else if (cat === "Software") {
    ["sw-user-name", "sw-job-title"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.required = true;
    });
  } else if (cat === "Lain-lain") {
    ["other-qty", "other-needs", "other-user-name", "other-job-title"].forEach(
      (id) => {
        const el = document.getElementById(id);
        if (el) el.required = true;
      }
    );
  }
}

// Toggle Form
if (toggleBtn) {
  toggleBtn.addEventListener("click", () => {
    formContainer.classList.remove("hidden");
    toggleBtn.classList.add("hidden");
  });
}

if (cancelBtn) {
  cancelBtn.addEventListener("click", () => {
    formContainer.classList.add("hidden");
    toggleBtn.classList.remove("hidden");
    form.reset();
    hideAllDynamicFields();
  });
}

// Handle Category Change
if (categorySelect) {
  categorySelect.addEventListener("change", (e) => {
    const category = e.target.value;
    hideAllDynamicFields();
    if (category) {
      // Replace spaces/slashes for ID selector if needed, but values are simple
      // Values: PC, NB_MN_TAB, Software, Lain-lain
      const targetId = `fields-${category}`;
      const target = document.getElementById(targetId);
      if (target) {
        target.classList.remove("hidden");
      }
      applyRequired(category);
    }
  });
}

function hideAllDynamicFields() {
  const fields = document.querySelectorAll(".dynamic-fields");
  fields.forEach((f) => f.classList.add("hidden"));
}

// Handle Submit
if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn.disabled) return;

    if (!auth.currentUser) {
      showToast("Anda harus login terlebih dahulu.", "error");
      return;
    }

    const category = categorySelect.value;
    if (!category) {
      showToast("Pilih kategori terlebih dahulu.", "error");
      return;
    }

    // Prevent double submit
    submitBtn.disabled = true;
    const originalBtnText = submitBtn.textContent;
    submitBtn.textContent = "Mengirim...";

    try {
      const departmentGlobal = document.getElementById("department");
      let departmentVal = "";
      if (category === "PC") {
        departmentVal = document.getElementById("pc-department")?.value || "";
      } else if (category === "NB_MN_TAB") {
        departmentVal = document.getElementById("nb-department")?.value || "";
      } else if (category === "Software") {
        departmentVal = document.getElementById("sw-department")?.value || "";
      } else if (category === "Lain-lain") {
        departmentVal =
          document.getElementById("other-department")?.value || "";
      }
      if (!departmentVal && departmentGlobal) {
        departmentVal = departmentGlobal.value || "";
      }
      applyRequired(category);
      const baseData = {
        category: category,
        status: "Active",
        createdAt: new Date(),
        userId: auth.currentUser.uid,
        userEmail: auth.currentUser.email,
        department: departmentVal,
      };

      let specificData = {};

      if (category === "PC") {
        specificData = {
          userName: document.getElementById("pc-user-name").value,
          jobTitle: document.getElementById("pc-job-title").value,
          project: document.getElementById("pc-project").value,
        };
      } else if (category === "NB_MN_TAB") {
        specificData = {
          subType: document.getElementById("nb-type").value,
          userName: document.getElementById("nb-user-name").value,
          jobTitle: document.getElementById("nb-job-title").value,
        };
      } else if (category === "Software") {
        const checkboxes = document.querySelectorAll(
          'input[name="software"]:checked'
        );
        let selectedSoftware = Array.from(checkboxes).map((cb) => cb.value);
        const customInputs = document.querySelectorAll(
          "#fields-Software .software-custom-input"
        );
        customInputs.forEach((input) => {
          const val = input.value.trim();
          if (val) selectedSoftware.push(val);
        });

        specificData = {
          softwareList: selectedSoftware.join(", "),
          userName: document.getElementById("sw-user-name").value,
          jobTitle: document.getElementById("sw-job-title").value,
        };
      } else if (category === "Lain-lain") {
        const otherChecks = document.querySelectorAll(
          '#fields-Lain-lain input[name="otherItem"]:checked'
        );
        const selectedItems = Array.from(otherChecks).map((cb) => cb.value);
        const qtyRaw = document.getElementById("other-qty").value;
        const qty = qtyRaw ? parseInt(qtyRaw, 10) : 0;
        specificData = {
          otherItems: selectedItems.join(", "),
          qty: isNaN(qty) ? 0 : qty,
          details: document.getElementById("other-needs").value,
          userName: document.getElementById("other-user-name").value,
          jobTitle: document.getElementById("other-job-title").value,
        };
      }

      const finalData = { ...baseData, ...specificData };

      await addDoc(collection(db, "requests"), finalData);
      showToast("Request berhasil dikirim!", "success");
      form.reset();
      hideAllDynamicFields();
      formContainer.classList.add("hidden");
      toggleBtn.classList.remove("hidden");
    } catch (error) {
      console.error("Error adding document: ", error);
      showToast("Gagal mengirim request: " + error.message, "error");
    } finally {
      // Re-enable button
      submitBtn.disabled = false;
      submitBtn.textContent = originalBtnText;
    }
  });
}

// Auto-capitalization for name fields
function enableAutoCapitalize(elementId) {
  const el = document.getElementById(elementId);
  if (el) {
    el.addEventListener("input", (e) => {
      const val = e.target.value;
      // Replace lower case letters at start of word with upper case
      e.target.value = val.replace(/(?:^|\s)\S/g, function (a) {
        return a.toUpperCase();
      });
    });
  }
}

// Apply to all user name fields
["pc-user-name", "nb-user-name", "sw-user-name", "other-user-name"].forEach(
  enableAutoCapitalize
);

const customContainer = document.getElementById("software-custom-container");
function createCustomInput(index) {
  const input = document.createElement("input");
  input.type = "text";
  input.id = "software-custom-" + index;
  input.className = "form-control software-custom-input";
  input.placeholder = "Input manual nama software (jika tidak ada di list)";
  return input;
}
function ensureCustomInputBehavior() {
  if (!customContainer) return;
  const maxInputs = 10;
  const inputs = customContainer.querySelectorAll(".software-custom-input");
  const last = inputs[inputs.length - 1];
  function onInput(e) {
    const currentInputs = customContainer.querySelectorAll(
      ".software-custom-input"
    );
    const lastCurrent = currentInputs[currentInputs.length - 1];
    if (
      lastCurrent === e.target &&
      e.target.value.trim() !== "" &&
      currentInputs.length < maxInputs
    ) {
      const next = createCustomInput(currentInputs.length);
      next.addEventListener("input", onInput);
      customContainer.appendChild(next);
    }
  }
  inputs.forEach((inp) => inp.addEventListener("input", onInput));
}
ensureCustomInputBehavior();
