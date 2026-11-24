const REPORT_PREFIX = 'foodrescue.report.';

export async function saveReportJson(fileName: string, data: unknown): Promise<string> {
  const key = `${REPORT_PREFIX}${fileName}`;
  localStorage.setItem(key, JSON.stringify(data, null, 2));
  return `localStorage:${key}`;
}

export async function readReportJson<T = unknown>(fileName: string): Promise<T | null> {
  const value = localStorage.getItem(`${REPORT_PREFIX}${fileName}`);
  return value === null ? null : (JSON.parse(value) as T);
}

export function deleteReport(fileName: string): void {
  localStorage.removeItem(`${REPORT_PREFIX}${fileName}`);
}
