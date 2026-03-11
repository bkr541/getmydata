import { NextResponse } from 'next/server';
import { customSearchFlights, customInboundFlights } from '@/services/providers/customScraperProvider';

export const dynamic = 'force-dynamic';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const origin = searchParams.get('origin');
        const departureDate = searchParams.get('date');
        const layoverTimeParam = searchParams.get('layovertime');

        if (!origin || !departureDate) {
            return NextResponse.json(
                { message: 'Missing required parameters. Need origin and date.' },
                { status: 400, headers: corsHeaders }
            );
        }

        const minLayoverMs = layoverTimeParam ? parseInt(layoverTimeParam, 10) * 60 * 60 * 1000 : 0;

        // 1. Fetch all outgoing flights from origin
        const outboundFlights = await customSearchFlights(origin, '', departureDate);
        if (!outboundFlights.length) {
            return NextResponse.json({ flights: [] }, { status: 200, headers: corsHeaders });
        }

        // Get unique destinations from outbound results
        const uniqueDestinations = new Set(outboundFlights.map(f => f.destination));

        // 2. Fetch all incoming flights back to origin
        // Note: customInboundFlights searches everywhere *to* a destination. 
        // Here, our "destination" is our home origin.
        const inboundFlights = await customInboundFlights(origin, departureDate, 15);
        if (!inboundFlights.length) {
            return NextResponse.json({ flights: [] }, { status: 200, headers: corsHeaders });
        }

        // 3. Match and filter based on time
        const validDayTrips = [];

        for (const outFlight of outboundFlights) {
            const dest = outFlight.destination;

            // Find all inbound flights that leave from this destination
            const potentialReturns = inboundFlights.filter(inF => inF.origin === dest);

            for (const inFlight of potentialReturns) {
                // Ensure the return flight departs AFTER the outbound flight arrives (plus layover)
                const outArrivalStr = outFlight.rawPayload?.arrival_time;
                // For inbound flights from our custom scraper, segments[0].departure_time is most reliable
                const inDepartureStr = inFlight.rawPayload?.segments?.[0]?.departure_time || inFlight.rawPayload?.departure_time;

                if (outArrivalStr && inDepartureStr) {
                    const outArrivalMs = new Date(outArrivalStr).getTime();
                    const inDepartureMs = new Date(inDepartureStr).getTime();

                    if ((inDepartureMs - outArrivalMs) >= minLayoverMs) {
                        // Valid pair found! Add BOTH to the raw output.
                        validDayTrips.push(outFlight);
                        validDayTrips.push(inFlight);
                    }
                }
            }
        }

        // Deduplicate in case a single flight is part of multiple valid pairs
        const uniqueDayTripsMap = new Map();
        for (const flight of validDayTrips) {
            if (!uniqueDayTripsMap.has(flight.id)) {
                uniqueDayTripsMap.set(flight.id, flight);
            }
        }

        const finalFlights = Array.from(uniqueDayTripsMap.values());

        return NextResponse.json({ flights: finalFlights }, { status: 200, headers: corsHeaders });

    } catch (error: any) {
        console.error('[API] /api/flights/dayTrips error:', error);

        return NextResponse.json(
            { message: error.message || 'Internal server error while searching day trips' },
            { status: 500, headers: corsHeaders }
        );
    }
}
