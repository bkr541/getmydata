import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'FlightSearch - Find your next destination',
  description: 'Search flights across the globe',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
