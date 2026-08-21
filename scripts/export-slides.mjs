import puppeteer from "puppeteer";
import sharp from "sharp";
import { mkdirSync, existsSync } from "fs";
import { resolve, join } from "path";

const SLIDE_SLUGS = [
  "title",
  "problem",
  "solution",
  "market",
  "competition",
  "product",
  "business-model",
  "roadmap",
  "team",
  "ask",
  "sources",
];

const BASE_URL = process.env.BASE_URL || "http://localhost:5000";
const PADDING = 30;
const OUTPUT_DIR = resolve("exports");
const VIEWPORT_WIDTH = 1280;
const VIEWPORT_HEIGHT = 900;

async function exportSlide(browser, slideNum) {
  const slug = SLIDE_SLUGS[slideNum - 1];
  const url = `${BASE_URL}/pitch/${slideNum}`;
  console.log(`[Slide ${slideNum}/${SLIDE_SLUGS.length}] Capturing "${slug}" from ${url}...`);

  const page = await browser.newPage();
  await page.setViewport({ width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT, deviceScaleFactor: 2 });

  await page.goto(url, { waitUntil: "networkidle0", timeout: 30000 });

  await page.waitForSelector("#pitch-slide-content", { timeout: 10000 });

  await page.addStyleTag({
    content: `
      #pitch-slide-content > div:first-child { display: none !important; }
      body { background: white !important; }
      body > .fixed { position: absolute !important; }
    `,
  });

  await new Promise((r) => setTimeout(r, 500));

  const element = await page.$("#pitch-slide-content");
  if (!element) {
    console.error(`  Could not find #pitch-slide-content for slide ${slideNum}`);
    await page.close();
    return null;
  }

  const screenshotBuffer = await element.screenshot({ type: "png", omitBackground: false });

  const metadata = await sharp(screenshotBuffer).metadata();
  const paddedBuffer = await sharp({
    create: {
      width: metadata.width + PADDING * 2,
      height: metadata.height + PADDING * 2,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .composite([{ input: screenshotBuffer, left: PADDING, top: PADDING }])
    .png()
    .toBuffer();

  const filename = `slide-${slideNum}-${slug}.png`;
  const outputPath = join(OUTPUT_DIR, filename);
  await sharp(paddedBuffer).toFile(outputPath);

  const finalMeta = await sharp(paddedBuffer).metadata();
  console.log(`  Saved: ${filename} (${finalMeta.width}x${finalMeta.height})`);

  await page.close();
  return outputPath;
}

async function main() {
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const args = process.argv.slice(2);
  let slidesToExport;

  if (args.length > 0) {
    slidesToExport = args.map(Number).filter((n) => n >= 1 && n <= SLIDE_SLUGS.length);
  } else {
    slidesToExport = SLIDE_SLUGS.map((_, i) => i + 1);
  }

  console.log(`Exporting slides: ${slidesToExport.join(", ")}`);
  console.log(`Output directory: ${OUTPUT_DIR}`);
  console.log(`Padding: ${PADDING}px\n`);

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });

  const results = [];
  for (const slideNum of slidesToExport) {
    const path = await exportSlide(browser, slideNum);
    if (path) results.push(path);
  }

  await browser.close();

  console.log(`\nDone! Exported ${results.length} slide(s).`);
  return results;
}

main().catch((err) => {
  console.error("Export failed:", err);
  process.exit(1);
});
