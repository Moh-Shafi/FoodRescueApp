// [MILESTONE 2 prep / Sub-CPMK 8] Scoped local file storage via expo-file-system.
// All app documents live inside the sandboxed documentDirectory — the app can
// only touch its own scoped storage, never arbitrary paths.

import { Directory, File, Paths } from 'expo-file-system';

function reportsDirectory(): Directory {
  const dir = new Directory(Paths.document, 'food-reports');
  if (!dir.exists) {
    dir.create({ intermediates: true });
  }
  return dir;
}

/** Persist a JSON report (e.g. rescue confirmation, KTP verification record). */
export async function saveReportJson(fileName: string, data: unknown): Promise<string> {
  const file = new File(reportsDirectory(), fileName);
  await file.write(JSON.stringify(data, null, 2));
  return file.uri;
}

export async function readReportJson<T = unknown>(fileName: string): Promise<T | null> {
  const file = new File(reportsDirectory(), fileName);
  if (!file.exists) return null;
  return JSON.parse(await file.text()) as T;
}

export function deleteReport(fileName: string): void {
  const file = new File(reportsDirectory(), fileName);
  if (file.exists) file.delete();
}
