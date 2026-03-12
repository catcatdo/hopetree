// Import Firebase SDKs
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

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyAXLOY5jFFC4_8IhLvSGX7ldnJs_DWP98U",
  authDomain: "hopetree-79e2f.firebaseapp.com",
  projectId: "hopetree-79e2f",
  storageBucket: "hopetree-79e2f.firebasestorage.app",
  messagingSenderId: "462749351611",
  appId: "1:462749351611:web:cef13ad3eb3e77e98d739e",
  measurementId: "G-VMLYFEG97J"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

// DOM Elements
const treeContainer = document.getElementById('tree-container');
const foliage = document.querySelector('.tree-foliage');
const fruitsContainer = document.getElementById('fruits-container');
const form = document.getElementById('message-form');
const btn = form.querySelector('button');
const starsContainer = document.getElementById('stars-container');
const statusLine = document.getElementById('status-line');

// --- Day/Night Cycle based on Korean Time (KST, UTC+9) ---

function getKoreanTime() {
  const now = new Date();
  // Get UTC time and add 9 hours for KST
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const kst = new Date(utc + (9 * 3600000));
  return kst;
}

function isNightTime() {
  const kst = getKoreanTime();
  const hour = kst.getHours();
  // Night: 6PM (18:00) to 6AM (06:00)
  return hour >= 18 || hour < 6;
}

function createStars() {
  if (!starsContainer) return;
  starsContainer.innerHTML = '';

  // Create pixel-aligned stars (positions snap to 8px grid)
  const starCount = 40;
  for (let i = 0; i < starCount; i++) {
    const star = document.createElement('div');
    star.className = 'star';

    // Random size with pixel style distribution
    const sizeRand = Math.random();
    if (sizeRand < 0.5) {
      star.classList.add('small');
    } else if (sizeRand < 0.75) {
      star.classList.add('medium');
    } else if (sizeRand < 0.92) {
      star.classList.add('large');
    } else {
      star.classList.add('sparkle');
    }

    // Pixel-aligned positions (snap to 4px grid, top 55% only)
    const xPos = Math.floor(Math.random() * 25) * 4;
    const yPos = Math.floor(Math.random() * 14) * 4;
    star.style.left = `${xPos}%`;
    star.style.top = `${yPos}%`;

    // Stepped animation delays
    star.style.animationDelay = `${Math.floor(Math.random() * 4) * 0.25}s`;

    starsContainer.appendChild(star);
  }
}

function updateDayNightCycle() {
  const isNight = isNightTime();

  if (isNight) {
    document.body.classList.add('night');
  } else {
    document.body.classList.remove('night');
  }
}

// Initialize stars and day/night cycle
createStars();
updateDayNightCycle();

// Update every minute to catch time changes
setInterval(updateDayNightCycle, 60000);

// --- Cat Animation ---

const yellowCat = document.querySelector('.yellow-cat');
const blackCat = document.querySelector('.black-cat');

function getRandomAction() {
  // 65% walk, 35% sleep
  return Math.random() < 0.65 ? 'walk' : 'sleep';
}

function getRandomDirection() {
  return Math.random() < 0.5 ? 'left' : 'right';
}

function getRandomDelay() {
  // Random delay between 10-30 seconds
  return 10000 + Math.random() * 20000;
}

function getRandomSleepPosition() {
  // Sleep position near the tree (40% - 60% of screen width)
  return 40 + Math.random() * 20;
}

function resetCatClasses(cat) {
  cat.classList.remove(
    'visible', 'walking', 'reverse', 'sleeping',
    'walking-to-sleep', 'from-right', 'walking-away', 'to-right'
  );
}

