export function formatDateToUnix(date: string) {
  return new Date(date).getTime() / 1000
}
