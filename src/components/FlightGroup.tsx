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

    // Sort by departure time to find earliest
    const sortedFlights = [...flights].sort((a, b) =>
        new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime()
    );

    // Format earliest departure time
    let earliestTimeFormatted = '--:--';
    try {
        const rawTime = sortedFlights[0]?.rawPayload?.departure_time || sortedFlights[0]?.departureTime;
        if (rawTime) {
            const d = new Date(rawTime);
            if (!isNaN(d.getTime())) {
                earliestTimeFormatted = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            } else {
                earliestTimeFormatted = rawTime;
            }
        }
    } catch {
        earliestTimeFormatted = flights[0]?.departureTime || '--:--';
    }

    const nonstopCount = flights.filter(f => f.stops === 0).length;

    const goWildCount = flights.filter(f =>
        (f.notes && f.notes.toLowerCase().includes('gowild')) ||
        (f.cabin && f.cabin.toLowerCase().includes('gowild'))
    ).length;

    // Build a date label for the subtitle
    let dateLabel = '';
    try {
        const raw = sortedFlights[0]?.rawPayload?.departure_time || sortedFlights[0]?.departureTime;
        if (raw) {
            const d = new Date(raw);
            if (!isNaN(d.getTime())) {
                dateLabel = d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
            }
        }
    } catch {
        // ignore
    }

    return (
        <div className={styles.groupContainer}>
            <div
                className={styles.header}
                onClick={() => setIsExpanded(!isExpanded)}
                role="button"
                aria-expanded={isExpanded}
            >
                <div className={styles.headerLeft}>
                    <div className={styles.title}>{destination}</div>
                    <div className={styles.subtitle}>
                        {flights.length} flight{flights.length !== 1 ? 's' : ''}
                        {dateLabel ? ` · ${dateLabel}` : ''}
                    </div>
                    <div className={styles.pills}>
                        <span className={styles.pill}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                            </svg>
                            <span className={styles.pillLabel}>EARLIEST</span>
                            <span className={styles.pillValue}>{earliestTimeFormatted}</span>
                        </span>
                        <span className={styles.pill}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21 4 21 4s-2 0-3.5 1.5L14 9 5.8 7.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 3.2c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.1z" />
                            </svg>
                            <span className={styles.pillLabel}>NONSTOP</span>
                            <span className={styles.pillValue}>
                                {nonstopCount}
                                {nonstopCount > 0 && (
                                    <span className={styles.pillDots}>{' ·'.repeat(Math.min(nonstopCount, 4))}</span>
                                )}
                            </span>
                        </span>
                        {goWildCount > 0 && (
                            <span className={`${styles.pill} ${styles.pillWild}`}>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M11.188 3.267a.5.5 0 0 1 .876 0l2.75 5.3a1 1 0 0 0 1.516.294l4.277-3.664a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.957.735H6.386a1 1 0 0 1-.957-.735L2.595 5.716a.5.5 0 0 1 .798-.519l4.277 3.664a1 1 0 0 0 1.516-.294z" />
                                </svg>
                                <span className={styles.pillLabel}>GO WILD</span>
                                <span className={styles.pillValue}>{goWildCount} Available</span>
                            </span>
                        )}
                    </div>
                </div>
                <div className={`${styles.chevron} ${isExpanded ? styles.expanded : ''}`}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9" />
                    </svg>
                </div>
            </div>

            {isExpanded && (
                <div className={styles.expandedContent}>
                    <div className={styles.flightList}>
                        {sortedFlights.map(flight => (
                            <FlightCard key={flight.id} flight={flight} isGrouped={true} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
