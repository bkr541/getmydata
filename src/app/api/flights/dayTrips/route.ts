import { NextResponse } from 'next/server';
import { customSearchFlights, customInboundFlights } from '@/services/providers/customScraperProvider';
import { transformDayTripResponse, TransformOptions } from '@/services/dayTripService';

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
        const token = request.headers.get('Authorization')?.replace('Bearer ', '') ?? '';
        if (!token) {
            console.warn('[API /api/flights/dayTrips] Missing Authorization header');
            return NextResponse.json(
                { message: 'Missing Authorization header' },
                { status: 401, headers: corsHeaders }
            );
        }

        const { searchParams } = new URL(request.url);
        const origin = searchParams.get('origin');
        const departureDate = searchParams.get('date');
        const layoverTimeParam = searchParams.get('layovertime');
        const nonstopParam = searchParams.get('nonstop');

        if (!origin || !departureDate) {
            return NextResponse.json(
                { message: 'Missing required parameters. Need origin and date.' },
                { status: 400, headers: corsHeaders }
            );
        }

        const minimumLayoverHours = layoverTimeParam ? parseFloat(layoverTimeParam) : 4;
        const isNonstop = nonstopParam !== 'false'; // Defaults to true

        // 1. Fetch all outgoing flights from origin
        let outboundFlights = await customSearchFlights(origin, '', departureDate, token);
        if (isNonstop) {
            outboundFlights = outboundFlights.filter(f => f.stops === 0);
        }

        if (!outboundFlights.length) {
            return NextResponse.json({ flights: [], dayTrips: [], rulesApplied: {} }, { status: 200, headers: corsHeaders });
        }

        // 2. Fetch all incoming flights back to origin
        // Note: customInboundFlights searches everywhere *to* a destination. 
        // Here, our "destination" is our home origin.
        let inboundFlights = await customInboundFlights(origin, departureDate, 15, token);
        if (isNonstop) {
            inboundFlights = inboundFlights.filter(f => f.stops === 0);
        }

        if (!inboundFlights.length) {
            return NextResponse.json({ flights: outboundFlights, dayTrips: [], rulesApplied: {} }, { status: 200, headers: corsHeaders });
        }

        const combinedRawFlights = [...outboundFlights, ...inboundFlights];

        // 3. Setup business logic rules
        const rules: TransformOptions = {
            originAirport: origin,
            minimumLayoverHours,
            nonstopOnly: isNonstop,
            sameDayReturnRequired: true,
            maxTripsPerDestination: 10,
            rankMode: "balanced"
        };

        // 4. Transform the raw scraped payload
        const finalResponse = transformDayTripResponse(combinedRawFlights, rules);

        return NextResponse.json(finalResponse, { status: 200, headers: corsHeaders });

    } catch (error: any) {
        console.error('[API] /api/flights/dayTrips error:', error);

        return NextResponse.json(
            { message: error.message || 'Internal server error while searching day trips' },
            { status: 500, headers: corsHeaders }
        );
    }
}
