import express from 'express';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

puppeteer.use(StealthPlugin());

const app = express();
const __dirname = dirname(fileURLToPath(import.meta.url));

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

let browser;

async function getBrowser() {
  if (!browser) {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920,1080',
        '--disable-web-security'
      ]
    });
  }
  return browser;
}

app.post('/proxy', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ success: false, error: 'No URL provided' });

  console.log(`[😈 X BROWSER] Warping to: ${url}`);

  try {
    const browserInstance = await getBrowser();
    const page = await browserInstance.newPage();

    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1920, height: 1080 });

    await page.goto(url, { 
      waitUntil: 'networkidle2', 
      timeout: 60000 
    });

    const html = await page.content();

    const proxyPath = `/view/${Date.now()}`;
    
    app.get(proxyPath, (req, res) => {
      res.send(html);
    });

    res.json({
      success: true,
      proxyUrl: proxyPath
    });

    setTimeout(() => page.close().catch(() => {}), 480000);

  } catch (err) {
    console.error("[BR0KE🔓] Warp failed:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[😈 GR0K😈] X Browser — Interstellar Edition running on port ${PORT}`);
});