# Hope Tree Project Blueprint

## 1. Overview
The "Hope Tree" (희망 나무) is a web application designed to collect supportive messages for the user's sister who is recovering from tumor surgery.
**Core Concept:** Users post encouraging comments. Each comment visualizes as a "fruit" or "blossom" on a central tree. As the number of comments increases, the tree grows in size and complexity (branches/foliage), symbolizing the collective strength of support.

## 2. Technical Architecture
*   **Platform:** Web (HTML5, CSS3, ES6+ JavaScript).
*   **Hosting:** GitHub Pages.
*   **Database:** Firebase Firestore (for real-time persistence of comments).
*   **Styling:** Modern CSS (Flexbox/Grid, CSS Variables, Animations).
*   **Framework:** None (Vanilla JS per project guidelines).

## 3. Design & Features
*   **The Tree:** A central visual element. It will have multiple "stages" of growth based on comment count (e.g., Sapling -> Young Tree -> Full Tree).
*   **The Fruit (Comments):** Messages will hang on the tree. Clicking a fruit reveals the full message.
*   **The Input:** A simple, gentle UI for submitting a name and a message.
*   **Responsiveness:** Must work beautifully on mobile devices (where family/friends are likely to access it).

## 4. Implementation Plan (Current Request)
1.  **Project Structure:** Clear existing "Hello World" boilerplate.
2.  **Firebase Setup:** Initialize Firebase App and Firestore in `main.js`.
3.  **UI Layout:**
    *   Main container for the Tree.
    *   Overlay or section for the "Write a Message" form.
4.  **Tree Logic:**
    *   Create a `renderTree(count)` function.
    *   Define CSS classes for tree growth stages.
5.  **Comment Logic:**
    *   `addComment(name, message)` function to write to Firebase.
    *   `listenForComments()` to subscribe to updates and render fruits.
6.  **Visual Polish:** Warm, healing color palette (greens, soft pinks/oranges).
