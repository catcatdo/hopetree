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

const form = document.getElementById('message-form');
const btn = form.querySelector('button');
const catLayer = document.getElementById('cat-layer');
const statusLine = document.getElementById('status-line');

const RATE_LIMIT_SECONDS = 15;
const LAST_SUBMIT_KEY = 'hopetree_last_submit_at';
const MAX_RENDER_CATS = window.innerWidth < 700 ? 8 : 12;

const CAT_SPRITES = [
  { x: 20, y: 25, w: 170, h: 135 },
  { x: 180, y: 35, w: 190, h: 125 },
  { x: 350, y: 25, w: 210, h: 140 },
  { x: 560, y: 20, w: 200, h: 145 },
  { x: 910, y: 20, w: 200, h: 145 },
  { x: 20, y: 150, w: 200, h: 150 },
  { x: 250, y: 155, w: 220, h: 145 },
  { x: 690, y: 150, w: 170, h: 150 },
  { x: 930, y: 150, w: 200, h: 160 },
  { x: 20, y: 285, w: 210, h: 150 },
  { x: 300, y: 280, w: 200, h: 150 },
  { x: 630, y: 280, w: 200, h: 150 },
  { x: 930, y: 280, w: 200, h: 170 },
  { x: 20, y: 420, w: 230, h: 170 },
  { x: 280, y: 430, w: 220, h: 160 },
  { x: 620, y: 430, w: 280, h: 160 },
  { x: 930, y: 420, w: 200, h: 170 }
];

function showToast(message) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2600);
}

function showMessage(name, message) {
  const existing = document.querySelector('.message-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.className = 'message-modal';
  modal.innerHTML = `
    <div class="modal-content">
      <p class="modal-name">${name}</p>
      <p class="modal-message">${message}</p>
      <button class="modal-close">닫기</button>
    </div>
  `;
  document.body.appendChild(modal);
  modal.querySelector('.modal-close').onclick = () => modal.remove();
  modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
}

function hashString(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function daySeed() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function seededPick(docs, limit) {
  const seed = hashString(daySeed());
  return docs
    .map((doc, i) => ({ doc, k: (hashString(doc.id + seed) + i * 17) % 100000 }))
    .sort((a, b) => a.k - b.k)
    .slice(0, Math.min(limit, docs.length))
    .map(x => x.doc);
}

function catBehavior(seed) {
  const list = ['walk', 'sleep', 'eat', 'lie'];
  return list[seed % list.length];
}

function catPosition(i, total) {
  // deck + garden zones
  const row = i % 2; // 0: deck, 1: garden
  const col = Math.floor(i / 2);
  const maxCols = Math.ceil(total / 2);
  const x = 8 + (col * (82 / Math.max(1, maxCols - 1)));
  const yBase = row === 0 ? 63 : 83;
  const y = yBase + ((i % 3) - 1) * 1.5;
  return { x, y };
}

function renderCats(docs) {
  catLayer.innerHTML = '';
  const pick = seededPick(docs, MAX_RENDER_CATS);
  pick.forEach((doc, i) => {
    const data = doc.data();
    const seed = hashString(doc.id + daySeed());
    const behavior = catBehavior(seed);
    const pos = catPosition(i, pick.length);
    const sp = CAT_SPRITES[seed % CAT_SPRITES.length];
    const renderW = Math.round(sp.w * 0.46);
    const renderH = Math.round(sp.h * 0.46);

    const cat = document.createElement('button');
    cat.type = 'button';
    cat.className = `cat ${behavior}`;
    cat.style.left = `${pos.x}%`;
    cat.style.top = `${pos.y}%`;
    cat.style.setProperty('--cat-w', `${renderW}px`);
    cat.style.setProperty('--cat-h', `${renderH}px`);
    cat.style.setProperty('--sx', `${sp.x}`);
    cat.style.setProperty('--sy', `${sp.y}`);
    cat.title = `${data.name || '익명'}`;
    cat.innerHTML = `
      <div class="sprite"></div>
      <div class="collar">${(data.name || '익명').slice(0, 8)}</div>
    `;
    cat.onclick = () => showMessage(data.name || '익명', data.message || '');
    catLayer.appendChild(cat);
  });

  statusLine.textContent = `오늘의 고양이 ${pick.length}마리가 정원에 나와 있어.`;
}

function containsBlockedPattern(text) {
  const lowered = text.toLowerCase();
  return lowered.includes('http://') || lowered.includes('https://') || lowered.includes('www.');
}

function getRemainingCooldownSeconds() {
  const last = Number(localStorage.getItem(LAST_SUBMIT_KEY) || 0);
  if (!last) return 0;
  const elapsed = (Date.now() - last) / 1000;
  return Math.max(0, Math.ceil(RATE_LIMIT_SECONDS - elapsed));
}

const q = query(collection(db, 'comments'), orderBy('timestamp', 'asc'));
onSnapshot(q, (snapshot) => {
  renderCats(snapshot.docs);
}, (error) => {
  console.error(error);
  statusLine.textContent = '연결이 잠시 불안정해. 잠깐 후 다시 봐줘.';
  showToast('서버 연결이 불안정해. 잠시 후 다시 시도해줘.');
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const nameInput = document.getElementById('username');
  const messageInput = document.getElementById('usermessage');
  const name = (nameInput.value || '').trim();
  const message = (messageInput.value || '').trim();

  if (!name || !message) return showToast('이름과 응원 메시지를 모두 적어줘.');
  if (name.length > 10 || message.length > 50) return showToast('글자 수 제한을 확인해줘.');
  if (containsBlockedPattern(name) || containsBlockedPattern(message)) return showToast('링크는 입력할 수 없어.');

  const cooldownLeft = getRemainingCooldownSeconds();
  if (cooldownLeft > 0) return showToast(`${cooldownLeft}초 뒤에 다시 남겨줘.`);

  btn.disabled = true;
  btn.textContent = '남기는 중...';
  statusLine.textContent = '응원을 고양이 목걸이에 달고 있어…';

  try {
    await addDoc(collection(db, 'comments'), {
      name,
      message,
      timestamp: serverTimestamp()
    });
    localStorage.setItem(LAST_SUBMIT_KEY, String(Date.now()));
    form.reset();
    showToast('응원이 잘 전달됐어.');
  } catch (error) {
    console.error(error);
    showToast('오류가 생겼어. 잠시 후 다시 시도해줘.');
  } finally {
    btn.disabled = false;
    btn.textContent = '메시지 남기기';
  }
});
