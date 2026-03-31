import { FlightResult, FlightSearchQuery } from '@/context/SearchContext';
import { mockSearchFlights } from './providers/mockProvider';
import { customSearchFlights } from './providers/customScraperProvider';

export type FlightProviderMethod = 'mock' | 'customScraper';

/**
 * Main orchestrator for flight retrieval.
 * Currently uses mockProvider, but can easily be swapped to use the customScraperProvider
 * once it is implemented.
 */
export async function searchFlights(
    query: FlightSearchQuery,
    provider: FlightProviderMethod = 'customScraper',
    token: string = ''
): Promise<FlightResult[]> {
    const { origin, destination, departureDate } = query;

    if (!origin || !departureDate) {
        throw new Error('Missing required search parameters (origin, departureDate)');
    }

    // Route to the appropriate provider
    // In production, you might determine this based on route pairs,
    // feature flags, or environment variables.
    switch (provider) {
        case 'customScraper':
            return customSearchFlights(origin, destination, departureDate, token);
        case 'mock':
        default:
            return mockSearchFlights(origin, destination, departureDate);
    }
}
