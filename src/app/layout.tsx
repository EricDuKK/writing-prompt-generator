import type { Metadata } from 'next';
import { Lora } from 'next/font/google';
import Script from 'next/script';
import { ThemeProvider } from 'next-themes';
import '@/styles/globals.css';

const lora = Lora({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-lora',
});

export const metadata: Metadata = {
  title: 'GenreGenie: AI Writing Prompt Generator & Story Ideas',
  description:
    'GenreGenie is the best writing prompt generator. Our writing prompt generator creates story ideas. Try this free writing prompt generator!',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  metadataBase: new URL('https://genregenie.top/'),
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
    <html lang="en" className={lora.variable} suppressHydrationWarning>
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-7EN7FET9YX"
          strategy="lazyOnload"
        />
        <Script id="google-analytics" strategy="lazyOnload">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-7EN7FET9YX');
          `}
        </Script>
        <Script id="microsoft-clarity" strategy="lazyOnload">
          {`
            (function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "vu5pt7a2w9");
          `}
        </Script>
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
