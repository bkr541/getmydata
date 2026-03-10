'use client';

import React, { useState, useEffect } from 'react';
import { useSearch, FlightSearchQuery } from '@/context/SearchContext';
import styles from './SearchForm.module.css';

export default function SearchForm() {
    const { searchQuery, setSearchQuery, setIsLoading, setFlightResults, setError, addRecentSearch } = useSearch();

    const [origin, setOrigin] = useState(searchQuery.origin);
    const [destination, setDestination] = useState(searchQuery.destination);
    const [departureDate, setDepartureDate] = useState(searchQuery.departureDate);
    const [isValid, setIsValid] = useState(false);

    useEffect(() => {
        setOrigin(searchQuery.origin);
        setDestination(searchQuery.destination);
        setDepartureDate(searchQuery.departureDate);
    }, [searchQuery]);

    useEffect(() => {
        const isOriginValid = origin.length === 3;
        // destination is optional, but if entered it should be 3 chars OR start with CITY:
        const isDestinationValid = destination.length === 0 || destination.length === 3 || destination.startsWith('CITY:');
        const isDifferent = origin !== destination;
        const isDateValid = departureDate.length > 0;

        setIsValid(isOriginValid && isDestinationValid && isDifferent && isDateValid);
    }, [origin, destination, departureDate]);

    const handleOriginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setOrigin(e.target.value.toUpperCase().slice(0, 3).replace(/[^A-Z]/g, ''));
    };

    const handleDestinationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value.toUpperCase().replace(/[^A-Z:\s]/g, '');
        if (!val.startsWith('CITY:') && !"CITY:".startsWith(val)) {
            val = val.slice(0, 3).replace(/[^A-Z]/g, '');
        }
        setDestination(val);
    };

    const handleSwap = () => {
        const temp = origin;
        setOrigin(destination);
        setDestination(temp);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isValid) return;

        const query: FlightSearchQuery = { origin, destination, departureDate };
        setSearchQuery(query);
        addRecentSearch(query);

        setIsLoading(true);
        setError(null);
        setFlightResults(null);

        try {
            const response = await fetch('/api/flights/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(query),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to search flights');
            }

            setFlightResults(data.flights);
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className={styles.searchForm}>
            <div className={styles.inputGroup}>
                <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                    <label htmlFor="origin" className="form-label">From (IATA)</label>
                    <input
                        id="origin"
                        type="text"
                        className="form-input"
                        value={origin}
                        onChange={handleOriginChange}
                        placeholder="e.g. JFK"
                        maxLength={3}
                        autoComplete="off"
                        required
                    />
                </div>

                <button type="button" className={`btn-icon ${styles.swapBtn}`} onClick={handleSwap} aria-label="Swap origin and destination" title="Swap origin and destination">
                    ⇄
                </button>

                <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                    <label htmlFor="destination" className="form-label">To (IATA)</label>
                    <input
                        id="destination"
                        type="text"
                        className="form-input"
                        value={destination}
                        onChange={handleDestinationChange}
                        placeholder="e.g. LHR or CITY:CHICAGO"
                        autoComplete="off"
                    />
                </div>
            </div>

            <div className="form-group" style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>
                <label htmlFor="departureDate" className="form-label">Departure Date</label>
                <input
                    id="departureDate"
                    type="date"
                    className="form-input"
                    value={departureDate}
                    onChange={(e) => setDepartureDate(e.target.value)}
                    required
                />
            </div>

            {origin === destination && origin.length === 3 && (
                <p className="error-text">Origin and destination cannot be the same.</p>
            )}

            <button
                type="submit"
                className="btn btn-primary"
                disabled={!isValid}
                style={{ marginTop: '1rem' }}
            >
                Search Flights
            </button>
        </form>
    );
}
