// ===============================
// CONFIG: lấy ảnh theo số thứ tự
// ===============================

// Số lượng ảnh trong thư mục /images (
const IMAGE_COUNT = 24;

// Biến lưu dữ liệu từ lovedata.json
let loveDataMap = {};

// Load dữ liệu từ lovedata.json
async function loadLoveData() {
  try {
    const response = await fetch('lovedata.json');
    const data = await response.json();
    
    // Tạo map để dễ tra cứu caption theo id ảnh
    // Hỗ trợ cả hai định dạng: mảng ở root OR { photos: [...] }
    const photosArray = Array.isArray(data)
      ? data
      : data.photos && Array.isArray(data.photos)
      ? data.photos
      : [];

    photosArray.forEach((photo) => {
      if (photo && photo.id != null) {
        loveDataMap[photo.id] = photo.caption;
      }
    });
  } catch (error) {
    console.warn('Không thể load lovedata.json:', error);
  }
}

// Hàm lấy caption từ JSON dựa trên id ảnh
function getCaptionFromData(photoId) {
  return loveDataMap[photoId] || `Khoảnh khắc #${photoId}`;
}

// Cho phép xen lẫn ảnh & video
// - Mặc định: type = "image"
// - Với những id bạn muốn là video, khai báo thêm trong videoConfig
// THÊM MỚI: Chèn caption trực tiếp vào đây
const videoConfig = {
  5: {
    src: "videos/5.mp4",
    caption: "Video kỷ niệm chúng mình đi chơi ở Đà Lạt ❤️"
  },
  12: {
    src: "videos/12.mp4",
    caption: "Lúc em đang tập làm video bằng DaVinci Resolve nè!"
  }
};

const photos = Array.from({ length: IMAGE_COUNT }, (_, index) => {
  const id = index + 1;

  if (videoConfig[id]) {
    // PHẦN TỬ LÀ VIDEO
    return {
      id,
      type: "video",
      src: videoConfig[id].src,      // đường dẫn file .mp4
      caption: videoConfig[id].caption || getCaptionFromData(id),
    };
  }

  // PHẦN TỬ LÀ ẢNH (mặc định)
  return {
    id,
    type: "image",
    src: `images/${id}.jpg`,
    caption: getCaptionFromData(id),
  };
});


// Story timing
let STORY_FRAME_DURATION = 4000; // ms
const STORY_TRANSITION = 650;

// Ending text
const ENDING_TEXT = "Happy Valentine’s Day ❤️";

// ===============================
// DOM refs
// ===============================
const canvas = document.getElementById("particle-canvas");
const ctx = canvas.getContext("2d");
// canvas cho fairy dust
const fairyCanvas = document.getElementById("fairy-canvas");
const fctx = fairyCanvas.getContext("2d");

const heartModeEl = document.getElementById("heart-mode");
const heartCollageEl = document.getElementById("heart-collage");

const playStoryBtn = document.getElementById("play-story");

const storyModeEl = document.getElementById("story-mode");
const storyMediaContainer = document.getElementById("story-media-container");
const storyCaptionEl = document.getElementById("story-caption");
const endingTextEl = document.getElementById("ending-text");

const progressBarEl = document.getElementById("progress-bar");
const reactionLayerEl = document.getElementById("reaction-layer");
const btnLike = document.getElementById("btn-like");
const btnHeart = document.getElementById("btn-heart");
const btnLikeStory = document.getElementById("btn-like-story");
const btnHeartStory = document.getElementById("btn-heart-story");

// DOM cho intro countdown
const introOverlayEl = document.getElementById("intro-countdown");
const introNumberEl = document.getElementById("intro-number");
const introBoomEl = document.getElementById("intro-boom");

endingTextEl.textContent = ENDING_TEXT;

