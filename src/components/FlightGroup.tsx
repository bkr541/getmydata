'use client';

import React, { useState } from 'react';
import { FlightResult } from '@/context/SearchContext';
import FlightCard from './FlightCard';
import styles from './FlightGroup.module.css';

interface FlightGroupProps {
    destination: string;
    flights: FlightResult[];
}

export default function FlightGroup({ destination, flights }: FlightGroupProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    // Calculate Summary Stats
    const sortedFlights = [...flights].sort((a, b) => {
        // Sort by departure time string (rough alphabetical sort usually works for military time parsing)
        return new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime();
    });

    const earliestFlightStr = flights.length > 0 ? flights[0].departureTime : '--:--';

    // Attempt to extract purely numeric values from string times to format earliest flight cleanly
    let earliestTimeFormatted = earliestFlightStr;
    try {
        if (flights[0]?.rawPayload?.departure_time) {
            const rawDate = new Date(flights[0].rawPayload.departure_time);
            earliestTimeFormatted = rawDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
    } catch (e) {
        // Ignore parsing errors and fallback to string
    }

    const nonstopCount = flights.filter(f => f.stops === 0).length;

    // Count GoWild flights - assuming GoWild is part of notes or cabin 
    const goWildCount = flights.filter(f =>
        (f.notes && f.notes.toLowerCase().includes('gowild')) ||
        (f.cabin && f.cabin.toLowerCase().includes('gowild'))
    ).length;

    return (
        <div className={styles.groupContainer}>
            <div
                className={styles.header}
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className={styles.headerLeft}>
                    <div className={styles.title}>
                        {destination}
                    </div>
                    <div className={styles.subtitle}>
                        {flights.length} FLIGHTS
                    </div>
                    <div className={styles.stats}>
                        <span className={styles.statItem}>
                            <span>🕑</span> Earliest: {earliestTimeFormatted}
                        </span>
                        <span className={styles.statItem}>
                            <span>✈️</span> Nonstop: {nonstopCount}
                        </span>
                        {goWildCount > 0 && (
                            <span className={styles.statItem}>
                                <span>🌲</span> GoWild: {goWildCount} available
                            </span>
                        )}
                    </div>
                </div>
                <div className={`${styles.chevron} ${isExpanded ? styles.expanded : ''}`}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                </div>
            </div>

            {isExpanded && (
                <div className={styles.expandedContent}>
                    <div className={styles.timeline}>
                        {/* Visual timeline elements can be added here if desired */}
                    </div>
                    <div className={styles.flightList}>
                        {flights.map(flight => (
                            <FlightCard key={flight.id} flight={flight} isGrouped={true} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
