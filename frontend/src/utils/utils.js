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