// ===============================
// INTRO COUNTDOWN 3-2-1 + BOOM
// ===============================
function runIntroCountdown() {
  if (!introOverlayEl || !introNumberEl || !introBoomEl) return;

  const sequence = ["3", "2", "1"];
  let step = 0;

  function showNextNumber() {
    if (step >= sequence.length) {
      triggerIntroBoom();
      return;
    }

    const value = sequence[step];
    introNumberEl.textContent = value;

    // reset animation class
    introNumberEl.classList.remove("show");
    void introNumberEl.offsetWidth; // reflow

    // kích hoạt animation số xuất hiện
    introNumberEl.classList.add("show");

    step += 1;

    // mỗi số hiển thị khoảng 1000ms
    setTimeout(showNextNumber, 900);
  }

  function triggerIntroBoom() {
    // Ẩn số đi để boom nổi bật hơn
    introNumberEl.classList.remove("show");
    introNumberEl.style.opacity = "0";

    // Kích hoạt boom
    introBoomEl.classList.add("boom-active");

    // Đồng thời kích hoạt glow toàn màn hình bạn đã có (tùy chọn)
    createGlowEffect("rgba(255, 92, 138, 0.9)");

    // Sau boom xong, kích hoạt zoom trái tim ra từ từ
    setTimeout(() => {
      // Lấy phần tử trái tim trong intro
      const introHeartEl = document.querySelector(".intro-heart");
      if (introHeartEl) {
        introHeartEl.classList.add("heart-zoom-out");
      }

      // Đồng thời bắt đầu fade-in màn hình chính
      heartModeEl.classList.add("fade-in-screen");
    }, 400);

    // Sau khi zoom xong (~1900ms tính từ boom), fade-out overlay

    setTimeout(() => {
      // Lấy phần tử trái tim trong intro
      const introHeartEl = document.querySelector(".intro-heart");
      if (introHeartEl) {
        introHeartEl.classList.add("heart-zoom-out");
      }

      // Đồng thời bắt đầu fade-in màn hình chính
      heartModeEl.classList.add("fade-in-screen");
      
      // Rebuild heart collage để hiệu ứng ảnh xuất hiện lại
      buildHeartCollage();
    }, 400);

    // Sau khi zoom xong (~1900ms tính từ boom), fade-out overlay
    setTimeout(() => {
      introOverlayEl.classList.add("hidden");

      // Sau thêm 600ms, remove hẳn khỏi DOM (tối ưu)
      setTimeout(() => {
        introOverlayEl.remove();
      }, 650);
    }, 1900);
  }

  // Bắt đầu sau một nhịp ngắn để người xem kịp cảm nhận
  setTimeout(showNextNumber, 400);
}

// ===============================
// PARTICLE BACKGROUND
// ===============================
const particleConfig = {
  count: 90,
  minSize: 1.8,
  maxSize: 3.4,
  minSpeed: 0.08,
  maxSpeed: 0.25,
  colors: ["#ff5c8a", "#ff2e63", "#ffd6e0"],
  maxOpacity: 0.9,
};

let particles = [];
let canvasWidth = window.innerWidth;
let canvasHeight = window.innerHeight;

function resizeCanvas() {
  canvasWidth = window.innerWidth;
  canvasHeight = window.innerHeight;
  const dpr = window.devicePixelRatio || 1;

  // canvas background
  canvas.width = canvasWidth * dpr;
  canvas.height = canvasHeight * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  // THÊM MỚI: canvas fairy dust
  fairyCanvas.width = canvasWidth * dpr;
  fairyCanvas.height = canvasHeight * dpr;
  fctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}


function createParticle() {
  const size =
    particleConfig.minSize +
    Math.random() * (particleConfig.maxSize - particleConfig.minSize);
  const speed =
    particleConfig.minSpeed +
    Math.random() * (particleConfig.maxSpeed - particleConfig.minSpeed);

  return {
    x: Math.random() * canvasWidth,
    y: Math.random() * canvasHeight,
    size,
    speed,
    color:
      particleConfig.colors[
        Math.floor(Math.random() * particleConfig.colors.length)
      ],
    opacity: Math.random() * particleConfig.maxOpacity,
    drift: (Math.random() - 0.5) * 0.15,
  };
}

