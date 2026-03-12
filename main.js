import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics.js";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAXLOY5jFFC4_8IhLvSGX7ldnJs_DWP98U",
  authDomain: "hopetree-79e2f.firebaseapp.com",
  projectId: "hopetree-79e2f",
  storageBucket: "hopetree-79e2f.firebasestorage.app",
  messagingSenderId: "462749351611",
  appId: "1:462749351611:web:cef13ad3eb3e77e98d739e",
  measurementId: "G-VMLYFEG97J"
};

initializeApp(firebaseConfig);
getAnalytics();
const db = getFirestore();

const form = document.getElementById("message-form");
const btn = form.querySelector("button");
const catLayer = document.getElementById("cat-layer");
const statusLine = document.getElementById("status-line");
const scene = document.getElementById("scene");

const RATE_LIMIT_SECONDS = 15;
const LAST_SUBMIT_KEY = "hopetree_last_submit_at";
const MAX_RENDER_CATS = window.innerWidth < 700 ? 8 : 12;
const FALLBACK_CAT_ASSET = "./assets/cats/sheet.png";
const CUSTOM_BG_CANDIDATES = [
  "./assets/custom/bg/yard.jpg",
  "./assets/custom/bg/yard.png",
  "./assets/custom/bg/yard.webp",
  "./assets/bg/yard.webp"
];
const CAT_ASSET_CANDIDATES = [
  "./assets/custom/cats/cat01.gif",
  "./assets/custom/cats/cat01.png",
  "./assets/custom/cats/cat01.webp",
  "./assets/custom/cats/cat02.gif",
  "./assets/custom/cats/cat02.png",
  "./assets/custom/cats/cat02.webp",
  "./assets/custom/cats/cat03.gif",
  "./assets/custom/cats/cat03.png",
  "./assets/custom/cats/cat03.webp",
  "./assets/custom/cats/cat04.gif",
  "./assets/custom/cats/cat04.png",
  "./assets/custom/cats/cat04.webp",
  FALLBACK_CAT_ASSET
];
const SCENE_SLOTS = [
  { x: 15, y: 59, w: 15, h: 24, zone: "stove-mat" },
  { x: 30, y: 49, w: 18, h: 28, zone: "bench-top" },
  { x: 41, y: 72, w: 18, h: 24, zone: "pink-cushion" },
  { x: 55, y: 60, w: 18, h: 28, zone: "table" },
  { x: 73, y: 53, w: 18, h: 24, zone: "bed" },
  { x: 78, y: 74, w: 18, h: 24, zone: "green-rug" },
  { x: 60, y: 87, w: 18, h: 24, zone: "food-bowl" },
  { x: 84, y: 90, w: 22, h: 26, zone: "stone-pad" },
  { x: 50, y: 85, w: 20, h: 26, zone: "ramp-bottom" },
  { x: 37, y: 84, w: 19, h: 24, zone: "step-corner" },
  { x: 66, y: 42, w: 14, h: 20, zone: "window-edge" },
  { x: 23, y: 35, w: 16, h: 22, zone: "tv-top" }
];

let availableCatAssets = [FALLBACK_CAT_ASSET];
let latestDocs = [];

async function fileExists(url) {
  try {
    const res = await fetch(url, { method: "HEAD", cache: "no-store" });
    return res.ok;
  } catch {
    return false;
  }
}

async function applyBackground() {
  for (const candidate of CUSTOM_BG_CANDIDATES) {
    if (await fileExists(candidate)) {
      scene.style.backgroundImage = `url('${candidate}')`;
      if (candidate.startsWith("./assets/custom/bg/")) {
        scene.classList.add("has-custom-bg");
      }
      return;
    }
  }
}

async function loadAvailableCatAssets() {
  const found = [];
  for (const candidate of CAT_ASSET_CANDIDATES) {
    if (await fileExists(candidate)) {
      found.push(candidate);
    }
  }

  availableCatAssets = found.length ? found : [FALLBACK_CAT_ASSET];
}

function showToast(message) {
  const existing = document.querySelector(".toast");
  if (existing) {
    existing.remove();
  }

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2600);
}

