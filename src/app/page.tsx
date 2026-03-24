'use client';

import SearchForm from '@/components/SearchForm';
import RecentSearches from '@/components/RecentSearches';
import FlightResultsScreen from '@/components/FlightResultsScreen';
import { SearchProvider, useSearch } from '@/context/SearchContext';

function HomeContent() {
  const { showResults } = useSearch();

  if (showResults) {
    return <FlightResultsScreen />;
  }

  return (
    <main className="container">
      <header className="header">
        <h1>FlightSearch</h1>
        <p>Find your next destination</p>
      </header>

      <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <section className="card">
          <SearchForm />
        </section>

        <RecentSearches />
      </div>
    </main>
  );
}

export default function Home() {
  return (
    <SearchProvider>
      <HomeContent />
    </SearchProvider>
  );
}
