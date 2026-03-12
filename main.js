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
import { createStickerRenderer } from "./stickerRenderer.js";

const firebaseConfig = {
  apiKey: "AIzaSyAXLOY5jFFC4_8IhLvSGX7ldnJs_DWP98U",
  authDomain: "hopetree-79e2f.firebaseapp.com",
  projectId: "hopetree-79e2f",
  storageBucket: "hopetree-79e2f.firebasestorage.app",
  messagingSenderId: "462749351611",
  appId: "1:462749351611:web:cef13ad3eb3e77e98d739e",
  measurementId: "G-VMLYFEG97J"
};

const RATE_LIMIT_SECONDS = 20;
const LAST_SUBMIT_KEY = "hopetree_last_submit_at";
const BLOCKED_WORDS = ["sex", "porn", "도박", "먹튀", "바카라", "casino", "시발", "병신", "fuck"];

initializeApp(firebaseConfig);
getAnalytics();
const db = getFirestore();

const form = document.getElementById("message-form");
const btn = form.querySelector("button");
const statusLine = document.getElementById("status-line");
const commentCount = document.getElementById("comment-count");

const stickerRenderer = createStickerRenderer({
  container: document.getElementById("sticker-layer"),
  onSelect: showMessageCard
});

let latestComments = [];

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
    return value.toDate().toLocaleString("ko-KR", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  return "";
}

function showMessageCard(comment) {
  const existing = document.querySelector(".message-modal");
  if (existing) {
    existing.remove();
  }

  const modal = document.createElement("div");
  modal.className = "message-modal";
  modal.innerHTML = `
    <div class="modal-content">
      <p class="modal-name"></p>
      <p class="modal-meta"></p>
      <p class="modal-message"></p>
      <button type="button" class="modal-close">닫기</button>
    </div>
  `;

  modal.querySelector(".modal-name").textContent = comment.name || "익명";
  modal.querySelector(".modal-meta").textContent = formatDate(comment.timestamp) || "방금 도착한 응원";
  modal.querySelector(".modal-message").textContent = comment.message || "메시지가 비어 있어.";
  modal.querySelector(".modal-close").onclick = () => modal.remove();
  modal.onclick = (event) => {
    if (event.target === modal) {
      modal.remove();
    }
  };

  document.body.appendChild(modal);
}

function hashString(value) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) - hash + value.charCodeAt(index)) | 0;
  }
  return Math.abs(hash);
}

function containsBlockedPattern(text) {
  const lowered = text.toLowerCase();
  return lowered.includes("http://") || lowered.includes("https://") || lowered.includes("www.");
}

function containsBlockedWord(text) {
  const lowered = text.toLowerCase();
  return BLOCKED_WORDS.some((word) => lowered.includes(word));
}

function getRemainingCooldownSeconds() {
  const last = Number(localStorage.getItem(LAST_SUBMIT_KEY) || 0);
  if (!last) {
    return 0;
  }

  const elapsed = (Date.now() - last) / 1000;
  return Math.max(0, Math.ceil(RATE_LIMIT_SECONDS - elapsed));
}

function normalizeComment(doc) {
  const data = doc.data();
  return {
    id: doc.id,
    name: typeof data.name === "string" && data.name.trim() ? data.name.trim() : "익명",
    message: typeof data.message === "string" ? data.message.trim() : "",
    timestamp: data.timestamp || null,
    seed: hashString(doc.id + (data.name || "anon"))
  };
}

function updateWall(comments) {
  latestComments = comments;
  commentCount.textContent = String(comments.length);
  statusLine.textContent = comments.length
    ? `지금 ${comments.length}개의 응원이 벽을 채우고 있어.`
    : "첫 번째 응원 스티커를 붙여줘.";
  stickerRenderer.render(comments);
}

const commentsQuery = query(collection(db, "comments"), orderBy("timestamp", "desc"));
onSnapshot(
  commentsQuery,
  (snapshot) => {
    updateWall(snapshot.docs.map(normalizeComment));
  },
  (error) => {
    console.error(error);
    statusLine.textContent = "연결이 잠시 흔들렸어. 응원을 다시 불러오는 중…";
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

  if (name.length > 10 || message.length > 90) {
    showToast("글자 수 제한을 확인해줘.");
    return;
  }

  if (containsBlockedPattern(name) || containsBlockedPattern(message)) {
    showToast("링크는 입력할 수 없어.");
    return;
  }

  if (containsBlockedWord(name) || containsBlockedWord(message)) {
    showToast("다른 표현으로 적어줘.");
    return;
  }

  const cooldownLeft = getRemainingCooldownSeconds();
  if (cooldownLeft > 0) {
    showToast(`${cooldownLeft}초 뒤에 다시 붙여줘.`);
    return;
  }

  btn.disabled = true;
  btn.textContent = "붙이는 중...";
  statusLine.textContent = "새 응원 스티커를 벽에 붙이는 중…";

  try {
    await addDoc(collection(db, "comments"), {
      name,
      message,
      timestamp: serverTimestamp()
    });
    localStorage.setItem(LAST_SUBMIT_KEY, String(Date.now()));
    form.reset();
    showToast("응원 스티커를 붙였어.");
  } catch (error) {
    console.error(error);
    showToast("오류가 생겼어. 잠시 후 다시 시도해줘.");
  } finally {
    btn.disabled = false;
    btn.textContent = "스티커 붙이기";
  }
});
