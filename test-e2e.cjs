const puppeteer = require('puppeteer');

(async () => {
  console.log('Launching headless Chromium test...');
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/chromium',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 1000 });

  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', err => console.error('BROWSER ERROR:', err));

  console.log('Navigating to http://127.0.0.1:5173/ ...');
  await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle2' });

  // Wait 1s for initial setup and sample load
  await new Promise(r => setTimeout(r, 1000));

  console.log('Triggering "Run All Models Benchmark"...');
  await page.click('#btn-run-all');

  // Wait 5 seconds for models to process
  console.log('Waiting for models to process...');
  await new Promise(r => setTimeout(r, 5000));

  // Take full benchmark screenshot
  await page.screenshot({ path: 'screenshot_benchmark.png', fullPage: true });
  console.log('Saved screenshot_benchmark.png');

  // Click spectrogram tab on RNNoise card
  const specTab = await page.$('#card-rnnoise .vis-tab[data-tab="spectrogram"]');
  if (specTab) {
    await specTab.click();
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: 'screenshot_spectrogram.png' });
    console.log('Saved screenshot_spectrogram.png');
  }

  // Switch to Live Mic tab
  console.log('Switching to Live Interview Mic tab...');
  await page.click('.nav-tab[data-tab="live_mic"]');
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: 'screenshot_mic.png' });
  console.log('Saved screenshot_mic.png');

  // Switch to Candidate Speech Enhancer tab
  console.log('Switching to Candidate Speech Enhancer tab...');
  await page.click('.nav-tab[data-tab="enhancer"]');
  await new Promise(r => setTimeout(r, 600));

  console.log('Triggering "Enhance Candidate Speech Now"...');
  await page.click('#btn-process-enhancement');
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: 'screenshot_enhancer.png', fullPage: true });
  console.log('Saved screenshot_enhancer.png');

  // Switch to Combination Flow tab
  console.log('Switching to Combination Flow tab...');
  await page.click('.nav-tab[data-tab="flow"]');
  await new Promise(r => setTimeout(r, 600));

  console.log('Testing "Download Config (JSON)" button...');
  await page.click('#btn-download-flow-json');
  await new Promise(r => setTimeout(r, 300));

  console.log('Testing "Export WebRTC Code (.ts)" button...');
  await page.click('#btn-download-flow-ts');
  await new Promise(r => setTimeout(r, 300));

  await page.screenshot({ path: 'screenshot_flow.png' });
  console.log('Saved screenshot_flow.png');


  // Switch to Guide tab
  console.log('Switching to Guide tab...');
  await page.click('.nav-tab[data-tab="guide"]');
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: 'screenshot_guide.png' });
  console.log('Saved screenshot_guide.png');

  await browser.close();
  console.log('Test completed successfully!');
})().catch(err => {
  console.error('Test script error:', err);
  process.exit(1);
});