function initParticles() {
  particles = [];
  for (let i = 0; i < particleConfig.count; i++) {
    particles.push(createParticle());
  }
}

function updateParticles() {
  for (const p of particles) {
    p.y -= p.speed;
    p.x += p.drift;

    if (p.y + p.size < 0) {
      p.y = canvasHeight + p.size;
      p.x = Math.random() * canvasWidth;
    }
    if (p.x < -p.size) p.x = canvasWidth + p.size;
    if (p.x > canvasWidth + p.size) p.x = -p.size;
  }
}

function drawParticles() {
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  for (const p of particles) {
    ctx.beginPath();
    ctx.globalAlpha = p.opacity;
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 8;
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
}

function loop() {
  updateParticles();
  drawParticles();
   // THÊM MỚI: update & vẽ fairy dust
  updateFairyDust();
  drawFairyDust();
  requestAnimationFrame(loop);
}

window.addEventListener("resize", () => {
  resizeCanvas();
  initParticles();
});

// Khởi tạo particles sau khi DOM sẵn sàng
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    if (canvas && ctx && fairyCanvas && fctx) {
      resizeCanvas();
      initParticles();
      requestAnimationFrame(loop);
    }
  });
} else {
  if (canvas && ctx && fairyCanvas && fctx) {
    resizeCanvas();
    initParticles();
    requestAnimationFrame(loop);
  }
}
// THÊM MỚI: tính lại tâm & bán kính fairy dust dựa trên heart-collage
function updateFairyFromHeart() {
  const rect = heartCollageEl.getBoundingClientRect();
  fairyCenter = {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  };
  fairyRadius = Math.min(rect.width, rect.height) / 2.1;
}

window.addEventListener("load", async () => {
  // Load dữ liệu từ JSON trước
  await loadLoveData();
  
  // Rebuild photos array với caption từ JSON
  photos.forEach((photo) => {
    photo.caption = getCaptionFromData(photo.id);
  });
  
  updateFairyFromHeart();
  initFairyDust();
  buildHeartCollage();  // Gọi sau khi data sẵn sàng
  runIntroCountdown();
});

window.addEventListener("resize", () => {
  updateFairyFromHeart();
  initFairyDust();
});
// ===============================
// FAIRY DUST quanh viền trái tim
// ===============================
const fairyConfig = {
  count: 90,          // số hạt bụi tiên
  minSize: 0.8,
  maxSize: 1.8,
  minSpeed: 0.002,    // tốc độ xoay chậm
  maxSpeed: 0.01,
  colors: ["#ffd6e0", "#ff5c8a", "#ffffff"],
  maxOpacity: 0.9,
};

let fairyParticles = [];
let fairyCenter = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
let fairyRadius = 160; // sẽ update theo kích thước heart-collage

// Tạo hạt quanh đường tròn (gần tương ứng viền trái tim)
function createFairyParticle(angle) {
  const speed =
    fairyConfig.minSpeed +
    Math.random() * (fairyConfig.maxSpeed - fairyConfig.minSpeed);

  const radiusOffset = (Math.random() - 0.5) * 22; // dao động quanh viền
  const size =
    fairyConfig.minSize +
    Math.random() * (fairyConfig.maxSize - fairyConfig.minSize);

  return {
    angle,
    radiusOffset,
    size,
    speed,
    color:
      fairyConfig.colors[
        Math.floor(Math.random() * fairyConfig.colors.length)
      ],
    opacity: 0.4 + Math.random() * (fairyConfig.maxOpacity - 0.4),
  };
}

