'use client';

import React from 'react';
import { useSearch, FlightResult } from '@/context/SearchContext';
import FlightCard from './FlightCard';
import FlightGroup from './FlightGroup';
import DayTripCard from './DayTripCard';
import styles from './FlightResultsScreen.module.css';

export default function FlightResultsScreen() {
    const {
        searchQuery,
        flightResults,
        returnFlightResults,
        dayTripResults,
        isLoading,
        error,
        setShowResults,
    } = useSearch();

    const isDayTrip = dayTripResults !== null;

    const [activeTab, setActiveTab] = React.useState<'departure' | 'return'>('departure');

    const handleBack = () => {
        setShowResults(false);
    };

    const isRoundTrip = returnFlightResults !== null && returnFlightResults.length > 0;
    const currentResults = activeTab === 'return' && isRoundTrip ? (returnFlightResults || []) : (flightResults || []);

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

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '';
        try {
            return new Date(dateStr + 'T00:00:00').toLocaleDateString(undefined, {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
            });
        } catch {
            return dateStr;
        }
    };

    return (
        <div className={styles.screen}>
            {/* Sticky Header */}
            <header className={styles.header}>
                <button className={styles.backBtn} onClick={handleBack} aria-label="Back to search">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6" />
                    </svg>
                </button>

                <div className={styles.headerInfo}>
                    <div className={styles.route}>
                        <span className={styles.routeCode}>{searchQuery.origin || '🌐'}</span>
                        <svg className={styles.routeArrow} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="5" y1="12" x2="19" y2="12" />
                            <polyline points="12 5 19 12 12 19" />
                        </svg>
                        <span className={styles.routeCode}>{searchQuery.destination || '🌐'}</span>
                    </div>
                    <div className={styles.routeDate}>{formatDate(searchQuery.departureDate)}</div>
                </div>
            </header>

            {/* Content */}
            <div className={styles.content}>
                {/* Round-trip tabs */}
                {isRoundTrip && (
                    <div className={styles.tabsContainer}>
                        <button
                            className={`${styles.tabButton} ${activeTab === 'departure' ? styles.activeTab : ''}`}
                            onClick={() => setActiveTab('departure')}
                        >
                            Departing ({flightResults?.length || 0})
                        </button>
                        <button
                            className={`${styles.tabButton} ${activeTab === 'return' ? styles.activeTab : ''}`}
                            onClick={() => setActiveTab('return')}
                        >
                            Returning ({returnFlightResults?.length || 0})
                        </button>
                    </div>
                )}

                {/* Loading */}
                {isLoading && (
                    <div className={styles.loadingState}>
                        <div className={styles.spinner} />
                        <p>Searching for the best flights…</p>
                    </div>
                )}

                {/* Error */}
                {!isLoading && error && (
                    <div className={styles.errorState}>
                        <p>⚠️ {error}</p>
                    </div>
                )}

                {/* Empty */}
                {!isLoading && !error && (
                    (isDayTrip && dayTripResults!.length === 0) ||
                    (!isDayTrip && flightResults !== null && flightResults.length === 0)
                ) && (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>✈️</div>
                        <h3>No {isDayTrip ? 'day trips' : 'flights'} found</h3>
                        <p>We couldn't find any {isDayTrip ? 'day trips' : 'flights'} matching your criteria. Try adjusting your dates or destinations.</p>
                    </div>
                )}

                {/* Day Trip Results */}
                {!isLoading && !error && isDayTrip && dayTripResults!.length > 0 && (
                    <>
                        <p className={styles.resultsCount}>
                            {dayTripResults!.length} day trip{dayTripResults!.length !== 1 ? 's' : ''} found
                        </p>
                        <div className={styles.resultsList}>
                            {dayTripResults!.map(trip => (
                                <DayTripCard key={trip.id} trip={trip} date={searchQuery.departureDate} />
                            ))}
                        </div>
                    </>
                )}

                {/* Regular Flight Results */}
                {!isLoading && !error && !isDayTrip && currentResults.length > 0 && (
                    <>
                        <p className={styles.resultsCount}>
                            {currentResults.length} flight{currentResults.length !== 1 ? 's' : ''} found
                            {useGroupedLayout ? ` · ${uniqueDestinationKeys.length} destinations` : ''}
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
                    </>
                )}
            </div>
        </div>
    );
}
