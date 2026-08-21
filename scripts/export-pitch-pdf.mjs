import puppeteer from 'puppeteer';
import { execSync } from 'child_process';
import { mkdirSync } from 'fs';

const BASE_URL = 'http://localhost:5000';
const TOTAL_SLIDES = 6;
const OUTPUT_PATH = 'Uprosper_Pitch_Deck.pdf';
const TEMP_DIR = '/tmp/pitch_slides';

async function exportPitchDeck() {
  mkdirSync(TEMP_DIR, { recursive: true });

  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 2 });

  for (let i = 1; i <= TOTAL_SLIDES; i++) {
    const url = `${BASE_URL}/pitch/${i}`;
    console.log(`Capturing slide ${i}/${TOTAL_SLIDES}: ${url}`);

    await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));

    await page.screenshot({
      path: `${TEMP_DIR}/slide_${i}.png`,
      fullPage: false,
      clip: { x: 0, y: 0, width: 1280, height: 720 },
    });

    console.log(`  ✓ Slide ${i} screenshot saved`);
  }

  await browser.close();
  console.log('\nAll screenshots captured. Converting to PDF...');

  const slideImages = Array.from({ length: TOTAL_SLIDES }, (_, i) => `${TEMP_DIR}/slide_${i + 1}.png`).join(' ');

  execSync(
    `convert ${slideImages} -gravity center -background white -extent 1280x720 ${OUTPUT_PATH}`,
    { stdio: 'inherit' }
  );

  console.log(`\n✓ PDF saved: ${OUTPUT_PATH}`);
}

exportPitchDeck().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
