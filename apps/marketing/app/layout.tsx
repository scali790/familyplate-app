import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://familyplate.ai'),
  title: {
    default: 'FamilyPlate: Family Meal Planning App with Voting',
    template: '%s | FamilyPlate',
  },
  description: 'AI-powered family meal planning app where everyone votes. Create weekly meal plans your whole family loves.',
  keywords: ['family meal planning', 'meal planner app', 'AI meal planning', 'weekly meal planner', 'family voting', 'dietary restrictions'],
  authors: [{ name: 'FamilyPlate' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://familyplate.ai',
    siteName: 'FamilyPlate',
    title: 'FamilyPlate: End Dinner Debates with Family Voting',
    description: 'AI-powered meal planning where everyone votes. Create weekly meal plans your whole family actually wants to eat.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'FamilyPlate - Family Meal Planning App',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FamilyPlate: Family Meal Planning with Voting',
    description: 'AI-powered meal planning where everyone votes. Stop dinner debates.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
