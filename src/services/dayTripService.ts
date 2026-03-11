export interface TransformOptions {
    originAirport: string;
    minimumLayoverHours: number;
    nonstopOnly: boolean;
    sameDayReturnRequired: boolean;
    maxTripsPerDestination?: number;
    rankMode?: "balanced" | "cheapest" | "longest_time_at_destination";
}

export interface FlightPayload {
    departure_time: string; // ISO string
    arrival_time: string;   // ISO string
    stops?: number;
    [key: string]: any;     // Handles other raw payload fields
}

export interface Flight {
    id: string;
    airline?: string;
    flightNumber: string;
    origin: string;
    destination: string;
    departureTime: string;
    arrivalTime: string;
    duration?: string;
    stops?: number;
    cabin?: string;
    price?: number;
    currency?: string;
    notes?: string;
    dayTripDestination?: string;
    rawPayload?: FlightPayload; // Ensures access to ISO timestamps
}

export interface LightFlight {
    id: string;
    flightNumber: string;
    origin: string;
    destination: string;
    departureTime: string;
    arrivalTime: string;
    departureIso: string;
    arrivalIso: string;
    duration?: string;
    stops: number;
    cabin?: string;
    price: number;
}

export interface DayTrip {
    id: string;
    destination: string;
    routeLabel: string;
    rank: number;
    score: number;
    timeInDestinationMinutes: number;
    timeInDestinationLabel: string;
    totalAirMinutes: number;
    totalAirLabel: string;
    totalTripMinutes: number;
    totalTripLabel: string;
    roundTripPrice: number;
    priceLabel: string;
    currency: string;
    badges: string[];
    outboundFlightId: string;
    returnFlightId: string;
    outbound: LightFlight;
    return: LightFlight;
}

export interface RulesApplied extends TransformOptions { }

export interface TransformResult {
    flights: Flight[];
    dayTrips: DayTrip[];
    rulesApplied: RulesApplied;
    warnings?: string[];
}

// Helper Utilities
export const parseIsoSafe = (iso: string | undefined): number | null => {
    if (!iso) return null;
    const time = Date.parse(iso);
    return isNaN(time) ? null : time;
};

export const isSameCalendarDay = (iso1: string, iso2: string): boolean => {
    if (!iso1 || !iso2) return false;
    return iso1.split('T')[0] === iso2.split('T')[0];
};

export const minutesBetween = (startMs: number, endMs: number): number => {
    return Math.max(0, Math.floor((endMs - startMs) / 60000));
};

