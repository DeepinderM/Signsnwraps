"use client";

export function PrintButton() {
  return <button type="button" className="button button-orange" onClick={() => window.print()}>Print job sheet</button>;
}
