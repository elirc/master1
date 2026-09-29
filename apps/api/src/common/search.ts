export function normalizeSearchTerm(value?: string): string | undefined {
  const term = value?.trim().replace(/\s+/g, " ");
  return term && term.length >= 2 ? term : undefined;
}

export function containsSearch(term: string) {
  return {
    contains: term,
    mode: "insensitive" as const
  };
}
