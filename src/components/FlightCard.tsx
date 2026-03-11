'use client';

import React, { useState } from 'react';
import { FlightResult } from '@/context/SearchContext';
import styles from './FlightCard.module.css';

export default function FlightCard({ flight, isGrouped = false }: { flight: FlightResult, isGrouped?: boolean }) {
    const [showRaw, setShowRaw] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(JSON.stringify(flight, null, 2));
        // Could add brief toast toast notification here if desired
    };

    return (
        <div className={`card ${styles.flightCard} ${isGrouped ? styles.groupedCard : ''}`}>
            <div className={styles.header}>
                <div className={styles.airlineInfo}>
                    <span className={styles.airline}>{flight.airline}</span>
                    <span className={styles.flightNumber}>{flight.flightNumber}</span>
                </div>
                <div className={styles.priceContainer}>
                    <span className={styles.price}>
                        {flight.price.toLocaleString(undefined, {
                            style: 'currency',
                            currency: flight.currency,
                        })}
                    </span>
                </div>
            </div>

            <div className={styles.routeContainer}>
                <div className={styles.timeBlock}>
                    <span className={styles.time}>{flight.departureTime}</span>
                    <span className={styles.airport}>{flight.origin}</span>
                </div>

                <div className={styles.durationBlock}>
                    <span className={styles.duration}>{flight.duration}</span>
                    <div className={styles.line}>
                        <div className={styles.dot}></div>
                        <div className={styles.dot}></div>
                    </div>
                    <span className={styles.stops}>
                        {flight.stops === 0 ? 'Nonstop' : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`}
                    </span>
                </div>

                <div className={styles.timeBlock}>
                    <span className={styles.time}>{flight.arrivalTime}</span>
                    <span className={styles.airport}>{flight.destination}</span>
                </div>
            </div>

            <div className={styles.footer}>
                <div className={styles.badges}>
                    <span className={styles.badge}>{flight.cabin}</span>
                    {flight.notes && <span className={`${styles.badge} ${styles.badgeWarning}`}>{flight.notes}</span>}
                </div>
                <div className={styles.actions}>
                    <button className={styles.actionBtn} onClick={() => setShowRaw(!showRaw)}>
                        {showRaw ? 'Hide Payload' : 'View Payload'}
                    </button>
                    <button className={styles.actionBtn} onClick={handleCopy}>
                        Copy JSON
                    </button>
                </div>
            </div>

            {showRaw && (
                <div className={styles.rawPayload}>
                    <pre>{JSON.stringify(flight.rawPayload, null, 2)}</pre>
                </div>
            )}
        </div>
    );
}
