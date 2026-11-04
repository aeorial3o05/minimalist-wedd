import { db } from "./firebase-config.js";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const modal = document.getElementById("modal");
const rsvpForm = document.getElementById("rsvpForm");
const wishesEl = document.getElementById("wishes");
const namaInput = rsvpForm
  ? rsvpForm.querySelector('input[name="nama"]')
  : null;

function autoFillNama() {
  if (guestNameValue && namaInput) {
    namaInput.value = guestNameValue;
  }
}
autoFillNama();

const btnRsvp = document.getElementById("btnRsvp");
if (btnRsvp && modal) {
  btnRsvp.addEventListener("click", () => {
    autoFillNama();
    modal.classList.add("show");
  });
}
const modalClose = document.getElementById("modalClose");
if (modalClose && modal) {
  modalClose.addEventListener("click", () => modal.classList.remove("show"));
}
if (modal) {
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.classList.remove("show");
  });
}

if (wishesEl) {
  const escapeHTML = (str) => {
    const d = document.createElement("div");
    d.textContent = str;
    return d.innerHTML;
  };
  const COLLECTION_NAME = "ucapan-sari-andre";
  const colRef = collection(db, COLLECTION_NAME);

  // Render realtime
  const q = query(colRef, orderBy("createdAt", "desc"));
  onSnapshot(q, (snap) => {
    const list = snap.docs.map((doc) => doc.data());
    if (list.length === 0) {
      wishesEl.innerHTML =
        '<p style="text-align:center;opacity:.6">Belum ada ucapan</p>';
      return;
    }
    wishesEl.innerHTML = list
      .map(
        (w) =>
          `<div class="wish"><b>${escapeHTML(w.nama || "")}</b> <span style="font-size:11px;background:#eee;padding:2px 6px;border-radius:8px">${escapeHTML(w.status || "")}</span><p>${escapeHTML(w.pesan || "")}</p></div>`,
      )
      .join("");
  });

  // Submit
  if (rsvpForm) {
    rsvpForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const btn = e.target.querySelector('button[type="submit"]');
      const txt = btn.textContent;
      btn.textContent = "Mengirim...";
      btn.disabled = true;
      try {
        await addDoc(colRef, {
          nama: fd.get("nama").trim(),
          status: fd.get("status"),
          pesan: fd.get("pesan").trim(),
          createdAt: serverTimestamp(),
        });
        e.target.reset();
        autoFillNama();
        modal.classList.remove("show");
        toast("Terima kasih atas ucapan & konfirmasinya");
      } catch (err) {
        alert(
          "Gagal kirim: " +
            err.message +
            "\nCek Rules Firestore & config firebase-config.js",
        );
        console.error(err);
      } finally {
        btn.textContent = txt;
        btn.disabled = false;
      }
    });
  }
}
