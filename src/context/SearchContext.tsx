'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface FlightSearchQuery {
    origin: string;
    destination: string;
    departureDate: string;
    layoverTime?: number;
    nonstopDayTrip?: boolean;
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
    isLoading: boolean;
    setIsLoading: (loading: boolean) => void;
    error: string | null;
    setError: (error: string | null) => void;
    recentSearches: FlightSearchQuery[];
    addRecentSearch: (query: FlightSearchQuery) => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export function SearchProvider({ children }: { children: ReactNode }) {
    const [searchQuery, setSearchQuery] = useState<FlightSearchQuery>({ origin: '', destination: '', departureDate: '' });
    const [flightResults, setFlightResults] = useState<FlightResult[] | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [recentSearches, setRecentSearches] = useState<FlightSearchQuery[]>([]);

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
                isLoading, setIsLoading,
                error, setError,
                recentSearches, addRecentSearch
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
