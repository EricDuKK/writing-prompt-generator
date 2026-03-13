'use client';

import Image from 'next/image';
import { useUITranslations } from '@/i18n/use-ui-translations';

export function Footer() {
  const t = useUITranslations();

  return (
    <footer className="border-t border-border/50 bg-muted/30">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <a href="/" className="inline-block mb-3">
              <Image src="/images/logo.png" alt="GenreGenie" width={80} height={80} className="rounded-lg" />
            </a>
            <p className="text-sm text-muted-foreground">
              {t.footer.brand}
            </p>
          </div>

          {/* Support */}
          <div>
            <p className="font-semibold text-foreground mb-3">{t.footer.support}</p>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/contact" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t.footer.contactUs}
                </a>
              </li>
              <li>
                <a href="/about" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t.footer.aboutUs}
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <p className="font-semibold text-foreground mb-3">{t.footer.legal}</p>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t.footer.privacy}
                </a>
              </li>
              <li>
                <a href="/terms" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t.footer.terms}
                </a>
              </li>
              <li>
                <a href="/refund" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t.footer.refund}
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="max-w-4xl mx-auto mt-8 pt-6 border-t border-border/50 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} genregenie.top All rights reserved.
        </div>
      </div>
    </footer>
  );
}
