/** Letter APIs use `{ success, data }` — unwrap like CRA letterService. */
export function letterDataOf<T>(body: unknown): T {
  if (body && typeof body === "object" && "data" in body) {
    return (body as { data: T }).data;
  }
  return body as T;
}
