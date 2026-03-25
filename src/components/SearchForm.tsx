'use client';

import React, { useState, useEffect } from 'react';
import { useSearch, FlightSearchQuery } from '@/context/SearchContext';
import styles from './SearchForm.module.css';

export default function SearchForm() {
    // This block fixes the linter error regarding setReturnFlightResults in SearchForm
    // Replacing the SearchForm inner state extraction
    const { searchQuery, setSearchQuery, setIsLoading, setFlightResults, setReturnFlightResults, setDayTripResults, setError, addRecentSearch, setShowResults } = useSearch();

    const [origin, setOrigin] = useState(searchQuery.origin);
    const [destination, setDestination] = useState(searchQuery.destination);
    const [departureDate, setDepartureDate] = useState(searchQuery.departureDate);
    const [returnDate, setReturnDate] = useState(searchQuery.returnDate || '');
    const [layoverTime, setLayoverTime] = useState(searchQuery.layoverTime ?? 6);
    const [nonstopDayTrip, setNonstopDayTrip] = useState(searchQuery.nonstopDayTrip ?? true);
    const [isValid, setIsValid] = useState(false);

    const [tripType, setTripType] = useState('One Way');
    const [searchAllLocations, setSearchAllLocations] = useState(false);
    const [isExpanded, setIsExpanded] = useState(true);
    const [isSnapshotsExpanded, setIsSnapshotsExpanded] = useState(true);
    const [snapshotIata, setSnapshotIata] = useState('');
    const [snapshotDate, setSnapshotDate] = useState('');
    const tripTypes = ['One Way', 'Round Trip', 'Day Trip', 'Multi City'];

    useEffect(() => {
        setOrigin(searchQuery.origin);
        setDestination(searchQuery.destination);
        setDepartureDate(searchQuery.departureDate);
        if (searchQuery.returnDate !== undefined) setReturnDate(searchQuery.returnDate);
        if (searchQuery.layoverTime !== undefined) setLayoverTime(searchQuery.layoverTime);
        if (searchQuery.nonstopDayTrip !== undefined) setNonstopDayTrip(searchQuery.nonstopDayTrip);
    }, [searchQuery]);

    useEffect(() => {
        if (tripType === 'Day Trip') {
            setDestination('');
            setSearchAllLocations(false);
        }
    }, [tripType]);

    useEffect(() => {
        const isOriginValid = origin.length === 0 || origin.length === 3;
        const isDestinationValid = destination.length === 0 || destination.length === 3 || destination.startsWith('CITY:');

        const hasRequiredField = tripType === 'Day Trip'
            ? origin.length === 3
            : (origin.length === 3 || destination.length >= 3);

        const isDifferent = origin !== destination || (origin === '' && destination === '');
        const isDateValid = departureDate.length > 0;
        const isReturnDateValid = tripType === 'Round Trip' ? returnDate.length > 0 : true;
        const bothFilledError = searchAllLocations && origin.length > 0 && destination.length > 0;

        setIsValid(!bothFilledError && isOriginValid && isDestinationValid && hasRequiredField && isDifferent && isDateValid && isReturnDateValid);
    }, [origin, destination, departureDate, returnDate, searchAllLocations, tripType]);

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

        const query: FlightSearchQuery = { origin, destination, departureDate, returnDate: tripType === 'Round Trip' ? returnDate : undefined, layoverTime, nonstopDayTrip };
        setSearchQuery(query);
        addRecentSearch(query);

        setIsLoading(true);
        setShowResults(true);
        setError(null);
        setFlightResults(null);
        setReturnFlightResults(null);
        setDayTripResults(null);

        try {
            let response;
            if (tripType === 'Day Trip') {
                // Day trips endpoint
                response = await fetch(`/api/flights/dayTrips?origin=${origin}&date=${departureDate}&layovertime=${layoverTime}&nonstop=${nonstopDayTrip}`);
            } else if (!origin && destination) {
                // Inbound search: only destination and date are provided
                response = await fetch(`/api/flights/inbound?destination=${destination}&date=${departureDate}`);
            } else if (tripType === 'Round Trip') {
                response = await fetch('/api/flights/roundTrip', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(query),
                });
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

            if (tripType === 'Round Trip') {
                setFlightResults(data.outboundFlights || []);
                setReturnFlightResults(data.returnFlights || []);
            } else if (tripType === 'Day Trip') {
                setFlightResults(data.flights || []);
                setDayTripResults(data.dayTrips || []);
            } else {
                setFlightResults(data.flights || []);
                setReturnFlightResults(null);
            }
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div className={styles.collapsibleGroup}>
            <button
                type="button"
                className={styles.collapsibleHeader}
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <span>Search Flights</span>
                <svg
                    className={`${styles.chevron} ${isExpanded ? styles.chevronUp : ''}`}
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </button>
        <form onSubmit={handleSubmit} className={`${styles.searchForm} ${isExpanded ? '' : styles.hidden}`}>
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
                            {tripType === 'Day Trip' ? 'Origin (IATA)' : 'From (IATA)'}
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

                    {tripType !== 'Day Trip' && (
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
                </div>

                <div className={styles.inputGroup} style={{ marginTop: '1rem' }}>
                    <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
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

                    {tripType === 'Round Trip' && (
                        <>
                            <div style={{ width: '40px', flexShrink: 0 }} />
                            <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                                <label htmlFor="returnDate" className="form-label">Return Date</label>
                                <input
                                    id="returnDate"
                                    type="date"
                                    className="form-input"
                                    value={returnDate}
                                    onChange={(e) => setReturnDate(e.target.value)}
                                    required
                                />
                            </div>
                        </>
                    )}
                </div>

            {tripType === 'Day Trip' && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.5rem', marginTop: '1rem' }}>
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
                    <div className={styles.searchAllContainer} style={{ justifyContent: 'flex-start', marginTop: '1.75rem' }}>
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

            {tripType !== 'Day Trip' && (
                <div className={styles.searchAllContainer} style={{ marginTop: '0.75rem' }}>
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
        </div>

        <div className={styles.collapsibleGroup}>
            <button
                type="button"
                className={styles.collapsibleHeader}
                onClick={() => setIsSnapshotsExpanded(!isSnapshotsExpanded)}
            >
                <span>Snapshots</span>
                <svg
                    className={`${styles.chevron} ${isSnapshotsExpanded ? styles.chevronUp : ''}`}
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </button>
            <div className={`${styles.snapshotBody} ${isSnapshotsExpanded ? '' : styles.hidden}`}>
                <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
                    <label htmlFor="snapshotIata" className="form-label">IATA</label>
                    <input
                        id="snapshotIata"
                        type="text"
                        className="form-input"
                        value={snapshotIata}
                        onChange={(e) => setSnapshotIata(e.target.value.toUpperCase().slice(0, 3).replace(/[^A-Z]/g, ''))}
                        placeholder="e.g. JFK"
                        maxLength={3}
                        autoComplete="off"
                    />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                    <label htmlFor="snapshotDate" className="form-label">Date</label>
                    <input
                        id="snapshotDate"
                        type="date"
                        className="form-input"
                        value={snapshotDate}
                        onChange={(e) => setSnapshotDate(e.target.value)}
                    />
                </div>
                <button
                    type="button"
                    className="btn btn-primary"
                    style={{ alignSelf: 'flex-end', width: 'fit-content', flexShrink: 0, whiteSpace: 'nowrap' }}
                >
                    Take Snapshot
                </button>
            </div>
        </div>
        </div>
    );
}
