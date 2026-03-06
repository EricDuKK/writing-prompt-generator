// Shim: no login wrapper in standalone site
export function LoginWrapper({ children, ...rest }: { children: React.ReactNode; [key: string]: any }) {
  return <>{children}</>;
}
