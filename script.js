const FRAME_COUNT = 74;
const FRAME_PATH = (index) => `assets/frames/img-${String(index + 1).padStart(2, "0")}.webp`;

gsap.registerPlugin(ScrollTrigger, ScrollSmoother, SplitText);

const smoother = ScrollSmoother.create({
  wrapper: "#smooth-wrapper",
  content: "#smooth-content",
  smooth: 1.2,
  smoothTouch: 0.1,
  effects: true
});

const canvas = document.querySelector(".stage__sequence");
const stage = document.querySelector(".stage");
const context = canvas.getContext("2d");
const trailerReveal = document.querySelector(".trailer-reveal");
const trailerVideo = document.querySelector(".trailer-video");
const trailerPlayer = document.querySelector(".trailer-player");
const mainToggle = document.querySelector(".trailer-player__main-toggle");
const controlsToggle = document.querySelector(".trailer-player__toggle");
const progressControl = document.querySelector(".trailer-player__progress");
const currentTimeLabel = document.querySelector(".trailer-player__current");
const durationLabel = document.querySelector(".trailer-player__duration");
const muteToggle = document.querySelector(".trailer-player__mute");
const fullscreenToggle = document.querySelector(".trailer-player__fullscreen");
const frames = [];
const playhead = { frame: 0 };
let lastDrawnFrame = -1;
let trailerStarted = false;

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return "0:00";

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainingSeconds}`;
}

function updatePlayerState() {
  const isPlaying = trailerStarted && !trailerVideo.paused;
  trailerPlayer.classList.toggle("is-playing", isPlaying);
  mainToggle.setAttribute("aria-label", isPlaying ? "Pausar trailer" : "Reproduzir trailer");
  controlsToggle.setAttribute("aria-label", isPlaying ? "Pausar trailer" : "Reproduzir trailer");
}

function updateMuteState() {
  muteToggle.querySelector("span").textContent = trailerVideo.muted ? "MUDO" : "SOM";
  muteToggle.setAttribute("aria-label", trailerVideo.muted ? "Ativar som" : "Desativar som");
}

function updateDuration() {
  durationLabel.textContent = formatTime(trailerVideo.duration);
}

async function toggleTrailer() {
  if (!trailerStarted) {
    trailerStarted = true;
    trailerVideo.loop = false;
    trailerVideo.currentTime = 0;
    trailerVideo.muted = false;
    await trailerVideo.play();
    updatePlayerState();
    return;
  }

  if (!trailerVideo.paused) {
    trailerVideo.pause();
  } else {
    await trailerVideo.play();
  }

  updatePlayerState();
}

mainToggle.addEventListener("click", toggleTrailer);
controlsToggle.addEventListener("click", toggleTrailer);

trailerVideo.addEventListener("loadedmetadata", updateDuration);
trailerVideo.addEventListener("durationchange", updateDuration);
trailerVideo.addEventListener("volumechange", updateMuteState);

trailerVideo.addEventListener("timeupdate", () => {
  currentTimeLabel.textContent = formatTime(trailerVideo.currentTime);
  progressControl.value = trailerVideo.duration
    ? Math.round((trailerVideo.currentTime / trailerVideo.duration) * 1000)
    : 0;
});

trailerVideo.addEventListener("play", updatePlayerState);
trailerVideo.addEventListener("pause", updatePlayerState);
trailerVideo.addEventListener("ended", updatePlayerState);

progressControl.addEventListener("input", () => {
  if (trailerVideo.duration) {
    trailerVideo.currentTime = (Number(progressControl.value) / 1000) * trailerVideo.duration;
  }
});

muteToggle.addEventListener("click", () => {
  trailerVideo.muted = !trailerVideo.muted;
});

fullscreenToggle.addEventListener("click", () => {
  if (document.fullscreenElement) {
    document.exitFullscreen();
  } else {
    trailerReveal.requestFullscreen();
  }
});

updateMuteState();

function resizeCanvas() {
  const { width, height } = stage.getBoundingClientRect();
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

  canvas.width = Math.round(width * pixelRatio);
  canvas.height = Math.round(height * pixelRatio);
  lastDrawnFrame = -1;
  drawFrame();
}

function drawFrame() {
  const frameIndex = Math.round(playhead.frame);
  const image = frames[frameIndex];

  if (!image || !image.complete || !image.naturalWidth || frameIndex === lastDrawnFrame) return;

  const canvasWidth = canvas.width;
  const canvasHeight = canvas.height;
  const imageRatio = image.naturalWidth / image.naturalHeight;
  const canvasRatio = canvasWidth / canvasHeight;

  let drawWidth;
  let drawHeight;
  let offsetX;
  let offsetY;

  if (imageRatio > canvasRatio) {
    drawHeight = canvasHeight;
    drawWidth = drawHeight * imageRatio;
    offsetX = (canvasWidth - drawWidth) / 2;
    offsetY = 0;
  } else {
    drawWidth = canvasWidth;
    drawHeight = drawWidth / imageRatio;
    offsetX = 0;
    offsetY = (canvasHeight - drawHeight) / 2;
  }

  context.clearRect(0, 0, canvasWidth, canvasHeight);
  context.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
  lastDrawnFrame = frameIndex;
}

for (let index = 0; index < FRAME_COUNT; index += 1) {
  const image = new Image();
  image.decoding = "async";
  image.src = FRAME_PATH(index);
  image.addEventListener("load", () => {
    if (index === 0 || index === Math.round(playhead.frame)) {
      lastDrawnFrame = -1;
      drawFrame();
    }
  });
  frames.push(image);
}

const descriptions = gsap.utils.toArray(".movie__desc");
const splitDescriptions = descriptions.map((description) =>
  SplitText.create(description, {
    type: "words,chars",
    wordsClass: "movie__word",
    charsClass: "movie__char"
  })
);

gsap.set(descriptions, { visibility: "visible" });
gsap.set(splitDescriptions[0].chars, { autoAlpha: 1 });
gsap.set(splitDescriptions[1].chars, { autoAlpha: 0 });
gsap.set(splitDescriptions[2].chars, { autoAlpha: 0 });

const randomFade = {
  amount: 1.25,
  from: "random"
};

const heroTimeline = gsap.timeline({
  defaults: { ease: "none" },
  scrollTrigger: {
    trigger: ".hero",
    start: "top top",
    end: "+=510%",
    scrub: 0.6,
    pin: true,
    anticipatePin: 1,
    invalidateOnRefresh: true
  }
});

heroTimeline
  .to(playhead, {
    frame: FRAME_COUNT - 1,
    duration: 10,
    snap: "frame",
    onUpdate: drawFrame
  }, 0)
  .to(splitDescriptions[0].chars, {
    autoAlpha: 0,
    duration: 1.25,
    stagger: randomFade
  }, 0)
  .to(splitDescriptions[1].chars, {
    autoAlpha: 1,
    duration: 1.25,
    stagger: randomFade
  }, 1.25)
  .to(splitDescriptions[1].chars, {
    autoAlpha: 0,
    duration: 1.25,
    stagger: randomFade
  }, 6.25)
  .to(splitDescriptions[2].chars, {
    autoAlpha: 1,
    duration: 1.25,
    stagger: randomFade
  }, 7.5)
  .to(trailerReveal, {
    width: "100vw",
    height: "100vh",
    duration: 5
  }, 10)
  .to(".movie__title", {
    xPercent: -120,
    duration: 2.75
  }, 12.25)
  .to(".movie__copy", {
    xPercent: 120,
    duration: 2.75
  }, 12.25)
  .to(trailerPlayer, {
    autoAlpha: 1,
    pointerEvents: "auto",
    duration: 0.1
  }, 14.9)
  .to({}, { duration: 2 }, 15);

const castPortraits = gsap.utils.toArray(".cast__portrait");
const castPeople = gsap.utils.toArray(".cast__person-content");
const castItems = gsap.utils.toArray(".cast__item");
const castDots = gsap.utils.toArray(".cast__dot");
const castProgress = document.querySelector(".cast__progress");
const castSpider = document.querySelector(".cast__spider");
const CAST_TRANSITIONS = castPortraits.length - 1;
let currentCastIndex = -1;

function updateActiveCast(index) {
  if (index === currentCastIndex) return;

  currentCastIndex = index;

  castPeople.forEach((person, personIndex) => {
    const isActive = personIndex === index;
    person.classList.toggle("cast__person-content--active", isActive);
    person.setAttribute("aria-hidden", isActive ? "false" : "true");
  });

  castItems.forEach((item, itemIndex) => {
    const isActive = itemIndex === index;
    item.classList.toggle("cast__item--active", isActive);

    if (isActive) {
      item.setAttribute("aria-current", "true");
    } else {
      item.removeAttribute("aria-current");
    }
  });

  castDots.forEach((dot, dotIndex) => {
    dot.classList.toggle("cast__dot--active", dotIndex <= index);
  });
}

gsap.set(castPortraits.slice(1), { height: 0 });
gsap.set(castPeople.slice(1), { autoAlpha: 0, yPercent: 45 });
updateActiveCast(0);

const castTimeline = gsap.timeline({
  defaults: { ease: "none" },
  scrollTrigger: {
    trigger: ".cast",
    start: "top top",
    end: `+=${CAST_TRANSITIONS * 100}%`,
    scrub: 0.55,
    pin: true,
    anticipatePin: 1,
    invalidateOnRefresh: true
  },
  onUpdate() {
    const index = Math.min(
      castPortraits.length - 1,
      Math.round(this.progress() * CAST_TRANSITIONS)
    );
    updateActiveCast(index);
  }
});

castTimeline
  .to(castProgress, { scaleY: 1, duration: CAST_TRANSITIONS }, 0)
  .to(castSpider, {
    y: () => Math.max(0, document.querySelector(".cast__indicator").clientHeight - castSpider.clientHeight),
    duration: CAST_TRANSITIONS
  }, 0);

for (let index = 1; index < castPortraits.length; index += 1) {
  const transitionStart = index - 1;

  castTimeline
    .to(castPortraits[index], {
      height: "100%",
      duration: 0.72
    }, transitionStart + 0.14)
    .to(castPeople[index - 1], {
      autoAlpha: 0,
      yPercent: -45,
      duration: 0.34
    }, transitionStart + 0.3)
    .to(castPeople[index], {
      autoAlpha: 1,
      yPercent: 0,
      duration: 0.34
    }, transitionStart + 0.36);
}

window.addEventListener("resize", resizeCanvas);
window.addEventListener("load", () => {
  resizeCanvas();
  ScrollTrigger.refresh();
});

resizeCanvas();
