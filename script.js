// paksa balik ke atas pas reload
window.scrollTo(0, 0);

// menampilkan nama undangan di browser dan cover
const guest = new URLSearchParams(location.search).get("to");
document.getElementById("guestName").textContent = guest
  ? decodeURIComponent(guest.replace(/\+/g, " "))
  : "Nama Tamu";

// musik latar
const bgm = document.getElementById("bgm");
const musicBtn = document.getElementById("music-btn");
const icon = musicBtn.querySelector("i");
let playing = false;
// --- Konfigurasi Dasar ---
bgm.volume = 0.2;
bgm.loop = true;
function setPlayingState(isPlaying) {
  playing = isPlaying;
  musicBtn.classList.toggle("playing", isPlaying);
  musicBtn.classList.toggle("paused", !isPlaying);
  // GANTI ICON BOOTSTRAP
  if (isPlaying) {
    icon.className = "bi bi-pause-fill"; // saat play, tampilkan icon PAUSE
    musicBtn.setAttribute("title", "Pause Musik");
  } else {
    icon.className = "bi bi-play-fill"; // saat pause, tampilkan icon PLAY
    musicBtn.setAttribute("title", "Play Musik");
  }
}
musicBtn.addEventListener("click", () => {
  if (playing) {
    bgm.pause();
    setPlayingState(false);
  } else {
    bgm
      .play()
      .then(() => {
        setPlayingState(true);
      })
      .catch((e) => {
        console.log("Autoplay diblokir browser:", e);
      });
  }
});
// Saat buka undangan
document.getElementById("btnOpen").addEventListener("click", () => {
  document.getElementById("cover").classList.add("hide");
  document.body.classList.remove("locked");
  musicBtn.classList.add("show");
  // Auto play dengan volume 0.2
  bgm.volume = 0.2;
  bgm
    .play()
    .then(() => {
      setPlayingState(true);
    })
    .catch(() => {
      setPlayingState(false); // jika gagal, tetap show tombol play
    });
  setTimeout(
    () => (document.getElementById("cover").style.display = "none"),
    700,
  );
});
// Jika musik selesai (jaga-jaga kalau loop mati)
bgm.addEventListener("ended", () => setPlayingState(false));
bgm.addEventListener("pause", () => {
  if (!bgm.loop) setPlayingState(false);
});

/* Countdown */
const target = new Date("2027-01-02T18:00:00+08:00").getTime();
function tick() {
  const gap = target - Date.now();
  if (gap <= 0) {
    ["d", "h", "m", "s"].forEach(
      (id) => (document.getElementById(id).textContent = "00"),
    );
    return;
  }
  document.getElementById("d").textContent = String(
    Math.floor(gap / 86400000),
  ).padStart(2, "0");
  document.getElementById("h").textContent = String(
    Math.floor((gap % 86400000) / 3600000),
  ).padStart(2, "0");
  document.getElementById("m").textContent = String(
    Math.floor((gap % 3600000) / 60000),
  ).padStart(2, "0");
  document.getElementById("s").textContent = String(
    Math.floor((gap % 60000) / 1000),
  ).padStart(2, "0");
}
tick();
setInterval(tick, 1000);

/* Toast */
let toastT;
function toast(msg) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toastT);
  toastT = setTimeout(() => el.classList.remove("show"), 2200);
}
function copyText(text) {
  navigator.clipboard
    .writeText(text)
    .then(() => toast("Berhasil disalin"))
    .catch(() => toast("Gagal menyalin"));
}

// app-final.js - GABUNGAN SEMUA FITUR KAMU
import { db } from "./firebase-config.js";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// === 3. RSVP FIREBASE ucapan-sari-andre ===
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

/* Lightbox */
const lb = document.getElementById("lightbox");
document.querySelectorAll(".grid img").forEach((img) => {
  img.addEventListener("click", () => {
    lb.querySelector("img").src = img.src;
    lb.classList.add("show");
  });
});
const closeLb = () => lb.classList.remove("show");
document.getElementById("lbClose").onclick = closeLb;
lb.addEventListener("click", (e) => {
  if (e.target === lb) closeLb();
});
