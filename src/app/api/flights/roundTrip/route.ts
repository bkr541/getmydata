import { NextResponse } from 'next/server';
import { customSearchFlights } from '@/services/providers/customScraperProvider';
import { FlightSearchQuery } from '@/context/SearchContext';

export const dynamic = 'force-dynamic';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { origin, destination, departureDate, returnDate } = body;

        // 1. Validate payload
        if (!origin || !destination || !departureDate || !returnDate) {
            return NextResponse.json(
                { message: 'Missing required parameters. Need origin, destination, departureDate, and returnDate.' },
                { status: 400, headers: corsHeaders }
            );
        }

        if (origin === destination) {
            return NextResponse.json(
                { message: 'Origin and destination cannot be the same.' },
                { status: 400, headers: corsHeaders }
            );
        }

        // 2. Fetch both sets of flights concurrently
        const [outboundFlights, returnFlights] = await Promise.all([
            customSearchFlights(origin, destination, departureDate),
            customSearchFlights(destination, origin, returnDate)
        ]);

        // 3. Return combined results
        return NextResponse.json(
            { outboundFlights, returnFlights },
            { status: 200, headers: corsHeaders }
        );

    } catch (error: any) {
        console.error('[API] /api/flights/roundTrip error:', error);

        return NextResponse.json(
            { message: error.message || 'Internal server error while searching flights' },
            { status: 500, headers: corsHeaders }
        );
    }
}