function animateCat(cat) {
  const action = getRandomAction();
  resetCatClasses(cat);

  // Reset position off-screen first
  cat.style.left = '-50px';

  if (action === 'walk') {
    // Just walk across the screen
    const direction = getRandomDirection();

    // Set starting position based on direction
    if (direction === 'left') {
      cat.style.left = 'calc(100% + 40px)';
      cat.classList.add('reverse');
    } else {
      cat.style.left = '-40px';
    }

    // Small delay to ensure position is set before showing
    requestAnimationFrame(() => {
      cat.classList.add('visible', 'walking');
    });

    // After walk animation ends (20s), hide and schedule next
    setTimeout(() => {
      resetCatClasses(cat);
      cat.style.left = '-50px';
      setTimeout(() => animateCat(cat), getRandomDelay());
    }, 20000);

  } else {
    // Sleep sequence: walk in -> sleep -> walk out opposite direction
    const fromDirection = getRandomDirection();
    const sleepPosition = getRandomSleepPosition();

    // Set CSS variable for sleep position
    cat.style.setProperty('--sleep-pos', `${sleepPosition}%`);

    // Set starting position based on direction
    if (fromDirection === 'right') {
      cat.style.left = 'calc(100% + 40px)';
      cat.classList.add('from-right');
    } else {
      cat.style.left = '-40px';
    }

    // Small delay to ensure position is set before showing
    requestAnimationFrame(() => {
      cat.classList.add('visible', 'walking-to-sleep');
    });

    // Step 2: After reaching position (10s), start sleeping
    setTimeout(() => {
      resetCatClasses(cat);
      cat.style.left = `${sleepPosition}%`;

      requestAnimationFrame(() => {
        cat.classList.add('visible', 'sleeping');
      });

      // Step 3: After sleeping (8-15s), walk away
      const sleepDuration = 8000 + Math.random() * 7000;
      setTimeout(() => {
        resetCatClasses(cat);
        cat.style.setProperty('--sleep-pos', `${sleepPosition}%`);

        // Walk out opposite direction
        if (fromDirection === 'left') {
          cat.classList.add('to-right');
        }

        requestAnimationFrame(() => {
          cat.classList.add('visible', 'walking-away');
        });

        // Step 4: After walking away (10s), schedule next
        setTimeout(() => {
          resetCatClasses(cat);
          cat.style.left = '-50px';
          setTimeout(() => animateCat(cat), getRandomDelay());
        }, 10000);

      }, sleepDuration);
    }, 10000);
  }
}

// Start cat animations with different initial delays
setTimeout(() => animateCat(yellowCat), 3000 + Math.random() * 5000);
setTimeout(() => animateCat(blackCat), 15000 + Math.random() * 10000);


// --- Tree Logic ---

function updateTreeGrowth(count) {
  // Max growth at 500 comments
  const maxComments = 500;
  // Calculate a value between 0 and 1
  const growthFactor = Math.min(count / maxComments, 1);

  // Set CSS variable for dynamic sizing
  treeContainer.style.setProperty('--growth-factor', growthFactor);
}

// Debug: Preview full-grown tree (call from console: previewFullTree())
window.previewFullTree = function() {
  treeContainer.style.setProperty('--growth-factor', 1);
  console.log('🌳 나무가 최대로 성장했습니다! (미리보기)');
  console.log('원래대로 돌리려면 페이지를 새로고침하세요.');
};

window.previewTreeGrowth = function(percent) {
  const factor = Math.min(Math.max(percent / 100, 0), 1);
  treeContainer.style.setProperty('--growth-factor', factor);
  console.log(`🌱 나무 성장률: ${Math.round(factor * 100)}%`);
};

// --- Fruit placement: overlap-safe radial slots ---

function createFruitSlots(count) {
  const slots = [];
  if (count <= 0) return slots;

  const ringPlan = [8, 12, 16, 20, 24, 28, 32];
  let remaining = count;
  let ringIndex = 0;

  while (remaining > 0) {
    const capacity = ringPlan[ringIndex] || (32 + ringIndex * 4);
    const inRing = Math.min(capacity, remaining);
    const radiusX = 12 + ringIndex * 6.5;
    const radiusY = 16 + ringIndex * 7.5;

    for (let i = 0; i < inRing; i++) {
      const baseAngle = (Math.PI * 2 * i) / inRing;
      const jitter = ((i % 2 === 0 ? 1 : -1) * 0.05) + (Math.random() - 0.5) * 0.03;
      const angle = baseAngle + jitter;
      const x = 50 + Math.cos(angle) * radiusX;
      const y = 52 + Math.sin(angle) * radiusY;
      slots.push({ x, y });
    }

    remaining -= inRing;
    ringIndex += 1;
  }

  return slots;
}

