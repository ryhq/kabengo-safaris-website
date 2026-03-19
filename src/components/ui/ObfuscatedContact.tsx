"use client";

import { useState, useEffect } from "react";

export function ObfuscatedEmail({ className }: { className?: string }) {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  if (!ready) return <span className={className}>…</span>;
  const user = "info";
  const domain = "kabengosafaris.com";
  const full = `${user}@${domain}`;
  return (
    <a href={`mailto:${full}`} className={className}>
      {full}
    </a>
  );
}

export function ObfuscatedPhone({ className }: { className?: string }) {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  if (!ready) return <span className={className}>…</span>;
  const parts = ["+255", "786", "345", "408"];
  const num = parts.join("");
  const display = parts.join(" ");
  return (
    <a href={`tel:${num}`} className={className}>
      {display}
    </a>
  );
}
