const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  console.log('🚀 Launching browser...');
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();

  await page.setViewport({ width: 1280, height: 720 });

  const filePath = path.resolve(__dirname, 'BizAI_Presentation.html');
  console.log('📂 Loading:', filePath);
  await page.goto('file:///' + filePath.replace(/\\/g, '/'), { waitUntil: 'networkidle0' });

  // Wait for fonts
  await new Promise(r => setTimeout(r, 2000));

  const outPath = path.resolve(__dirname, 'BizAI_Presentation.pdf');
  await page.pdf({
    path: outPath,
    width:  '1280px',
    height: '720px',
    printBackground: true,
    pageRanges: '',
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
  });

  await browser.close();
  console.log('✅ PDF saved to:', outPath);
})();
