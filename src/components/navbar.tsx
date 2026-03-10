import Image from 'next/image';
import { AuthButton } from '@/components/auth/auth-button';

export function Navbar() {
  return (
    <nav className="container mx-auto px-4 pt-4">
      <div className="flex items-center justify-between">
        <a href="/" className="flex items-center ml-4 md:ml-16 lg:ml-28">
          <Image src="/images/logo.png" alt="GenreGenie" width={120} height={120} className="rounded-lg" />
        </a>
        <div className="hidden md:flex items-center gap-8">
          <a href="/" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Home
          </a>
          <a href="/#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Features
          </a>
          <a href="/contact" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Contact
          </a>
          <a href="/about" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            About
          </a>
        </div>
        <div className="mr-4 md:mr-16 lg:mr-28">
          <AuthButton />
        </div>
      </div>
    </nav>
  );
}
