'use client';

import React from 'react';
import { useSearch, FlightSearchQuery } from '@/context/SearchContext';
import styles from './RecentSearches.module.css';

export default function RecentSearches() {
    const { recentSearches, setSearchQuery } = useSearch();

    if (recentSearches.length === 0) return null;

    return (
        <div className={styles.container}>
            <h3 className={styles.title}>Recent Searches</h3>
            <div className={styles.tags}>
                {recentSearches.map((search: FlightSearchQuery, index: number) => (
                    <button
                        key={index}
                        className={styles.tag}
                        onClick={() => setSearchQuery(search)}
                    >
                        <span className={styles.route}>{search.origin} → {search.destination}</span>
                        <span className={styles.date}>{search.departureDate}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