export const formatMinutesAsLabel = (minutes: number): string => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}m`;
};

export const generateStableId = (outId: string, returnId: string): string => {
    return `${outId}_${returnId}`;
};

/**
 * Transforms an array of flights into a result containing computed DayTrips.
 */
export const transformDayTripResponse = (
    flights: Flight[],
    options: TransformOptions
): TransformResult => {
    const warnings: string[] = [];

    // 1. Keep only flights with necessary ISO data
    const validFlights = flights.filter(f => {
        // Some providers might nest departure_time in segments
        let depStr = f.rawPayload?.departure_time || f.rawPayload?.segments?.[0]?.departure_time;
        let arrStr = f.rawPayload?.arrival_time || f.rawPayload?.segments?.[f.rawPayload?.segments?.length - 1]?.arrival_time;

        if (!depStr || !arrStr) {
            warnings.push(`Skipped flight ${f.id}: Missing rawPayload ISO timestamps`);
            return false;
        }
        return true;
    });

    const outbounds = validFlights.filter(f => f.origin === options.originAirport);
    const inbounds = validFlights.filter(f => f.destination === options.originAirport);

    const potentialPairs: DayTrip[] = [];

    // 2. Discover Pairs
    for (const out of outbounds) {
        const matchedReturns = inbounds.filter(inb => inb.origin === out.destination);

        for (const inb of matchedReturns) {
            let outDepStr = out.rawPayload?.departure_time || out.rawPayload?.segments?.[0]?.departure_time;
            let outArrStr = out.rawPayload?.arrival_time || out.rawPayload?.segments?.[out.rawPayload?.segments?.length - 1]?.arrival_time;
            let inbDepStr = inb.rawPayload?.departure_time || inb.rawPayload?.segments?.[0]?.departure_time;
            let inbArrStr = inb.rawPayload?.arrival_time || inb.rawPayload?.segments?.[inb.rawPayload?.segments?.length - 1]?.arrival_time;

            const outArrMs = parseIsoSafe(outArrStr);
            const inbDepMs = parseIsoSafe(inbDepStr);
            const outDepMs = parseIsoSafe(outDepStr);
            const inbArrMs = parseIsoSafe(inbArrStr);

            if (!outArrMs || !inbDepMs || !outDepMs || !inbArrMs) continue;

            // Ensure return departs *after* outbound arrives
            if (inbDepMs <= outArrMs) continue;

            if (options.sameDayReturnRequired && !isSameCalendarDay(outDepStr, inbArrStr)) {
                continue;
            }

            const layoverMinutes = minutesBetween(outArrMs, inbDepMs);
            if (layoverMinutes < options.minimumLayoverHours * 60) continue;

            if (options.nonstopOnly) {
                const outStops = out.stops ?? out.rawPayload?.stops ?? 0;
                const inStops = inb.stops ?? inb.rawPayload?.stops ?? 0;
                if (outStops > 0 || inStops > 0) continue;
            }

            // Valid pair discovered - Compute properties
            const outAirMinutes = minutesBetween(outDepMs, outArrMs);
            const inAirMinutes = minutesBetween(inbDepMs, inbArrMs);
            const totalAirMinutes = outAirMinutes + inAirMinutes;
            const totalTripMinutes = minutesBetween(outDepMs, inbArrMs);

            // Customizable price logic: Replace with GoWild logic if needed later
            const roundTripPrice = (out.price ?? 0) + (inb.price ?? 0);
            const currency = out.currency || inb.currency || "USD";

            const tripId = generateStableId(out.id, inb.id);

            const outboundLight: LightFlight = {
                id: out.id,
                flightNumber: out.flightNumber,
                origin: out.origin,
                destination: out.destination,
                departureTime: out.departureTime,
                arrivalTime: out.arrivalTime,
                departureIso: outDepStr,
                arrivalIso: outArrStr,
                duration: out.duration,
                stops: out.stops ?? out.rawPayload?.stops ?? 0,
                cabin: out.cabin,
                price: out.price || 0,
            };

            const returnLight: LightFlight = {
                id: inb.id,
                flightNumber: inb.flightNumber,
                origin: inb.origin,
                destination: inb.destination,
                departureTime: inb.departureTime,
                arrivalTime: inb.arrivalTime,
                departureIso: inbDepStr,
                arrivalIso: inbArrStr,
                duration: inb.duration,
                stops: inb.stops ?? inb.rawPayload?.stops ?? 0,
                cabin: inb.cabin,
                price: inb.price || 0,
            };

            const trip: DayTrip = {
                id: tripId,
                destination: out.destination,
                routeLabel: `${options.originAirport} → ${out.destination} → ${options.originAirport}`,
                rank: 0,
                score: 0,
                timeInDestinationMinutes: layoverMinutes,
                timeInDestinationLabel: formatMinutesAsLabel(layoverMinutes),
                totalAirMinutes,
                totalAirLabel: formatMinutesAsLabel(totalAirMinutes),
                totalTripMinutes,
                totalTripLabel: formatMinutesAsLabel(totalTripMinutes),
                roundTripPrice,
                priceLabel: new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 2 }).format(roundTripPrice),
                currency,
                badges: [],
                outboundFlightId: out.id,
                returnFlightId: inb.id,
                outbound: outboundLight,
                return: returnLight
            };

            // 3. Assign Base Badges
            if (outboundLight.stops === 0 && returnLight.stops === 0) {
                trip.badges.push("Nonstop");
            }
            if (isSameCalendarDay(outboundLight.departureIso, returnLight.arrivalIso)) {
                trip.badges.push("Same Day");
            }
            if (layoverMinutes > options.minimumLayoverHours * 60 && layoverMinutes < 360) {
                trip.badges.push("Quick Turn");
            }
            const returnArrivalHour = new Date(inbArrMs).getHours();
            if (returnArrivalHour >= 22 || returnArrivalHour < 3) {
                trip.badges.push("Late Return");
            }

            potentialPairs.push(trip);
        }
    }

    // 4. Group by Destination
    const tripsByDest = new Map<string, DayTrip[]>();
    for (const t of potentialPairs) {
        const list = tripsByDest.get(t.destination) || [];
        list.push(t);
        tripsByDest.set(t.destination, list);
    }

    const normalizedRankMode = options.rankMode || "balanced";
    let finalTrips: DayTrip[] = [];

    // 5. Score, Sort, and assign dynamic Badges per destination group
    for (const [, destTrips] of tripsByDest.entries()) {

        for (const t of destTrips) {
            if (normalizedRankMode === "balanced") {
                // Lower is better: Base score emphasizes price but penalizes extremely long trips
                let s = (t.roundTripPrice * 2) + t.totalTripMinutes;
                if (t.badges.includes("Nonstop")) s -= 50;
                s -= t.timeInDestinationMinutes * 0.2; // slight bump for longer layover
                t.score = s;
            } else if (normalizedRankMode === "cheapest") {
                t.score = (t.roundTripPrice * 1000) + t.totalTripMinutes;
            } else if (normalizedRankMode === "longest_time_at_destination") {
                t.score = (-t.timeInDestinationMinutes * 1000) + t.roundTripPrice; // Negative makes higher duration = lower score
            }
        }

        // Sort ascending by score (lowest wins)
        destTrips.sort((a, b) => a.score - b.score);

        if (destTrips.length > 0) {
            destTrips[0].badges.push("Best Balance");

            const minPriceStrId = [...destTrips].sort((a, b) => a.roundTripPrice - b.roundTripPrice)[0].id;
            if (destTrips[0].id !== minPriceStrId) {
                const cheapestTrip = destTrips.find(dt => dt.id === minPriceStrId);
                cheapestTrip?.badges.push("Cheapest");
            }

            const maxTimeStrId = [...destTrips].sort((a, b) => b.timeInDestinationMinutes - a.timeInDestinationMinutes)[0].id;
            const longestTrip = destTrips.find(dt => dt.id === maxTimeStrId);
            if (longestTrip && !longestTrip.badges.includes("Longest Time There")) {
                longestTrip.badges.push("Longest Time There");
            }
        }

        const limitedTrips = options.maxTripsPerDestination
            ? destTrips.slice(0, options.maxTripsPerDestination)
            : destTrips;

        finalTrips.push(...limitedTrips);
    }

    // 6. Final Global Sorting
    finalTrips.sort((a, b) => a.score - b.score);

    // Assign global ranks
    finalTrips.forEach((t, i) => {
        t.rank = i + 1;
    });

    return {
        flights, // Preserves the exact original array directly in memory
        dayTrips: finalTrips,
        rulesApplied: options,
        warnings: warnings.length > 0 ? warnings : undefined
    };
};
