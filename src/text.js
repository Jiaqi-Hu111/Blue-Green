// Presentation only: retain historical notebook text byte-for-byte in storage.
// These specific biological phrases can occur in records from earlier releases.
export function neutralGrowthText(text) {
  return String(text ?? "").replace(
    /\b(?:full colon(?:ization|isation)|colon(?:ization|isation|izing|ising|ized|ised|izes|ises|ize|ise))\b/gi,
    (term) => {
      const lower = term.toLowerCase();
      const replacement = lower.startsWith("full ") ? "full mycelium growth"
        : /(?:ization|isation)$/.test(lower) ? "mycelium growth"
        : /(?:izing|ising)$/.test(lower) ? "growing through"
        : /(?:ized|ised)$/.test(lower) ? "grown through"
        : /(?:izes|ises)$/.test(lower) ? "grows through" : "grow through";
      if (term === term.toUpperCase()) return replacement.toUpperCase();
      if (lower.startsWith("full ") && term[0] === "F") return "Full Mycelium Growth";
      return term[0] === term[0].toUpperCase()
        ? replacement[0].toUpperCase() + replacement.slice(1) : replacement;
    },
  );
}
