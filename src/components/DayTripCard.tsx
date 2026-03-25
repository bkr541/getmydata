'use client';

import React from 'react';
import { DayTrip } from '@/services/dayTripService';
import styles from './DayTripCard.module.css';

interface BadgeConfig {
    label: string;
    className: string;
    icon: React.ReactNode;
}

const BADGE_CONFIG: Record<string, BadgeConfig> = {
    'Nonstop': {
        label: 'Nonstop',
        className: styles.badgeNonstop,
        icon: (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
            </svg>
        ),
    },
    'Same Day': {
        label: 'Same Day',
        className: styles.badgeSameDay,
        icon: (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
        ),
    },
    'Best Balance': {
        label: 'Best Balance',
        className: styles.badgeBestBalance,
        icon: (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="3" x2="12" y2="21" />
                <path d="M6 9H3l3 6a3 3 0 0 0 6 0" />
                <path d="M18 9h3l-3 6a3 3 0 0 1-6 0" />
            </svg>
        ),
    },
    'Longest Time There': {
        label: 'Longest Time There',
        className: styles.badgeLongest,
        icon: (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
            </svg>
        ),
    },
    'Cheapest': {
        label: 'Cheapest',
        className: styles.badgeCheapest,
        icon: (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
        ),
    },
    'Quick Turn': {
        label: 'Quick Turn',
        className: styles.badgeQuickTurn,
        icon: (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
        ),
    },
    'Late Return': {
        label: 'Late Return',
        className: styles.badgeLateReturn,
        icon: (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
        ),
    },
};

export default function DayTripCard({ trip, date }: { trip: DayTrip; date: string }) {
    const formattedDate = date
        ? new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
          })
        : '';

    return (
        <div className={styles.card}>
            {/* Header */}
            <div className={styles.header}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <span className={styles.headerDate}>{formattedDate}</span>
            </div>

            {/* Body */}
            <div className={styles.body}>
                {/* Outbound column */}
                <div className={styles.flightCol}>
                    <span className={`${styles.directionBadge} ${styles.outboundBadge}`}>OUTBOUND</span>
                    <span className={`${styles.airportCode} ${styles.outboundCode}`}>{trip.outbound.origin}</span>
                    <span className={styles.flightTime}>{trip.outbound.departureTime}</span>
                    <span className={styles.flightLabel}>Departure</span>
                    {trip.outbound.duration && (
                        <span className={styles.durationPill}>{trip.outbound.duration}</span>
                    )}
                    <span className={`${styles.airportCode} ${styles.outboundCode}`}>{trip.outbound.destination}</span>
                    <span className={styles.flightTime}>{trip.outbound.arrivalTime}</span>
                    <span className={styles.flightLabel}>Arrival</span>
                </div>

                {/* Center column */}
                <div className={styles.centerCol}>
                    <div className={styles.groundTimePill}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                        </svg>
                        <span>{trip.timeInDestinationLabel}</span>
                    </div>
                    <div className={styles.groundTimeLabel}>
                        Ground Time in<br />
                        <strong>{trip.destination}</strong>
                    </div>
                    <div className={styles.centerDivider} />
                </div>

                {/* Return column */}
                <div className={`${styles.flightCol} ${styles.returnCol}`}>
                    <span className={`${styles.directionBadge} ${styles.returnBadge}`}>RETURN</span>
                    <span className={`${styles.airportCode} ${styles.returnCode}`}>{trip.return.origin}</span>
                    <span className={styles.flightTime}>{trip.return.departureTime}</span>
                    <span className={styles.flightLabel}>Departure</span>
                    {trip.return.duration && (
                        <span className={styles.durationPill}>{trip.return.duration}</span>
                    )}
                    <span className={`${styles.airportCode} ${styles.returnCode}`}>{trip.return.destination}</span>
                    <span className={styles.flightTime}>{trip.return.arrivalTime}</span>
                    <span className={styles.flightLabel}>Arrival</span>
                </div>
            </div>

            {/* Badges */}
            {trip.badges.length > 0 && (
                <div className={styles.footer}>
                    {trip.badges.map(badge => {
                        const config = BADGE_CONFIG[badge];
                        if (!config) return null;
                        return (
                            <span key={badge} className={`${styles.badge} ${config.className}`}>
                                {config.icon}
                                {config.label}
                            </span>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
