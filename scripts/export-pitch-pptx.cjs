const puppeteer = require("puppeteer");
const PptxGenJS = require("pptxgenjs");
const fs = require("fs");
const path = require("path");

const BASE_URL = "http://localhost:5000";
const OUTPUT_DIR = path.join(__dirname, "..", "pitch-exports");
const PPTX_PATH = path.join(OUTPUT_DIR, "Uprosper-Pitch-Deck.pptx");

const SLIDE_NAMES = [
  "1-problem",
  "2-solution",
  "3-product-client",
  "4-target-market",
  "5-business-model",
  "6-traction",
  "7-ask",
];

const HIDE_NAV_CSS = `
  [data-testid="button-prev-slide"],
  [data-testid="button-next-slide"],
  [data-testid^="dot-slide-"],
  [data-testid="button-download-slide"] {
    display: none !important;
  }
  /* Hide the bottom nav bar containers */
  .flex.items-center.justify-between.pt-6.pb-4,
  .flex.items-center.justify-between.pt-8.pb-4,
  .flex.items-center.justify-between.px-6.py-4 {
    display: none !important;
  }
  /* Hide download button container in header */
  [data-testid="button-download-slide"] {
    display: none !important;
  }
  /* Force the page to exactly fill viewport with no scroll */
  html, body {
    overflow: hidden !important;
    height: 100vh !important;
    margin: 0 !important;
    padding: 0 !important;
  }
  /* Ensure min-h-screen elements fit exactly */
  .min-h-screen {
    min-height: 100vh !important;
    max-height: 100vh !important;
    overflow: hidden !important;
  }
`;

(async () => {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--font-render-hinting=none",
    ],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1080, deviceScaleFactor: 3 });

  const pngPaths = [];

  for (let i = 0; i < SLIDE_NAMES.length; i++) {
    const slideNum = i + 1;
    const url = `${BASE_URL}/pitch/${slideNum}`;
    console.log(`Capturing slide ${slideNum} (${SLIDE_NAMES[i]})...`);

    await page.goto(url, { waitUntil: "networkidle0", timeout: 30000 });
    await page.addStyleTag({ content: HIDE_NAV_CSS });
    await new Promise((r) => setTimeout(r, 2000));

    const filePath = path.join(OUTPUT_DIR, `slide-${SLIDE_NAMES[i]}.png`);
    await page.screenshot({ path: filePath, fullPage: false, type: "png" });
    pngPaths.push(filePath);
    console.log(`  Saved: ${filePath}`);
  }

  await browser.close();
  console.log("\nAll slides captured. Building PowerPoint...");

  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: "4x3", width: 10, height: 7.5 });
  pptx.layout = "4x3";
  pptx.title = "Uprosper Pitch Deck";
  pptx.subject = "Investor Pitch";
  pptx.author = "Uprosper";

  for (const pngPath of pngPaths) {
    const slide = pptx.addSlide();
    const imgData = fs.readFileSync(pngPath);
    const base64 = imgData.toString("base64");
    const ext = "png";
    slide.addImage({
      data: `image/${ext};base64,${base64}`,
      x: 0,
      y: 0,
      w: "100%",
      h: "100%",
    });
  }

  await pptx.writeFile({ fileName: PPTX_PATH });
  console.log(`\nPowerPoint saved: ${PPTX_PATH}`);
})();
