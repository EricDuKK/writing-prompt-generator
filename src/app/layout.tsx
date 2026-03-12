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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "GenreGenie",
              "alternateName": "Genre Genie",
              "url": "https://genregenie.top/"
            })
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "GenreGenie",
              "url": "https://genregenie.top/",
              "logo": "https://genregenie.top/images/logo.png"
            })
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              "mainEntity": [
                {
                  "@type": "Question",
                  "name": "What is GenreGenie?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "GenreGenie is a free AI-powered writing prompt generator that creates customized writing prompts across multiple genres. It helps writers overcome creative blocks by generating unique story ideas, character concepts, and plot hooks tailored to your preferred genre and style."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Is GenreGenie free to use?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes! GenreGenie offers a free plan with 15 daily credits. You can generate writing prompts, translate them, and use AI editing features. For more daily credits and advanced models, you can upgrade to our Basic or Pro plans."
                  }
                },
                {
                  "@type": "Question",
                  "name": "What genres does the writing prompt generator support?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "GenreGenie supports a wide range of genres including Epic Fantasy, Sci-Fi Adventure, Thriller & Mystery, Romance & Drama, Horror & Dark Fiction, Business Email, Academic Paper, Product Documentation, Sales Copy, and Social Media Post. Each genre comes with specialized customization options."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Can I generate full text content from a writing prompt?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes! After generating a writing prompt, you can use the \"Generate Content\" feature to create full text based on your prompt. You can also continue generating more content or use AI Edit to refine the output."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Does GenreGenie support multiple languages?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes, GenreGenie supports multi-language translation. You can generate writing prompts in English and translate them into other languages, or use the translation feature to work with prompts in your preferred language."
                  }
                },
                {
                  "@type": "Question",
                  "name": "What AI models power GenreGenie?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "GenreGenie uses advanced AI language models to generate high-quality writing prompts. Free and Basic plan users get access to standard models, while Pro plan users can use advanced models for higher quality and longer outputs."
                  }
                },
                {
                  "@type": "Question",
                  "name": "How do credits work?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Each AI action (generating prompts, translating, editing, etc.) costs a certain number of credits. Daily credits refresh every day based on your plan. You can also purchase credit packs that never expire and are used after your daily credits run out."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Can I save my generated prompts and content?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes! All your generated prompts and content are automatically saved to your account. You can view, copy, and manage them from the Dashboard under \"My Works\"."
                  }
                }
              ]
            })
          }}
        />
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
