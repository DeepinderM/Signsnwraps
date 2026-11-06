// Every /wraps page sits inside .wraps-zone, which switches the whole page (header, section switch,
// footer included, via body:has(.wraps-zone)) to the darker Wraps & PPF look in theme-wraps.css.
export default function WrapsLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="wraps-zone">{children}</div>;
}
