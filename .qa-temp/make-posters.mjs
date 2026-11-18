import fs from 'node:fs';
import { chromium } from 'playwright';

const BASE = process.env.PERF_BASE_URL ?? 'http://localhost:3011';
const outDir = 'public/videos/instagram';
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 400, height: 700 } });
await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded', timeout: 120000 });

for (let i = 1; i <= 7; i += 1) {
  const src = `/videos/instagram/reel-0${i}.mp4`;
  const dataUrl = await page.evaluate(async (videoSrc) => {
    const video = document.createElement('video');
    video.src = videoSrc;
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';
    video.crossOrigin = 'anonymous';
    document.body.appendChild(video);

    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('video load timeout')), 60000);
      video.addEventListener('loadeddata', () => {
        clearTimeout(timeout);
        resolve();
      });
      video.addEventListener('error', () => {
        clearTimeout(timeout);
        reject(new Error('video load error'));
      });
    });

    const target = video.duration > 1.2 ? 0.8 : Math.min(0.2, video.duration / 2);
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('seek timeout')), 30000);
      video.addEventListener('seeked', () => {
        clearTimeout(timeout);
        resolve();
      });
      video.currentTime = target;
    });

    const width = 360;
    const height = Math.round((video.videoHeight / video.videoWidth) * width) || 640;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.getContext('2d').drawImage(video, 0, 0, width, height);
    video.remove();
    return canvas.toDataURL('image/jpeg', 0.82);
  }, src);

  const buffer = Buffer.from(dataUrl.split(',')[1], 'base64');
  const file = `${outDir}/poster-0${i}.jpg`;
  fs.writeFileSync(file, buffer);
  console.log(`${file} ${buffer.length} bytes`);
}

await browser.close();
