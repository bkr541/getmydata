import { FlightResult } from '@/context/SearchContext';

/**
 * A mock provider for development and testing.
 * Returns synthetic data after a short simulated delay.
 */
export async function mockSearchFlights(
    origin: string,
    destination: string,
    departureDate: string
): Promise<FlightResult[]> {

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Some synthetic data based on the request
    const mockFlights: FlightResult[] = [
        {
            id: `mock-1-${Date.now()}`,
            airline: 'Sample Airways',
            flightNumber: 'SA101',
            origin,
            destination,
            departureTime: '08:00 AM',
            arrivalTime: '11:30 AM',
            duration: '3h 30m',
            stops: 0,
            cabin: 'Economy',
            price: 299,
            currency: 'USD',
            notes: 'Includes 1 carry-on',
            rawPayload: { provider: 'mock', status: 'simulated' }
        },
        {
            id: `mock-2-${Date.now()}`,
            airline: 'Global Connect',
            flightNumber: 'GC404',
            origin,
            destination,
            departureTime: '02:15 PM',
            arrivalTime: '08:45 PM',
            duration: '6h 30m',
            stops: 1,
            cabin: 'Premium Economy',
            price: 450,
            currency: 'USD',
            rawPayload: { provider: 'mock', status: 'simulated', layover: 'ATL' }
        },
        {
            id: `mock-3-${Date.now()}`,
            airline: 'Budget Wings',
            flightNumber: 'BW99',
            origin,
            destination,
            departureTime: '06:00 PM',
            arrivalTime: '10:00 PM',
            duration: '4h 0m',
            stops: 0,
            cabin: 'Economy',
            price: 189,
            currency: 'USD',
            notes: 'No refund, personal item only',
            rawPayload: { provider: 'mock', status: 'simulated', restrictions: true }
        }
    ];

    return mockFlights;
}
