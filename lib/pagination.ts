export const ARTICLES_PER_PAGE = 7;

export function getPaginationParams(searchParams: {
  page?: string | string[];
}) {
  const raw = parseInt((searchParams.page as string) ?? "1", 10);
  // Clamp to 1 if the param is missing, non-numeric, or below 1
  const page = Math.max(1, isNaN(raw) ? 1 : raw);
  const skip = (page - 1) * ARTICLES_PER_PAGE;
  return { page, skip, take: ARTICLES_PER_PAGE };
}

export function getTotalPages(total: number): number {
  return Math.ceil(total / ARTICLES_PER_PAGE);
}
