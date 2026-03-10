import type { Metadata } from 'next';
import { ThemeProvider } from 'next-themes';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'GenreGenie: AI Writing Prompt Generator & Story Ideas',
  description:
    'GenreGenie is the best writing prompt generator. Our writing prompt generator creates story ideas. Try this free writing prompt generator!',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  metadataBase: new URL('https://genregenie.top'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'GenreGenie: AI Writing Prompt Generator & Story Ideas',
    description:
      'GenreGenie is the best writing prompt generator. Our writing prompt generator creates story ideas. Try this free writing prompt generator!',
    url: 'https://genregenie.top',
    siteName: 'GenreGenie',
    type: 'website',
    images: [
      {
        url: '/images/logo.png',
        width: 512,
        height: 512,
        alt: 'GenreGenie - AI Writing Prompt Generator',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: 'GenreGenie: AI Writing Prompt Generator & Story Ideas',
    description:
      'GenreGenie is the best writing prompt generator. Our writing prompt generator creates story ideas. Try this free writing prompt generator!',
    images: ['/images/logo.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
