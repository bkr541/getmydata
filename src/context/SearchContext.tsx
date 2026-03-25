'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { DayTrip } from '@/services/dayTripService';

export type { DayTrip };

export interface FlightSearchQuery {
    origin: string;
    destination: string;
    departureDate: string;
    layoverTime?: number;
    nonstopDayTrip?: boolean;
    returnDate?: string;
}

export interface FlightResult {
    id: string;
    airline: string;
    flightNumber: string;
    origin: string;
    destination: string;
    departureTime: string;
    arrivalTime: string;
    duration: string;
    stops: number;
    cabin: string;
    price: number;
    currency: string;
    notes?: string;
    dayTripDestination?: string;
    rawPayload: any;
}

interface SearchContextType {
    searchQuery: FlightSearchQuery;
    setSearchQuery: (query: FlightSearchQuery) => void;
    flightResults: FlightResult[] | null;
    setFlightResults: (results: FlightResult[] | null) => void;
    returnFlightResults: FlightResult[] | null;
    setReturnFlightResults: (results: FlightResult[] | null) => void;
    dayTripResults: DayTrip[] | null;
    setDayTripResults: (results: DayTrip[] | null) => void;
    isLoading: boolean;
    setIsLoading: (loading: boolean) => void;
    error: string | null;
    setError: (error: string | null) => void;
    recentSearches: FlightSearchQuery[];
    addRecentSearch: (query: FlightSearchQuery) => void;
    showResults: boolean;
    setShowResults: (show: boolean) => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export function SearchProvider({ children }: { children: ReactNode }) {
    const [searchQuery, setSearchQuery] = useState<FlightSearchQuery>({ origin: '', destination: '', departureDate: '' });
    const [flightResults, setFlightResults] = useState<FlightResult[] | null>(null);
    const [returnFlightResults, setReturnFlightResults] = useState<FlightResult[] | null>(null);
    const [dayTripResults, setDayTripResults] = useState<DayTrip[] | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [recentSearches, setRecentSearches] = useState<FlightSearchQuery[]>([]);
    const [showResults, setShowResults] = useState(false);

    const addRecentSearch = (query: FlightSearchQuery) => {
        setRecentSearches(prev => {
            const filtered = prev.filter(s =>
                !(s.origin === query.origin && s.destination === query.destination && s.departureDate === query.departureDate)
            );
            return [query, ...filtered].slice(0, 5); // Keep top 5
        });
    };

    return (
        <SearchContext.Provider
            value={{
                searchQuery, setSearchQuery,
                flightResults, setFlightResults,
                returnFlightResults, setReturnFlightResults,
                dayTripResults, setDayTripResults,
                isLoading, setIsLoading,
                error, setError,
                recentSearches, addRecentSearch,
                showResults, setShowResults,
            }}
        >
            {children}
        </SearchContext.Provider>
    );
}

export function useSearch() {
    const context = useContext(SearchContext);
    if (context === undefined) {
        throw new Error('useSearch must be used within a SearchProvider');
    }
    return context;
}
