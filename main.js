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
const form = document.getElementById('message-form');
const btn = form.querySelector('button');

// --- Tree Logic ---

function updateTreeGrowth(count) {
  // Max growth at 500 comments
  const maxComments = 500;
  // Calculate a value between 0 and 1
  const growthFactor = Math.min(count / maxComments, 1);
  
  // Set CSS variable for dynamic sizing
  treeContainer.style.setProperty('--growth-factor', growthFactor);
}

function getRandomPositionInFoliage() {
  // Stepped Pyramid Logic for Pixel Art Tree
  // The CSS clip-path defines 3 main tiers:
  // Tier 1 (Top): Y=0-20%, X=40-60%
  // Tier 2 (Mid): Y=20-40%, X=20-80%
  // Tier 3 (Bot): Y=40-100%, X=5-95% (Keep some margin from edge)

  const r = Math.random();
  let y, minX, maxX;

  if (r < 0.2) { 
    // Top Tier (20% chance)
    y = Math.random() * 20; 
    minX = 42; maxX = 58;
  } else if (r < 0.5) { 
    // Mid Tier (30% chance)
    y = 20 + Math.random() * 20;
    minX = 22; maxX = 78;
  } else {
    // Bottom Tier (50% chance)
    y = 40 + Math.random() * 55; // Up to 95%
    minX = 5; maxX = 95;
  }

  const x = minX + Math.random() * (maxX - minX);
  
  return { x, y };
}

function renderFruit(doc) {
  const data = doc.data();
  if (document.getElementById(doc.id)) return;

  const fruit = document.createElement('div');
  fruit.id = doc.id; 
  fruit.className = 'fruit';
  
  // Ribbon Content: Display message instead of Heart
  // Truncate to first few chars for the tag
  fruit.textContent = data.message.substring(0, 4) + (data.message.length > 4 ? ".." : "");
  
  const pos = getRandomPositionInFoliage();
  fruit.style.left = `${pos.x}%`;
  fruit.style.top = `${pos.y}%`;
  
  // Random animation delay for natural swaying
  fruit.style.animationDelay = `${Math.random() * 2}s`;
  
  fruit.title = `${data.name}: ${data.message}`;
  
  fruit.onclick = () => {
    alert(`${data.name}님의 메시지:\n\n"${data.message}"`);
  };

  foliage.appendChild(fruit);
}

// --- Real-time Listener ---

// Subscribe to the 'comments' collection
const q = query(collection(db, "comments"), orderBy("timestamp", "asc"));

onSnapshot(q, (snapshot) => {
  // Update Growth Stage based on total count
  updateTreeGrowth(snapshot.size);

  // Render changes
  snapshot.docChanges().forEach((change) => {
    if (change.type === "added") {
      renderFruit(change.doc);
    }
    // We can handle 'modified' or 'removed' later if needed
  });
});

// --- Event Listeners ---

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const nameInput = document.getElementById('username');
  const messageInput = document.getElementById('usermessage');
  
  const name = nameInput.value;
  const message = messageInput.value;
  
  if (!name || !message) return;

  // Disable button while sending
  btn.disabled = true;
  btn.textContent = "저장 중...";

  try {
    await addDoc(collection(db, "comments"), {
      name: name,
      message: message,
      timestamp: serverTimestamp()
    });
    
    // Success
    form.reset();
    alert("응원 메시지가 나무에 달렸습니다!");
  } catch (error) {
    console.error("Error adding document: ", error);
    alert("오류가 발생했습니다. 다시 시도해주세요.");
  } finally {
    btn.disabled = false;
    btn.textContent = "희망 열매 달기";
  }
});

