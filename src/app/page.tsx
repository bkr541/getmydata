import SearchForm from '@/components/SearchForm';
import RecentSearches from '@/components/RecentSearches';
import FlightResults from '@/components/FlightResults';
import { SearchProvider } from '@/context/SearchContext';

export default function Home() {
  return (
    <SearchProvider>
      <main className="container">
        <header className="header">
          <h1>FlightSearch</h1>
          <p>Find your next destination</p>
        </header>

        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <section className="card">
            <SearchForm />
          </section>

          <RecentSearches />

          <FlightResults />
        </div>
      </main>
    </SearchProvider>
  );
}
