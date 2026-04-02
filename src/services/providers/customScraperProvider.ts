import { FlightResult } from '@/context/SearchContext';
import { chromium } from 'playwright-extra';
// @ts-ignore - plugin stealth has no defs sometimes
import stealth from 'puppeteer-extra-plugin-stealth';

chromium.use(stealth());

/**
 * Custom scraper provider for the Vercel app stream.
 * Uses Playwright Stealth to bypass the Vercel security challenge,
 * then fetches the SSE data directly within the browser context.
 */
export async function customSearchFlights(
    origin: string,
    destination: string,
    departureDate: string,
    token: string
): Promise<FlightResult[]> {

    const isSingleEndpoint = !!destination;
    const destParam = destination ? destination.replace(/ /g, '+') : '';
    const targetUrl = isSingleEndpoint
        ? `https://gowilder.net/api/flights/single?origin=${origin}&destination=${destParam}&date=${departureDate}`
        : `https://gowilder.net/api/flights/search/stream?origin=${origin}&date=${departureDate}&max_workers=3`;

    let browser;
    try {
        console.log(`[Scraper] Initiating search: ${origin} to ${destination || 'anywhere'} on ${departureDate} (${isSingleEndpoint ? 'single' : 'stream'} endpoint)`);

        // Launch headless browser
        browser = await chromium.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--disable-gpu'
            ]
        });
        const context = await browser.newContext();
        const page = await context.newPage();

        // 1. Visit root to pass Vercel Security Checkpoint
        await page.goto('https://gowilder.net/', { waitUntil: 'domcontentloaded' });

        // Wait briefly for challenge to pass
        await new Promise(r => setTimeout(r, 2000));

        // 2. Fetch the stream from inside the page context
        const browserData = await page.evaluate(async ({ url, isSingle, token }) => {
            try {
                if (isSingle) {
                    const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
                    if (!res.ok) return `ERROR: Gowilder single responded ${res.status}`;
                    const data = await res.json();
                    return `JSON:${JSON.stringify(data)}`;
                } else {
                    const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
                    if (!res.ok) return `ERROR: Gowilder stream responded ${res.status}`;
                    const reader = res.body?.getReader();
                    if (!reader) throw new Error('No reader found');

                    const decoder = new TextDecoder();
                    let fullText = '';
                    let lastReadTime = Date.now();
                    let readPromise = reader.read();

                    // Read until stream ends OR we get no new data for 3 seconds
                    while (true) {
                        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), 10000));

                        try {
                            const { done, value } = await Promise.race([readPromise, timeoutPromise]) as any;
                            if (done) break;

                            fullText += decoder.decode(value);
                            lastReadTime = Date.now();
                            readPromise = reader.read(); // queue next read
                        } catch (e: any) {
                            if (e.message === 'TIMEOUT') {
                                if (fullText.includes('flights')) break;
                                break;
                            }
                            throw e;
                        }
                    }
                    return `SSE:${fullText}`;
                }
            } catch (e: any) {
                return `ERROR: ${e.toString()}`;
            }
        }, { url: targetUrl, isSingle: isSingleEndpoint, token });

        if (browserData.startsWith('ERROR:')) {
            throw new Error(`Browser fetch failed: ${browserData}`);
        }

        // 3. Parse the payload
        const results: FlightResult[] = [];
        const payloadFrames = [];

        if (browserData.startsWith('JSON:')) {
            payloadFrames.push(JSON.parse(browserData.substring(5)));
        } else if (browserData.startsWith('SSE:')) {
            const streamString = browserData.substring(4);
            const chunks = streamString.split('data: ');
            for (const chunk of chunks) {
                if (!chunk.trim() || chunk.trim().startsWith('event:')) continue;
                try {
                    const cleanJson = chunk.split('\nevent:')[0].trim();
                    payloadFrames.push(JSON.parse(cleanJson));
                } catch (e) { }
            }
        }

        for (const data of payloadFrames) {
            // Ensure this frame is for our selected destination (if provided/applicable)
            // The /single endpoint already filters for us, so bypass manual filter if isSingleEndpoint
            if ((!destination || isSingleEndpoint || data.destination === destination || data.destination_airports?.includes(destination)) && data.flights) {
                for (const f of data.flights) {

                    // Format time Helper
                    const formatTime = (isoString: string) => {
                        const d = new Date(isoString);
                        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    };

                    // Grab primary carrier from first segment
                    const airlineCode = f.segments && f.segments[0] ? f.segments[0].carrier_code : 'Unknown';
                    const fNum = f.segments && f.segments[0] ? f.segments[0].flight_number : '';

                    // Get best price (prefer go_wild or standard)
                    let cheapest = 0;
                    let cabin = 'Economy';
                    if (f.fares && f.fares.go_wild) {
                        cheapest = f.fares.go_wild.total;
                        cabin = 'Go Wild';
                    } else if (f.fares && f.fares.standard) {
                        cheapest = f.fares.standard.total;
                        cabin = 'Standard';
                    }

                    results.push({
                        id: `${airlineCode}${fNum}-${Date.now()}-${Math.random()}`,
                        airline: airlineCode === 'F9' ? 'Frontier' : airlineCode,
                        flightNumber: `${airlineCode}${fNum}`,
                        origin: f.origin || origin,
                        destination: f.destination || destination,
                        departureTime: formatTime(f.departure_time || f.segments?.[0]?.departure_time || departureDate),
                        arrivalTime: formatTime(f.arrival_time),
                        duration: f.total_trip_time,
                        stops: f.stops,
                        cabin: cabin,
                        price: cheapest,
                        currency: 'USD',
                        notes: Object.keys(f.fares || {}).join(', '),
                        rawPayload: f
                    });
                }
            }
        }

        return results;

    } catch (error: any) {
        console.error('[Scraper] Error fetching flights:', error);
        throw new Error(`Failed to retrieve flights: ${error.message || 'Unknown Custom Provider Error'}`);
    } finally {
        if (browser) await browser.close();
    }
}

