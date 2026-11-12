/** Page buttons to show: all when ≤7, else 1 … (page±1) … last. */
export const paginationItems = (
  page: number,
  pages: number,
): Array<number | "ellipsis"> => {
  if (pages <= 7) {
    return Array.from({ length: Math.max(pages, 0) }, (_, i) => i + 1);
  }
  const items: Array<number | "ellipsis"> = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(pages - 1, page + 1);
  if (start > 2) items.push("ellipsis");
  for (let i = start; i <= end; i += 1) items.push(i);
  if (end < pages - 1) items.push("ellipsis");
  items.push(pages);
  return items;
};