function renderFruit(doc, pos) {
  const data = doc.data();

  const fruit = document.createElement('div');
  fruit.id = doc.id;
  fruit.className = 'fruit';

  // Show only the name (truncated if too long)
  const maxLen = 4;
  const safeName = (data.name || '익명').trim();
  const safeMessage = (data.message || '').trim();

  fruit.textContent = safeName.length > maxLen
    ? safeName.substring(0, maxLen)
    : safeName;

  fruit.style.left = `${pos.x}%`;
  fruit.style.top = `${pos.y}%`;

  // Random animation delay and duration for natural movement
  fruit.style.animationDelay = `${Math.random() * 4}s`;
  fruit.style.animationDuration = `${3 + Math.random() * 2}s`;

  fruit.title = `${safeName}: ${safeMessage}`;

  fruit.onclick = () => {
    showMessage(safeName, safeMessage);
  };

  fruitsContainer.appendChild(fruit);
}

function renderAllFruits(docs) {
  fruitsContainer.innerHTML = '';
  const slots = createFruitSlots(docs.length);
  docs.forEach((doc, idx) => renderFruit(doc, slots[idx] || { x: 50, y: 52 }));
}

// Custom message modal instead of alert
function showMessage(name, message) {
  // Remove existing modal if any
  const existing = document.querySelector('.message-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.className = 'message-modal';
  modal.innerHTML = `
    <div class="modal-content">
      <p class="modal-name">${name}</p>
      <p class="modal-message">"${message}"</p>
      <button class="modal-close">닫기</button>
    </div>
  `;

  document.body.appendChild(modal);

  modal.querySelector('.modal-close').onclick = () => modal.remove();
  modal.onclick = (e) => {
    if (e.target === modal) modal.remove();
  };
}

function setStatusLine(text) {
  if (!statusLine) return;
  statusLine.textContent = text;
}

// Toast notification
function showToast(message) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => toast.remove(), 3000);
}

// --- Real-time Listener ---

// Subscribe to the 'comments' collection
const q = query(collection(db, "comments"), orderBy("timestamp", "asc"));

onSnapshot(q, (snapshot) => {
  // Update Growth Stage based on total count
  updateTreeGrowth(snapshot.size);
  renderAllFruits(snapshot.docs);
  setStatusLine('응원이 나무를 키우는 중…');
}, (error) => {
  console.error('Firestore 실시간 구독 오류:', error);
  setStatusLine('연결이 잠시 불안정해. 곧 다시 이어질 거야.');
  showToast('서버 연결이 불안정해. 잠시 후 다시 시도해줘.');
});

// --- Event Listeners ---

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const nameInput = document.getElementById('username');
  const messageInput = document.getElementById('usermessage');

  const name = (nameInput.value || '').trim();
  const message = (messageInput.value || '').trim();

  if (!name || !message) {
    showToast('이름과 메시지를 모두 입력해줘.');
    return;
  }

  if (name.length > 10 || message.length > 50) {
    showToast('글자 수 제한을 확인해줘.');
    return;
  }

  // Disable button while sending
  btn.disabled = true;
  btn.textContent = "달리는 중...";
  setStatusLine('메시지를 나무에 달고 있어…');

  try {
    await addDoc(collection(db, "comments"), {
      name,
      message,
      timestamp: serverTimestamp()
    });

    // Success
    form.reset();
    setStatusLine('따뜻한 응원이 열매로 달렸어. 고마워!');
    showToast('메시지가 열매로 달렸어!');
  } catch (error) {
    console.error("Error adding document: ", error);
    setStatusLine('전송 중 문제가 생겼어. 다시 시도해줘.');
    showToast('오류가 발생했어. 잠시 후 다시 시도해줘.');
  } finally {
    btn.disabled = false;
    btn.textContent = "메시지 달기";
  }
});

