'use client';

import React from 'react';
import { useSearch, FlightResult } from '@/context/SearchContext';
import FlightCard from './FlightCard';
import styles from './FlightResults.module.css';

export default function FlightResults() {
    const { flightResults, isLoading, error } = useSearch();

    if (isLoading) {
        return (
            <div className={styles.container}>
                <div className={styles.loadingState}>
                    <div className={styles.spinner}></div>
                    <p>Searching for the best flights...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.container}>
                <div className={styles.errorState}>
                    <p>⚠️ {error}</p>
                </div>
            </div>
        );
    }

    if (flightResults === null) {
        return null; // Search not yet requested
    }

    if (flightResults.length === 0) {
        return (
            <div className={styles.container}>
                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>✈️</div>
                    <h3>No flights found</h3>
                    <p>We couldn't find any flights matching your criteria. Try adjusting your dates or destinations.</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <h2 className={styles.title}>Search Results</h2>
            <p className={styles.subtitle}>{flightResults.length} flights found</p>

            <div className={styles.resultsList}>
                {flightResults.map((flight: FlightResult) => (
                    <FlightCard key={flight.id} flight={flight} />
                ))}
            </div>
        </div>
    );
}
