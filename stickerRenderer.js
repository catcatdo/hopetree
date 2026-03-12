const STICKER_THEMES = [
  { bg: "#fff0c8", tape: "#f5b650", ink: "#66502b" },
  { bg: "#ffd8dd", tape: "#ff9ead", ink: "#6e4250" },
  { bg: "#d9f1ff", tape: "#82c4ea", ink: "#385b6d" },
  { bg: "#e3f5cf", tape: "#9ad26f", ink: "#446035" },
  { bg: "#f0defd", tape: "#c89ce9", ink: "#5a4670" },
  { bg: "#ffe6c9", tape: "#f0ae72", ink: "#704c31" }
];

function previewText(message) {
  if (message.length <= 42) {
    return message;
  }

  return `${message.slice(0, 42)}…`;
}

export function createStickerRenderer({ container, onSelect }) {
  function render(comments) {
    container.innerHTML = "";

    comments.forEach((comment, index) => {
      const theme = STICKER_THEMES[comment.seed % STICKER_THEMES.length];
      const sticker = document.createElement("button");
      sticker.type = "button";
      sticker.className = "sticker";
      sticker.style.setProperty("--sticker-bg", theme.bg);
      sticker.style.setProperty("--sticker-tape", theme.tape);
      sticker.style.setProperty("--sticker-ink", theme.ink);
      sticker.style.setProperty("--sticker-tilt", `${((comment.seed % 9) - 4) * 0.7}deg`);

      if (index < 4) {
        sticker.classList.add("newest");
      }

      sticker.innerHTML = `
        <span class="sticker-tape"></span>
        <span class="sticker-name">${comment.name}</span>
        <span class="sticker-preview">${previewText(comment.message)}</span>
      `;
      sticker.title = `${comment.name}: ${comment.message}`;
      sticker.onclick = () => onSelect(comment);
      container.appendChild(sticker);
    });
  }

  return { render };
}