function initFairyDust() {
  fairyParticles = [];
  for (let i = 0; i < fairyConfig.count; i++) {
    const angle = (Math.PI * 2 * i) / fairyConfig.count;
    fairyParticles.push(createFairyParticle(angle));
  }
}

function updateFairyDust() {
  for (const p of fairyParticles) {
    p.angle += p.speed; // xoay vòng quanh trái tim
  }
}

function drawFairyDust() {
  fctx.clearRect(0, 0, canvasWidth, canvasHeight);

  for (const p of fairyParticles) {
    const radius = fairyRadius + p.radiusOffset;
    const x = fairyCenter.x + Math.cos(p.angle) * radius;
    const y = fairyCenter.y + Math.sin(p.angle) * radius;

    fctx.beginPath();
    fctx.globalAlpha = p.opacity;
    fctx.fillStyle = p.color;
    fctx.shadowColor = p.color;
    fctx.shadowBlur = 8;
    fctx.arc(x, y, p.size, 0, Math.PI * 2);
    fctx.fill();
  }

  fctx.globalAlpha = 1;
  fctx.shadowBlur = 0;
}

// ===============================
// HEART COLLAGE
// ===============================
function heartFunction(t) {
  const x = 16 * Math.pow(Math.sin(t), 3);
  const y =
    13 * Math.cos(t) -
    5 * Math.cos(2 * t) -
    2 * Math.cos(3 * t) -
    Math.cos(4 * t);
  return { x: x / 18, y: -(y / 18) };
}

function generateHeartPoints(count) {
  const points = [];
  for (let i = 0; i < count; i++) {
    const t = (Math.PI * 2 * i) / count;
    const { x, y } = heartFunction(t);
    points.push({ x, y, angle: t });
  }
  points.sort(
    (a, b) => Math.abs(a.angle - Math.PI / 2) - Math.abs(b.angle - Math.PI / 2)
  );
  return points;
}

function buildHeartCollage() {
  const total = photos.length;
  if (!total) return;

  const rect = heartCollageEl.getBoundingClientRect();
  const w = rect.width;
  const h = rect.height;
  const points = generateHeartPoints(total);
  const scale = Math.min(w, h) / 2.4;

  heartCollageEl.innerHTML = "";

  points.forEach((p, index) => {
    const photo = photos[index % photos.length];

    const centerX = w / 2 + p.x * scale;
    const centerY = h / 2 + p.y * scale;

    const wrapper = document.createElement("div");
    wrapper.className = "heart-image";

    const img = document.createElement("img");
    img.src = photo.src;
    img.alt = photo.caption || `Memory ${index + 1}`;
    img.loading = "lazy";
    img.draggable = false;
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.borderRadius = "inherit";
    img.style.display = "block";

    const caption = document.createElement("div");
    caption.className = "heart-caption";
    caption.textContent = photo.caption || "";

    wrapper.style.left = `${centerX}px`;
    wrapper.style.top = `${centerY}px`;

    const baseDelay = 2200; /* thời gian ảnh bắt đàu xuât hiện*/
    const perItem = 100; /* thời gian giãn cách giữa các ảnh */
    const randomOffset = Math.random() * 200;
    const delay = baseDelay + index * perItem + randomOffset;
    wrapper.style.transitionDelay = `${delay}ms`;

    heartCollageEl.appendChild(wrapper);
    wrapper.appendChild(img);
    wrapper.appendChild(caption);

    requestAnimationFrame(() => {
      wrapper.style.opacity = "1";
      wrapper.style.transform = "translate(-50%, -50%) scale(1)";
    });
  });

  const maxDelay = 220 + (photos.length - 1) * 55 + 200;
  setTimeout(() => {
    heartCollageEl.classList.add("pulsing");
  }, maxDelay + 300);
}

window.addEventListener("resize", buildHeartCollage);

// ===============================
// STORY MODE + PROGRESS + KEYBOARD
// ===============================
let storyIndex = 0;
let storyTimer = null;
let storyRunning = false;
let storyPaused = false;

