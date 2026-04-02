import { NextResponse } from 'next/server';
import { customInboundFlights } from '@/services/providers/customScraperProvider';

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
            console.warn('[API /api/flights/inbound] Missing Authorization header');
            return NextResponse.json(
                { message: 'Missing Authorization header' },
                { status: 401, headers: corsHeaders }
            );
        }

        const { searchParams } = new URL(request.url);
        const destination = searchParams.get('destination');
        const departureDate = searchParams.get('date');
        const maxWorkersParam = searchParams.get('max_workers');

        if (!destination || !departureDate) {
            return NextResponse.json(
                { message: 'Missing required parameters. Need destination and date.' },
                { status: 400, headers: corsHeaders }
            );
        }

        const maxWorkers = maxWorkersParam ? parseInt(maxWorkersParam, 10) : 10;

        const flights = await customInboundFlights(destination, departureDate, maxWorkers, token);

        return NextResponse.json({ flights }, { status: 200, headers: corsHeaders });

    } catch (error: any) {
        console.error('[API] /api/flights/inbound error:', error);

        return NextResponse.json(
            { message: error.message || 'Internal server error while searching flights' },
            { status: 500, headers: corsHeaders }
        );
    }
}
