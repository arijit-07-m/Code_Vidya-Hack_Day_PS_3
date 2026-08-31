import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ClubOps AI',
  description: 'AI-powered operating system for college clubs',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}