export async function customInboundFlights(
    destination: string,
    departureDate: string,
    maxWorkers: number = 10,
    token: string = ''
): Promise<FlightResult[]> {

    const targetUrl = `https://gowilder.net/api/flights/inbound?destination=${destination}&date=${departureDate}&max_workers=${maxWorkers}`;

    let browser;
    try {
        console.log(`[Scraper] Initiating inbound search to ${destination} on ${departureDate}`);

        browser = await chromium.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--disable-gpu'
            ]
        });
        const context = await browser.newContext();
        const page = await context.newPage();

        await page.goto('https://gowilder.net/', { waitUntil: 'domcontentloaded' });
        await new Promise(r => setTimeout(r, 2000));

        const browserData = await page.evaluate(async ({ url, token }) => {
            try {
                const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
                const data = await res.json();
                return `JSON:${JSON.stringify(data)}`;
            } catch (e: any) {
                return `ERROR: ${e.toString()}`;
            }
        }, { url: targetUrl, token });

        if (browserData.startsWith('ERROR:')) {
            throw new Error(`Browser fetch failed: ${browserData}`);
        }

        const results: FlightResult[] = [];
        let parsedData;
        if (browserData.startsWith('JSON:')) {
            parsedData = JSON.parse(browserData.substring(5));
        }

        if (parsedData && parsedData.flights) {
            // flights is a dict mapping origin -> array of flights
            for (const originCode of Object.keys(parsedData.flights)) {
                for (const f of parsedData.flights[originCode]) {
                    const formatTime = (isoString: string) => {
                        const d = new Date(isoString);
                        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    };

                    const airlineCode = f.segments && f.segments[0] ? f.segments[0].carrier_code : 'Unknown';
                    const fNum = f.segments && f.segments[0] ? f.segments[0].flight_number : '';

                    let cheapest = 0;
                    let cabin = 'Economy';
                    if (f.fares && f.fares.go_wild) {
                        cheapest = f.fares.go_wild.total;
                        cabin = 'Go Wild';
                    } else if (f.fares && f.fares.standard) {
                        cheapest = f.fares.standard.total;
                        cabin = 'Standard';
                    }

                    results.push({
                        id: `${airlineCode}${fNum}-${Date.now()}-${Math.random()}`,
                        airline: airlineCode === 'F9' ? 'Frontier' : airlineCode,
                        flightNumber: `${airlineCode}${fNum}`,
                        origin: f.origin || originCode,
                        destination: f.destination || destination,
                        departureTime: formatTime(f.departure_time || f.segments?.[0]?.departure_time || departureDate),
                        arrivalTime: formatTime(f.arrival_time),
                        duration: f.total_trip_time,
                        stops: f.stops,
                        cabin: cabin,
                        price: cheapest,
                        currency: 'USD',
                        notes: Object.keys(f.fares || {}).join(', '),
                        rawPayload: f
                    });
                }
            }
        }

        return results;

    } catch (error: any) {
        console.error('[Scraper] Error fetching inbound flights:', error);
        throw new Error(`Failed to retrieve inbound flights: ${error.message || 'Unknown Custom Provider Error'}`);
    } finally {
        if (browser) await browser.close();
    }
}
