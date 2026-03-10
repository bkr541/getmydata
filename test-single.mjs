import { chromium } from 'playwright-extra';
// @ts-ignore
import stealth from 'puppeteer-extra-plugin-stealth';

chromium.use(stealth());

const targetUrl = 'https://frontier-gowild-gamma.vercel.app/api/flights/single?origin=ATL&destination=DEN&date=2026-03-10';
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoyOTQ4LCJlbWFpbCI6ImtvZHlyb2JpbnNvbjAyQGdtYWlsLmNvbSIsImV4cCI6MTc3NDM0ODEwOCwiaWF0IjoxNzcxNzU2MTA4fQ.PfWc26pRP25u9SrX4MINas9BWMzxu8qZtNleqzm8kPY';

async function test() {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    console.log('Passing security check...');
    await page.goto('https://frontier-gowild-gamma.vercel.app/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    console.log('Fetching /single payload...');
    const data = await page.evaluate(async ({ url, token }) => {
        try {
            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            return await res.json();
        } catch (e) {
            return e.toString();
        }
    }, { url: targetUrl, token });

    console.log('Result:', JSON.stringify(data).slice(0, 500));
    await browser.close();
}

test().catch(console.error);