function updateProgressBar() {
  if (!photos.length) return;
  const progress = ((storyIndex + 1) / photos.length) * 100;
  progressBarEl.style.width = `${progress}%`;
}

function showStoryFrame(index) {
  if (!photos.length) return;
  storyIndex = (index + photos.length) % photos.length;

  const item = photos[storyIndex];

  // XÓA media cũ trong container
  storyMediaContainer.innerHTML = "";

  // Tạo phần tử media mới: img hoặc video
  let mediaEl;
  if (item.type === "video") {
    // VIDEO
    mediaEl = document.createElement("video");
    mediaEl.src = item.src;
    mediaEl.autoplay = true; // tự phát khi slide tới
    mediaEl.loop = true;     // lặp lại liên tục
    mediaEl.muted = true;    // tắt tiếng để auto-play trên browser
    mediaEl.playsInline = true; // cho mobile
    mediaEl.setAttribute("controls", ""); // NẾU BẠN KHÔNG MUỐN controls, xoá dòng này
    // Nếu bạn muốn KHÔNG có controls, dùng:
    // mediaEl.removeAttribute("controls");
  } else {
    // ẢNH
    mediaEl = document.createElement("img");
    mediaEl.src = item.src;
    mediaEl.alt = item.caption || `Memory ${storyIndex + 1}`;
  }

  // Thêm class/animation chung (CSS đã set cho img & video)
  storyMediaContainer.appendChild(mediaEl);

  // Reset trạng thái animation
  mediaEl.style.transition = "none";
  mediaEl.style.opacity = "0";
  mediaEl.style.transform = "scale(1.03)";
  void mediaEl.offsetWidth;

  // Cập nhật caption
  storyCaptionEl.textContent = item.caption || "";

  // Bật animation fade-in
  mediaEl.style.transition = `opacity ${STORY_TRANSITION}ms ease-out, transform ${STORY_TRANSITION}ms ease-out`;
  requestAnimationFrame(() => {
    mediaEl.style.opacity = "1";
    mediaEl.style.transform = "scale(1)";
  });

  // Ẩn ending text nếu đang hiện
  endingTextEl.style.opacity = "0";
  endingTextEl.classList.remove("pulse");

  updateProgressBar();
}


function scheduleNextFrame() {
  if (!storyRunning || storyPaused) return;
  if (storyTimer) clearTimeout(storyTimer);

  storyTimer = setTimeout(() => {
    if (!storyRunning || storyPaused) return;
    const nextIndex = storyIndex + 1;
    if (nextIndex < photos.length) {
      showStoryFrame(nextIndex);
      scheduleNextFrame();
    } else {
      showEndingFrame();
    }
  }, STORY_FRAME_DURATION);
}

function startStoryMode() {
  if (!photos.length || storyRunning) return;

  storyRunning = true;
  storyPaused = false;
  storyIndex = 0;

  // Ensure the heart-mode is fully hidden before showing Story Mode.
  // We remove any intro-related class (like 'fade-in-screen') which
  // can force `display:flex !important` and cause the two screens to
  // overlap when story mode uses a semi-transparent background.
  heartModeEl.classList.remove("active", "fade-in-screen");
  // As a fallback, hide via inline style so it won't interfere visually.
  heartModeEl.style.display = "none";
  storyModeEl.classList.add("active");

  showStoryFrame(storyIndex);
  scheduleNextFrame();
}

function showEndingFrame() {
  storyRunning = false;
  if (storyTimer) clearTimeout(storyTimer);

  storyImageEl.style.opacity = "0.3";
  storyImageEl.style.transform = "scale(1.02)";

  setTimeout(() => {
    endingTextEl.style.opacity = "1";
    endingTextEl.style.transform = "translateY(0) scale(1)";
    endingTextEl.classList.add("pulse");
  }, 400);
}

