import { NextResponse } from 'next/server';
import { searchFlights } from '@/services/flightProvider';
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
        const token = request.headers.get('Authorization')?.replace('Bearer ', '') ?? '';
        if (!token) {
            console.warn('[API /api/flights/search] Missing Authorization header');
            return NextResponse.json(
                { message: 'Missing Authorization header' },
                { status: 401, headers: corsHeaders }
            );
        }

        const body: FlightSearchQuery = await request.json();

        // 1. Validate payload
        const { origin, destination, departureDate } = body;

        if (!origin || !departureDate) {
            return NextResponse.json(
                { message: 'Missing required parameters. Need origin and departureDate.' },
                { status: 400, headers: corsHeaders }
            );
        }

        if (destination && origin === destination) {
            return NextResponse.json(
                { message: 'Origin and destination cannot be the same.' },
                { status: 400, headers: corsHeaders }
            );
        }

        // 2. Pass exact parameters from body to the provider orchestrator
        // By default uses the 'mock' provider. Switch to 'customScraper' to use the stub.
        const flights = await searchFlights(body, 'customScraper', token);

        // 3. Return results
        return NextResponse.json({ flights }, { status: 200, headers: corsHeaders });

    } catch (error: any) {
        console.error('[API] /api/flights/search error:', error);

        return NextResponse.json(
            { message: error.message || 'Internal server error while searching flights' },
            { status: 500, headers: corsHeaders }
        );
    }
}