function formatDate(value) {
  if (!value) {
    return "";
  }

  if (typeof value.toDate === "function") {
    return value.toDate().toLocaleDateString("ko-KR", {
      month: "short",
      day: "numeric"
    });
  }

  return "";
}

function showMessages(catData) {
  const existing = document.querySelector(".message-modal");
  if (existing) {
    existing.remove();
  }

  const modal = document.createElement("div");
  modal.className = "message-modal";

  const messages = catData.messages.length ? catData.messages : [{ message: "아직 메시지가 없어.", timestamp: null }];
  let index = messages.length - 1;

  modal.innerHTML = `
    <div class="modal-content">
      <p class="modal-name"></p>
      <p class="modal-meta"></p>
      <p class="modal-message"></p>
      <div class="modal-actions">
        <button type="button" class="modal-nav prev">이전</button>
        <span class="modal-count"></span>
        <button type="button" class="modal-nav next">다음</button>
      </div>
      <button type="button" class="modal-close">닫기</button>
    </div>
  `;

  modal.querySelector(".modal-name").textContent = catData.name;
  const meta = modal.querySelector(".modal-meta");
  const message = modal.querySelector(".modal-message");
  const count = modal.querySelector(".modal-count");
  const prev = modal.querySelector(".modal-nav.prev");
  const next = modal.querySelector(".modal-nav.next");

  function renderMessage() {
    const current = messages[index];
    message.textContent = current.message || "메시지가 비어 있어.";
    const postedAt = formatDate(current.timestamp);
    meta.textContent = postedAt ? `${postedAt}에 남긴 응원` : `${messages.length}개의 메시지`;
    count.textContent = `${index + 1} / ${messages.length}`;
    prev.disabled = messages.length < 2;
    next.disabled = messages.length < 2;
  }

  prev.onclick = () => {
    index = (index - 1 + messages.length) % messages.length;
    renderMessage();
  };

  next.onclick = () => {
    index = (index + 1) % messages.length;
    renderMessage();
  };

  modal.querySelector(".modal-close").onclick = () => modal.remove();
  modal.onclick = (event) => {
    if (event.target === modal) {
      modal.remove();
    }
  };

  renderMessage();
  document.body.appendChild(modal);
}

