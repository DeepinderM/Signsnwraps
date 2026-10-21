/** Accepted payment methods (Stripe Checkout shows Apple Pay on Safari/Apple devices and Google Pay on Chrome/Android). */
const marks = [
  { label: "Visa", className: "is-visa" },
  { label: "Mastercard", className: "is-mc" },
  { label: "Amex", className: "is-amex" },
  { label: "Apple Pay", className: "is-apple" },
  { label: "Google Pay", className: "is-google" },
];

export function PaymentMarks({ className = "" }: { className?: string }) {
  return <ul className={`pay-marks ${className}`} aria-label="Accepted payment methods">
    {marks.map((mark) => <li key={mark.label} className={mark.className}>{mark.label}</li>)}
  </ul>;
}