function resetToHeartMode() {
  storyRunning = false;
  storyPaused = false;
  clearTimeout(storyTimer);
  storyTimer = null;
  storyModeEl.classList.remove("active");
  // Restore heart-mode display (remove inline hiding fallback)
  heartModeEl.style.display = "";
  heartModeEl.classList.add("active");
  endingTextEl.classList.remove("pulse");
  endingTextEl.style.opacity = "0";
  progressBarEl.style.width = "0%";
}

playStoryBtn.addEventListener("click", () => {
  startStoryMode();
});

// Keyboard control
document.addEventListener("keydown", (e) => {
  if (!storyModeEl.classList.contains("active")) return;

  if (e.key === "ArrowRight") {
    // next
    storyPaused = true;
    clearTimeout(storyTimer);
    showStoryFrame(storyIndex + 1);
  } else if (e.key === "ArrowLeft") {
    // prev
    storyPaused = true;
    clearTimeout(storyTimer);
    showStoryFrame(storyIndex - 1);
  } else if (e.key === " " || e.code === "Space") {
    // pause/resume
    e.preventDefault();
    storyPaused = !storyPaused;
    if (!storyPaused) {
      scheduleNextFrame();
    } else {
      clearTimeout(storyTimer);
    }
  } else if (e.key === "Enter") {
    resetToHeartMode();
  }
});

// Click ending text để quay lại
endingTextEl.addEventListener("click", () => {
  resetToHeartMode();
});

// ===============================
// REACTION BUBBLES (Like & Heart)
// ===============================
function createGlowEffect(color) {
  const glow = document.createElement("div");
  glow.className = "fullscreen-glow";
  glow.style.setProperty("--glow-color", color);
  document.body.appendChild(glow);

  void glow.offsetWidth; // Trigger reflow
  glow.classList.add("animate-glow");

  glow.addEventListener("animationend", () => {
    glow.remove();
  });
}

function spawnReactionBubbles(options) {
  const {
    emoji = "❤",
    baseX = window.innerWidth / 2,
    baseY = window.innerHeight / 2,
    count = 10,
  } = options;

  for (let i = 0; i < count; i++) {
    const bubble = document.createElement("div");
    bubble.className = "reaction-bubble";
    bubble.textContent = emoji;

    const offsetX = (Math.random() - 0.5) * 120;
    const offsetY = (Math.random() - 0.3) * 40;

    bubble.style.left = `${baseX + offsetX}px`;
    bubble.style.top = `${baseY + offsetY}px`;
    bubble.style.animationDuration = `${650 + Math.random() * 500}ms`;

    reactionLayerEl.appendChild(bubble);

    bubble.addEventListener("animationend", () => {
      bubble.remove();
    });
  }
}

btnLike.addEventListener("click", (e) => {
  const rect = e.currentTarget.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  createGlowEffect("rgba(255, 92, 138, 0.7)");
  spawnReactionBubbles({
    emoji: "👍",
    baseX: centerX,
    baseY: centerY,
    count: 14,
  });
});

btnHeart.addEventListener("click", (e) => {
  const rect = e.currentTarget.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  createGlowEffect("rgba(255, 46, 99, 0.8)");
  spawnReactionBubbles({
    emoji: "❤",
    baseX: centerX,
    baseY: centerY,
    count: 16,
  });
});

// Story mode reaction buttons
btnLikeStory.addEventListener("click", (e) => {
  const rect = e.currentTarget.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  createGlowEffect("rgba(255, 92, 138, 0.7)");
  spawnReactionBubbles({
    emoji: "👍",
    baseX: centerX,
    baseY: centerY,
    count: 14,
  });
});

btnHeartStory.addEventListener("click", (e) => {
  const rect = e.currentTarget.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  createGlowEffect("rgba(255, 46, 99, 0.8)");
  spawnReactionBubbles({
    emoji: "❤",
    baseX: centerX,
    baseY: centerY,
    count: 16,
  });
});
