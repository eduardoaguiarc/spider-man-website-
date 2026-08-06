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
const frames = [];
const playhead = { frame: 0 };
let lastDrawnFrame = -1;

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
    end: "+=300%",
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
  }, 7.5);

window.addEventListener("resize", resizeCanvas);
window.addEventListener("load", () => {
  resizeCanvas();
  ScrollTrigger.refresh();
});

resizeCanvas();
