# Flight Search Application

A clean, modern React/Next.js application that enables users to search for flights using Origin IATA, Destination IATA, and Departure Date.

## Features
- **Polished UI**: Vanilla CSS implementation utilizing modern design principles, gradients, card-based layouts, and micro-animations.
- **Client-Side Validation**: Robust form checking ensures 3-letter IATA codes, distinct origin and destination, and prevents empty dates. 
- **Developer-Friendly Backend**: A structured backend services layer built on Next.js Route Handlers.
- **Bonus Capabilities**: Saves recent searches locally, allows swapping Origin/Destination, and features simple "Copy JSON" action with expandable payload viewer.

## Architecture

1. **Frontend Request Flow**:
   - The user inputs values into `SearchForm.tsx`.
   - On submit, exact input values (`origin`, `destination`, `departureDate`) are validated.
   - Values are packaged into a JSON request body and `POST`ed client-side to `/api/flights/search`.
2. **Backend Processing Flow**:
   - Next.js acts as the API host. `src/app/api/flights/search/route.ts` receives the payload.
   - The API validates the body and passes the exact parameters to the `searchFlights` orchestrator in `src/services/flightProvider.ts`.
   - The orchestrator delegates the retrieval action to either the `mockProvider` or a `customScraperProvider`.
   - Results are normalized to a consistent `FlightResult` format and returned.

## Swapping Providers (Adding Real Flight Retrieval)

Currently, the application runs on a mock provider that returns simulated results. To plug in a real data source or web scraper:

1. Navigate to **`src/services/providers/customScraperProvider.ts`**.
2. Follow the detailed `TODO` comments to implement your network retrieval logic (e.g. `fetch`, Puppeteer, Playwright).
   - This keeps scraper logic, authentications, anti-bot mechanisms, headers, and parsing entirely on the backend.
3. Keep the payload mapping consistent with the unified `FlightResult` interface.
4. Go to **`src/services/flightProvider.ts`** and change the default provider parameter from `'mock'` to `'customScraper'`.

```typescript
// src/services/flightProvider.ts
export async function searchFlights(
  query: FlightSearchQuery,
  provider: FlightProviderMethod = 'customScraper' // Switched from 'mock'
)
```

## Running Locally

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
