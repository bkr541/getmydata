import { chromium } from 'playwright-extra';
import stealth from 'puppeteer-extra-plugin-stealth';

chromium.use(stealth());

const targetUrl = 'https://frontier-gowild-gamma.vercel.app/api/flights/search/stream?origin=ATL&date=2026-03-10&max_workers=3&token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoyOTQ4LCJlbWFpbCI6ImtvZHlyb2JpbnNvbjAyQGdtYWlsLmNvbSIsImV4cCI6MTc3NDM0ODEwOCwiaWF0IjoxNzcxNzU2MTA4fQ.PfWc26pRP25u9SrX4MINas9BWMzxu8qZtNleqzm8kPY';

async function test() {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    console.log('Navigating to root to pass security check...');
    await page.goto('https://frontier-gowild-gamma.vercel.app/', { waitUntil: 'domcontentloaded' });

    // Wait a moment for any challenge to pass
    await page.waitForTimeout(3000);

    console.log('Fetching stream within browser context...');

    const streamData = await page.evaluate(async (url) => {
        try {
            const res = await fetch(url);
            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let fullText = '';

            // Read a few chunks to see the data
            for (let i = 0; i < 3; i++) {
                const { done, value } = await reader.read();
                if (done) break;
                fullText += decoder.decode(value);
            }
            return fullText;
        } catch (e) {
            return e.toString();
        }
    }, targetUrl);

    console.log('Stream chunk preview:');
    console.log(streamData);

    await browser.close();
}

test().catch(console.error);
