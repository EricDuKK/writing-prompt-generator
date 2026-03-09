import Image from 'next/image';

export function Footer() {
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
              GenreGenie — Your AI writing prompt generator for creative writing prompts across any genre.
            </p>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold text-foreground mb-3">Support</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/contact" className="text-muted-foreground hover:text-foreground transition-colors">
                  Contact Us
                </a>
              </li>
              <li>
                <a href="/about" className="text-muted-foreground hover:text-foreground transition-colors">
                  About Us
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-foreground mb-3">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="/terms" className="text-muted-foreground hover:text-foreground transition-colors">
                  Terms and Conditions
                </a>
              </li>
              <li>
                <a href="/refund" className="text-muted-foreground hover:text-foreground transition-colors">
                  Refund Policy
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="max-w-4xl mx-auto mt-8 pt-6 border-t border-border/50 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} writing-prompt-generator.top All rights reserved.
        </div>
      </div>
    </footer>
  );
}
