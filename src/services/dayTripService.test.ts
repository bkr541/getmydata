// @ts-nocheck
import { transformDayTripResponse, Flight, TransformOptions } from './dayTripService';

describe('Day Trip Service', () => {
    const mockFlights: Flight[] = [
        // Outbound ATL -> MCO (Departs 8:00 AM, Arrives 10:00 AM)
        {
            id: 'out-1',
            flightNumber: 'F9-100',
            origin: 'ATL',
            destination: 'MCO',
            departureTime: '8:00 AM',
            arrivalTime: '10:00 AM',
            price: 50,
            rawPayload: {
                departure_time: '2026-03-20T08:00:00Z',
                arrival_time: '2026-03-20T10:00:00Z',
                stops: 0
            }
        },
        // Return MCO -> ATL (Departs 4:00 PM, Arrives 6:00 PM) - 6 Hr layover
        {
            id: 'ret-1',
            flightNumber: 'F9-101',
            origin: 'MCO',
            destination: 'ATL',
            departureTime: '4:00 PM',
            arrivalTime: '6:00 PM',
            price: 40,
            rawPayload: {
                departure_time: '2026-03-20T16:00:00Z',
                arrival_time: '2026-03-20T18:00:00Z',
                stops: 0
            }
        },
        // Return MCO -> ATL (Departs 11:00 PM) - Too Late flag & Next Day Arrival
        {
            id: 'ret-2',
            flightNumber: 'F9-102',
            origin: 'MCO',
            destination: 'ATL',
            departureTime: '11:00 PM',
            arrivalTime: '1:00 AM',
            price: 25,
            rawPayload: {
                departure_time: '2026-03-20T23:00:00Z',
                arrival_time: '2026-03-21T01:00:00Z',
                stops: 0
            }
        },
        // Invalid / Malformed Flight
        {
            id: 'err-1',
            flightNumber: 'X-99',
            origin: 'ATL',
            destination: 'PHL',
            departureTime: '...',
            arrivalTime: '...',
            price: 15,
            rawPayload: undefined as any // Force missing payload
        }
    ];

    it('successfully pairs strict same-day trips and ignores malformed/invalid matches', () => {
        const rules: TransformOptions = {
            originAirport: 'ATL',
            minimumLayoverHours: 4,
            nonstopOnly: true,
            sameDayReturnRequired: true,
            rankMode: 'balanced'
        };

        const result = transformDayTripResponse(mockFlights, rules);

        // Flights remains untouched (all 4 elements directly returned)
        expect(result.flights).toHaveLength(4);

        // Only pair combination 1 is valid (Outbound 1 + Return 1)
        expect(result.dayTrips).toHaveLength(1);

        const trip = result.dayTrips[0];
        expect(trip.id).toBe('out-1_ret-1');
        expect(trip.routeLabel).toBe('ATL → MCO → ATL');
        expect(trip.timeInDestinationMinutes).toBe(360); // 10 AM to 4 PM layover
        expect(trip.roundTripPrice).toBe(90);
        expect(trip.badges).toContain('Same Day');
        expect(trip.badges).toContain('Nonstop');
        expect(result.warnings?.length).toBeGreaterThan(0); // For err-1
    });

    it('filters out trips under minimum layover', () => {
        const rules: TransformOptions = {
            originAirport: 'ATL',
            minimumLayoverHours: 7, // We only have a 6 hour layover
            nonstopOnly: true,
            sameDayReturnRequired: false
        };

        const result = transformDayTripResponse(mockFlights, rules);
        expect(result.dayTrips).toHaveLength(0); // 6 < 7 hours
    });
});
