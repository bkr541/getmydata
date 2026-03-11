'use client';

import React from 'react';
import { useSearch, FlightResult } from '@/context/SearchContext';
import FlightCard from './FlightCard';
import FlightGroup from './FlightGroup';
import styles from './FlightResults.module.css';

export default function FlightResults() {
    const { searchQuery, flightResults, returnFlightResults, isLoading, error } = useSearch();
    const [activeTab, setActiveTab] = React.useState<'departure' | 'return'>('departure');

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

    const isRoundTrip = returnFlightResults !== null && returnFlightResults.length > 0;
    const currentResults = activeTab === 'return' && isRoundTrip ? (returnFlightResults || []) : flightResults;

    // Group calculation
    const destinationGroups = currentResults.reduce((acc: { [key: string]: FlightResult[] }, flight) => {
        const groupKey = flight.dayTripDestination || (activeTab === 'return' ? flight.origin : flight.destination);
        if (!acc[groupKey]) {
            acc[groupKey] = [];
        }
        acc[groupKey].push(flight);
        return acc;
    }, {});

    const uniqueDestinationKeys = Object.keys(destinationGroups);
    const useGroupedLayout = uniqueDestinationKeys.length > 1;

    return (
        <div className={styles.container}>
            <h2 className={styles.title}>Search Results</h2>

            {isRoundTrip && (
                <div className={styles.tabsContainer}>
                    <button
                        className={`${styles.tabButton} ${activeTab === 'departure' ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab('departure')}
                    >
                        Departing: {searchQuery.origin || '🌐'} → {searchQuery.destination || '🌐'} ({flightResults?.length || 0})
                    </button>
                    <button
                        className={`${styles.tabButton} ${activeTab === 'return' ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab('return')}
                    >
                        Returning: {searchQuery.destination || '🌐'} → {searchQuery.origin || '🌐'} ({returnFlightResults?.length || 0})
                    </button>
                </div>
            )}

            <p className={styles.subtitle} style={{ marginTop: isRoundTrip ? '1rem' : 0 }}>
                {currentResults.length} flights found
                {useGroupedLayout ? ` | ${uniqueDestinationKeys.length} destinations` : ''}
            </p>

            <div className={styles.resultsList}>
                {useGroupedLayout ? (
                    uniqueDestinationKeys.sort().map(dest => (
                        <FlightGroup
                            key={dest}
                            destination={dest}
                            flights={destinationGroups[dest]}
                        />
                    ))
                ) : (
                    currentResults.map((flight: FlightResult) => (
                        <FlightCard key={flight.id} flight={flight} />
                    ))
                )}
            </div>
        </div>
    );
}
