const PALETTE_BY_STAGE = {
  bud: {
    fruit: ["#f2b1c8", "#ffd2de", "#ffefbf"],
    leaf: ["#9dcf88", "#7fb36a", "#c9e7b3"],
    sparkle: false
  },
  bloom: {
    fruit: ["#ff9fc2", "#ffd4dc", "#ffe9a8"],
    leaf: ["#7ebf73", "#bfe3ad", "#93cd88"],
    sparkle: false
  },
  leaf: {
    fruit: ["#ff8ba7", "#ffc87c", "#fff0c2"],
    leaf: ["#76b85f", "#9ed67e", "#d9f0bf"],
    sparkle: false
  },
  harvest: {
    fruit: ["#ff8c6a", "#ffcb66", "#ffd2d2"],
    leaf: ["#5eab55", "#89ca71", "#d6f1b4"],
    sparkle: true
  }
};

function pickPalette(seed, stage) {
  const active = PALETTE_BY_STAGE[stage] || PALETTE_BY_STAGE.bud;
  return {
    fruit: active.fruit[seed % active.fruit.length],
    leaf: active.leaf[(seed + 1) % active.leaf.length],
    sparkle: active.sparkle && seed % 3 === 0
  };
}

function distance(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function buildSlots(count, growth) {
  const slots = [];
  const centerX = 50;
  const centerY = growth.clusterCenterY || 40;
  const radiusX = growth.radiusX || 18;
  const radiusY = growth.radiusY || 13;
  const minDistance = growth.minDistance || 4.3;
  const goldenAngle = 2.399963229728653;

  for (let index = 0; index < count; index += 1) {
    let placed = null;

    for (let attempt = 0; attempt < 40 && !placed; attempt += 1) {
      const step = index + attempt * 0.37;
      const spiral = Math.sqrt((step + 0.5) / Math.max(1, count));
      const angle = step * goldenAngle;
      const candidate = {
        x: centerX + Math.cos(angle) * radiusX * spiral,
        y: centerY + Math.sin(angle) * radiusY * spiral
      };

      const insideEllipse =
        ((candidate.x - centerX) ** 2) / (radiusX ** 2) +
        ((candidate.y - centerY) ** 2) / (radiusY ** 2) <= 1;

      const farEnough = slots.every((slot) => distance(slot, candidate) >= minDistance);

      if (insideEllipse && farEnough) {
        placed = candidate;
      }
    }

    if (!placed) {
      const fallbackAngle = index * goldenAngle;
      const fallbackRadius = Math.sqrt((index + 1) / Math.max(1, count)) * 0.92;
      placed = {
        x: centerX + Math.cos(fallbackAngle) * radiusX * fallbackRadius,
        y: centerY + Math.sin(fallbackAngle) * radiusY * fallbackRadius
      };
    }

    slots.push(placed);
  }

  return slots;
}

export function createFruitRenderer({ container, onSelect }) {
  function render(comments, growth) {
    container.innerHTML = "";
    container.dataset.stage = growth.stage;

    const slots = buildSlots(comments.length, growth);

    comments.forEach((comment, index) => {
      const slot = slots[index];
      const palette = pickPalette(comment.seed, growth.stage);
      const fruit = document.createElement("button");
      fruit.type = "button";
      fruit.className = "fruit";
      fruit.style.left = `${slot.x}%`;
      fruit.style.top = `${slot.y}%`;
      fruit.style.setProperty("--fruit-size", `${growth.fruitSize + (comment.seed % 4)}px`);
      fruit.style.setProperty("--fruit-color", palette.fruit);
      fruit.style.setProperty("--leaf-color", palette.leaf);
      fruit.style.setProperty("--fruit-tilt", `${(comment.seed % 7) - 3}deg`);
      fruit.style.setProperty("--label-width", `${44 + Math.min(comment.name.length, 6) * 5}px`);

      if (palette.sparkle) {
        fruit.classList.add("sparkle");
      }

      fruit.innerHTML = `
        <span class="fruit-body"></span>
        <span class="fruit-name">${comment.name.slice(0, 6)}</span>
      `;
      fruit.title = comment.name;
      fruit.onclick = () => onSelect(comment);
      container.appendChild(fruit);
    });
  }

  return { render };
}
