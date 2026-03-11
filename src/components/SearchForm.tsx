'use client';

import React, { useState, useEffect } from 'react';
import { useSearch, FlightSearchQuery } from '@/context/SearchContext';
import styles from './SearchForm.module.css';

export default function SearchForm() {
    const { searchQuery, setSearchQuery, setIsLoading, setFlightResults, setError, addRecentSearch } = useSearch();

    const [origin, setOrigin] = useState(searchQuery.origin);
    const [destination, setDestination] = useState(searchQuery.destination);
    const [departureDate, setDepartureDate] = useState(searchQuery.departureDate);
    const [layoverTime, setLayoverTime] = useState(searchQuery.layoverTime ?? 6);
    const [nonstopDayTrip, setNonstopDayTrip] = useState(searchQuery.nonstopDayTrip ?? true);
    const [isValid, setIsValid] = useState(false);

    const [tripType, setTripType] = useState('One Way');
    const [searchAllLocations, setSearchAllLocations] = useState(false);
    const tripTypes = ['One Way', 'Round Trip', 'Same Day', 'Multi City'];

    useEffect(() => {
        setOrigin(searchQuery.origin);
        setDestination(searchQuery.destination);
        setDepartureDate(searchQuery.departureDate);
        if (searchQuery.layoverTime !== undefined) setLayoverTime(searchQuery.layoverTime);
        if (searchQuery.nonstopDayTrip !== undefined) setNonstopDayTrip(searchQuery.nonstopDayTrip);
    }, [searchQuery]);

    useEffect(() => {
        if (tripType === 'Same Day') {
            setDestination('');
            setSearchAllLocations(false);
        }
    }, [tripType]);

    useEffect(() => {
        const isOriginValid = origin.length === 0 || origin.length === 3;
        const isDestinationValid = destination.length === 0 || destination.length === 3 || destination.startsWith('CITY:');

        const hasRequiredField = tripType === 'Same Day'
            ? origin.length === 3
            : (origin.length === 3 || destination.length >= 3);

        const isDifferent = origin !== destination || (origin === '' && destination === '');
        const isDateValid = departureDate.length > 0;
        const bothFilledError = searchAllLocations && origin.length > 0 && destination.length > 0;

        setIsValid(!bothFilledError && isOriginValid && isDestinationValid && hasRequiredField && isDifferent && isDateValid);
    }, [origin, destination, departureDate, searchAllLocations, tripType]);

    const disableOrigin = searchAllLocations && destination.length > 0;
    const disableDestination = searchAllLocations && origin.length > 0;
    const showBothFilledError = searchAllLocations && origin.length > 0 && destination.length > 0;

    const handleSearchAllToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
        const checked = e.target.checked;
        setSearchAllLocations(checked);
        if (checked) {
            if (origin && !destination) {
                setDestination('');
            } else if (destination && !origin) {
                setOrigin('');
            }
        }
    };

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

        const query: FlightSearchQuery = { origin, destination, departureDate, layoverTime, nonstopDayTrip };
        setSearchQuery(query);
        addRecentSearch(query);

        setIsLoading(true);
        setError(null);
        setFlightResults(null);

        try {
            let response;
            if (tripType === 'Same Day') {
                // Day trips endpoint
                response = await fetch(`/api/flights/dayTrips?origin=${origin}&date=${departureDate}&layovertime=${layoverTime}&nonstop=${nonstopDayTrip}`);
            } else if (!origin && destination) {
                // Inbound search: only destination and date are provided
                response = await fetch(`/api/flights/inbound?destination=${destination}&date=${departureDate}`);
            } else {
                // Outbound search
                response = await fetch('/api/flights/search', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(query),
                });
            }

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
            <div className={styles.tripTypeSelector}>
                {tripTypes.map((type) => (
                    <button
                        key={type}
                        type="button"
                        className={`${styles.tripTypeBtn} ${tripType === type ? styles.active : ''}`}
                        onClick={() => setTripType(type)}
                    >
                        {type}
                    </button>
                ))}
            </div>

            <div className={styles.inputGroup}>
                <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                    <label htmlFor="origin" className="form-label">
                        {tripType === 'Same Day' ? 'Origin (IATA)' : 'From (IATA)'}
                    </label>
                    <input
                        id="origin"
                        type="text"
                        className="form-input"
                        value={origin}
                        onChange={handleOriginChange}
                        placeholder="e.g. JFK"
                        maxLength={3}
                        autoComplete="off"
                        disabled={disableOrigin}
                    />
                </div>

                {tripType !== 'Same Day' && (
                    <>
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
                                disabled={disableDestination}
                            />
                        </div>
                    </>
                )}

                {tripType === 'Same Day' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label htmlFor="layoverTime" className="form-label">Layover Min (Hours)</label>
                            <input
                                id="layoverTime"
                                type="number"
                                className="form-input"
                                value={layoverTime}
                                onChange={(e) => setLayoverTime(parseInt(e.target.value) || 0)}
                                min={1}
                                max={24}
                                required
                            />
                        </div>
                        <div className={styles.searchAllContainer} style={{ justifyContent: 'flex-start', marginTop: '0.5rem' }}>
                            <label className={styles.toggleSwitch}>
                                <input
                                    type="checkbox"
                                    checked={nonstopDayTrip}
                                    onChange={(e) => setNonstopDayTrip(e.target.checked)}
                                />
                                <span className={styles.slider}></span>
                            </label>
                            <span>Nonstop Only</span>
                        </div>
                    </div>
                )}
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
                {tripType !== 'Same Day' && (
                    <div className={styles.searchAllContainer}>
                        <span>Search All Locations</span>
                        <label className={styles.toggleSwitch}>
                            <input
                                type="checkbox"
                                checked={searchAllLocations}
                                onChange={handleSearchAllToggle}
                            />
                            <span className={styles.slider}></span>
                        </label>
                    </div>
                )}
            </div>

            {showBothFilledError && (
                <p className="error-text">Both inputs cannot have a value while 'Search All Locations' is on.</p>
            )}
            {!showBothFilledError && origin !== '' && origin === destination && origin.length === 3 && (
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
