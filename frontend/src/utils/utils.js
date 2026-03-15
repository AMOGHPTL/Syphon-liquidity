export function getReverseTokens(TokenName) {
  const Tokens = Object.fromEntries(
    Object.entries(TokenName).map(([name, addr]) => [addr, name]),
  );
  return Tokens;
}

export function shortenHash(hash, start = 4, end = 4) {
  if (!hash) return "";
  return `${hash.slice(0, start)}....${hash.slice(-end)}`;
}

export function formatNumber(num) {
  if (num >= 1_000_000_000)
    return (num / 1_000_000_000).toFixed(1).replace(/\.0$/, "") + "B";
  if (num >= 1_000_000)
    return (num / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (num >= 1_000) return (num / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return num.toString();
}
