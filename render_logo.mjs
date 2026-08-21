import { createCanvas } from 'canvas';
import { writeFileSync } from 'fs';

const SIZE = 1024;
const canvas = createCanvas(SIZE, SIZE);
const ctx = canvas.getContext('2d');

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function housePath(ctx, cx, topY, wallWidth, wallHeight) {
  const halfW = wallWidth / 2;
  const bodyTop = topY + (halfW * 0.68);
  const bodyBottom = bodyTop + wallHeight;
  const cornerR = 36;
  const roofCornerR = 30;
  ctx.beginPath();
  ctx.moveTo(cx, topY);
  // Right roof slope, smooth into right wall
  ctx.lineTo(cx + halfW - roofCornerR, bodyTop - roofCornerR * 0.3);
  ctx.quadraticCurveTo(cx + halfW, bodyTop, cx + halfW, bodyTop + roofCornerR);
  // Right wall down to bottom-right corner
  ctx.lineTo(cx + halfW, bodyBottom - cornerR);
  ctx.quadraticCurveTo(cx + halfW, bodyBottom, cx + halfW - cornerR, bodyBottom);
  // Floor
  ctx.lineTo(cx - halfW + cornerR, bodyBottom);
  // Bottom-left corner
  ctx.quadraticCurveTo(cx - halfW, bodyBottom, cx - halfW, bodyBottom - cornerR);
  // Left wall up
  ctx.lineTo(cx - halfW, bodyTop + roofCornerR);
  // Smooth into left roof slope
  ctx.quadraticCurveTo(cx - halfW, bodyTop, cx - halfW + roofCornerR, bodyTop - roofCornerR * 0.3);
  ctx.closePath();
}

const cr = 195;

roundRect(ctx, 0, 0, SIZE, SIZE, cr);
ctx.save();
ctx.clip();

// Base: darker gradient (the bottom-right portion)
const bgGrad = ctx.createLinearGradient(0, 0, SIZE, SIZE);
bgGrad.addColorStop(0, '#4eca8a');
bgGrad.addColorStop(0.4, '#3dba7a');
bgGrad.addColorStop(0.7, '#30a86c');
bgGrad.addColorStop(1, '#28965e');
ctx.fillStyle = bgGrad;
ctx.fillRect(0, 0, SIZE, SIZE);

// Depth: darken bottom-right
const depthBR = ctx.createLinearGradient(0, 0, SIZE, SIZE);
depthBR.addColorStop(0, 'rgba(0,0,0,0)');
depthBR.addColorStop(0.55, 'rgba(0,0,0,0)');
depthBR.addColorStop(1, 'rgba(0,25,25,0.20)');
ctx.fillStyle = depthBR;
ctx.fillRect(0, 0, SIZE, SIZE);

// Now draw the lighter top-left area with a clear curved boundary
// Covers only ~20% of top-left, curve bows upward (reversed direction)
ctx.save();
ctx.beginPath();
ctx.moveTo(0, 0);
ctx.lineTo(SIZE, 0);
ctx.lineTo(SIZE, SIZE * 0.08);
ctx.bezierCurveTo(
  SIZE * 0.65, SIZE * 0.04,
  SIZE * 0.35, SIZE * 0.18,
  0, SIZE * 0.35
);
ctx.closePath();

// Fill with a distinctly lighter shade
const lightGrad = ctx.createLinearGradient(0, 0, SIZE * 0.5, SIZE * 0.5);
lightGrad.addColorStop(0, '#78e8a4');
lightGrad.addColorStop(0.5, '#60dc94');
lightGrad.addColorStop(1, '#50d088');
ctx.fillStyle = lightGrad;
ctx.fill();
ctx.restore();

// Subtle glass glow on top of that
const glassGlow = ctx.createRadialGradient(
  SIZE * 0.25, SIZE * 0.18, SIZE * 0.01,
  SIZE * 0.35, SIZE * 0.30, SIZE * 0.45
);
glassGlow.addColorStop(0, 'rgba(255,255,255,0.30)');
glassGlow.addColorStop(0.3, 'rgba(255,255,255,0.10)');
glassGlow.addColorStop(0.6, 'rgba(255,255,255,0.02)');
glassGlow.addColorStop(1, 'rgba(255,255,255,0)');
ctx.fillStyle = glassGlow;
ctx.fillRect(0, 0, SIZE, SIZE);

// Inner border glow
roundRect(ctx, 2, 2, SIZE - 4, SIZE - 4, cr - 1);
ctx.strokeStyle = 'rgba(255,255,255,0.12)';
ctx.lineWidth = 2.5;
ctx.stroke();

// House with £ cutout
const cx = SIZE / 2;
const houseTop = SIZE * 0.22;
const wallW = SIZE * 0.55;
const wallH = SIZE * 0.38;
const halfW = wallW / 2;
const bodyTop = houseTop + (halfW * 0.68);
const bodyBottom = bodyTop + wallH;
const poundCenterY = (bodyTop + bodyBottom) / 2 - 15;
const poundX = cx;
const fontSize = 270;

const houseCanvas = createCanvas(SIZE, SIZE);
const hctx = houseCanvas.getContext('2d');

housePath(hctx, cx, houseTop, wallW, wallH);
hctx.fillStyle = 'white';
hctx.fill();

hctx.globalCompositeOperation = 'destination-out';
hctx.font = `bold ${fontSize}px Arial, Helvetica, sans-serif`;
hctx.textAlign = 'center';
hctx.textBaseline = 'middle';
hctx.fillStyle = 'black';
hctx.fillText('£', poundX, poundCenterY);

hctx.globalCompositeOperation = 'source-atop';
hctx.shadowColor = 'rgba(0, 25, 15, 0.45)';
hctx.shadowBlur = 10;
hctx.shadowOffsetX = 4;
hctx.shadowOffsetY = 5;
hctx.font = `bold ${fontSize}px Arial, Helvetica, sans-serif`;
hctx.textAlign = 'center';
hctx.textBaseline = 'middle';
hctx.fillStyle = 'rgba(0,0,0,0)';
hctx.fillText('£', poundX, poundCenterY);

ctx.save();
ctx.shadowColor = 'rgba(0, 30, 25, 0.20)';
ctx.shadowBlur = 18;
ctx.shadowOffsetX = 5;
ctx.shadowOffsetY = 7;
ctx.drawImage(houseCanvas, 0, 0);
ctx.restore();

ctx.restore();

const buffer = canvas.toBuffer('image/png');
writeFileSync('/tmp/logo_v10.png', buffer);
console.log('Logo v10 rendered!');