function hashString(value) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = ((hash << 5) - hash + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function daySeed() {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
}

function seededPick(items, limit) {
  const seed = hashString(daySeed());
  return items
    .map((item, index) => ({
      item,
      key: (hashString(item.name + seed) + index * 17) % 100000
    }))
    .sort((a, b) => a.key - b.key)
    .slice(0, Math.min(limit, items.length))
    .map((entry) => entry.item);
}

function catBehavior(seed) {
  const list = ["idle", "tail", "float", "sleep"];
  return list[seed % list.length];
}

function groupCommentsByName(docs) {
  const grouped = new Map();

  docs.forEach((doc) => {
    const data = doc.data();
    const rawName = typeof data.name === "string" ? data.name.trim() : "";
    const name = rawName || "익명";
    const key = name.toLowerCase();

    if (!grouped.has(key)) {
      grouped.set(key, {
        id: key,
        name,
        messages: []
      });
    }

    grouped.get(key).messages.push({
      id: doc.id,
      message: typeof data.message === "string" ? data.message.trim() : "",
      timestamp: data.timestamp || null
    });
  });

  return Array.from(grouped.values()).map((cat) => ({
    ...cat,
    messages: cat.messages.sort((a, b) => {
      const left = typeof a.timestamp?.toMillis === "function" ? a.timestamp.toMillis() : 0;
      const right = typeof b.timestamp?.toMillis === "function" ? b.timestamp.toMillis() : 0;
      return left - right;
    })
  }));
}

function getSlot(index) {
  return SCENE_SLOTS[index % SCENE_SLOTS.length];
}

function getCatAsset(seed) {
  return availableCatAssets[seed % availableCatAssets.length];
}

function renderCats(docs) {
  catLayer.innerHTML = "";

  const groupedCats = seededPick(groupCommentsByName(docs), MAX_RENDER_CATS);

  groupedCats.forEach((catData, index) => {
    const seed = hashString(catData.id);
    const slot = getSlot(index);
    const behavior = catBehavior(seed);
    const asset = getCatAsset(seed);
    const renderW = 92 + (seed % 18);
    const renderH = 88 + (seed % 26);
    const angle = (seed % 7) - 3;

    const cat = document.createElement("button");
    cat.type = "button";
    cat.className = `cat ${behavior}`;
    cat.style.left = `${slot.x}%`;
    cat.style.top = `${slot.y}%`;
    cat.style.zIndex = `${Math.round(slot.y * 10)}`;
    cat.style.setProperty("--cat-w", `${renderW}px`);
    cat.style.setProperty("--cat-h", `${renderH}px`);
    cat.style.setProperty("--cat-tilt", `${angle}deg`);
    cat.title = `${catData.name} (${catData.messages.length})`;
    const sprite = document.createElement("img");
    sprite.className = "sprite-img";
    sprite.src = asset;
    sprite.alt = catData.name;
    sprite.loading = "lazy";
    sprite.onerror = function onSpriteError() {
      this.style.opacity = "0.25";
    };

    const collar = document.createElement("div");
    collar.className = "collar";
    collar.textContent = catData.name.slice(0, 8);

    cat.appendChild(sprite);
    cat.appendChild(collar);
    cat.onclick = () => showMessages(catData);
    catLayer.appendChild(cat);
  });

  if (!groupedCats.length) {
    statusLine.textContent = "아직 정원에 나온 고양이가 없어. 첫 댓글을 남겨줘.";
    return;
  }

  statusLine.textContent = `오늘은 ${groupedCats.length}마리의 이름 고양이가 정원에 나와 있어.`;
}

function containsBlockedPattern(text) {
  const lowered = text.toLowerCase();
  return lowered.includes("http://") || lowered.includes("https://") || lowered.includes("www.");
}

function getRemainingCooldownSeconds() {
  const last = Number(localStorage.getItem(LAST_SUBMIT_KEY) || 0);
  if (!last) {
    return 0;
  }

  const elapsed = (Date.now() - last) / 1000;
  return Math.max(0, Math.ceil(RATE_LIMIT_SECONDS - elapsed));
}

Promise.all([applyBackground(), loadAvailableCatAssets()])
  .then(() => {
    if (latestDocs.length) {
      renderCats(latestDocs);
    }
  })
  .catch((error) => {
    console.error(error);
  });

const commentsQuery = query(collection(db, "comments"), orderBy("timestamp", "asc"));
onSnapshot(
  commentsQuery,
  (snapshot) => {
    latestDocs = snapshot.docs;
    renderCats(latestDocs);
  },
  (error) => {
    console.error(error);
    statusLine.textContent = "연결이 잠시 불안정해. 잠깐 후 다시 봐줘.";
    showToast("서버 연결이 불안정해. 잠시 후 다시 시도해줘.");
  }
);

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const nameInput = document.getElementById("username");
  const messageInput = document.getElementById("usermessage");
  const name = (nameInput.value || "").trim();
  const message = (messageInput.value || "").trim();

  if (!name || !message) {
    showToast("이름과 응원 메시지를 모두 적어줘.");
    return;
  }

  if (name.length > 10 || message.length > 50) {
    showToast("글자 수 제한을 확인해줘.");
    return;
  }

  if (containsBlockedPattern(name) || containsBlockedPattern(message)) {
    showToast("링크는 입력할 수 없어.");
    return;
  }

  const cooldownLeft = getRemainingCooldownSeconds();
  if (cooldownLeft > 0) {
    showToast(`${cooldownLeft}초 뒤에 다시 남겨줘.`);
    return;
  }

  btn.disabled = true;
  btn.textContent = "남기는 중...";
  statusLine.textContent = "응원을 고양이 목걸이에 달고 있어…";

  try {
    await addDoc(collection(db, "comments"), {
      name,
      message,
      timestamp: serverTimestamp()
    });
    localStorage.setItem(LAST_SUBMIT_KEY, String(Date.now()));
    form.reset();
    showToast("응원이 잘 전달됐어.");
  } catch (error) {
    console.error(error);
    showToast("오류가 생겼어. 잠시 후 다시 시도해줘.");
  } finally {
    btn.disabled = false;
    btn.textContent = "메시지 남기기";
  }
});
