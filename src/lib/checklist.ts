export interface ChecklistItem {
  id: string;
  title: string;
  done: boolean;
}

export function parseChecklist(value?: string): ChecklistItem[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed
        .map((item, index) => ({
          id: String(item.id || `item_${index}`),
          title: String(item.title || '').trim(),
          done: Boolean(item.done),
        }))
        .filter(item => item.title);
    }
  } catch {
    // Fall back to newline parsing for older/free-form values.
  }

  return value
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map((title, index) => ({ id: `item_${index}`, title, done: false }));
}

export function serializeChecklist(items: ChecklistItem[]) {
  return JSON.stringify(items.map(item => ({ id: item.id, title: item.title.trim(), done: item.done })).filter(item => item.title));
}

export function checklistProgress(value?: string) {
  const items = parseChecklist(value);
  const done = items.filter(item => item.done).length;
  return { total: items.length, done, percent: items.length === 0 ? 0 : Math.round((done / items.length) * 100) };
}
