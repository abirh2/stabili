export function matchesCategoricalValue(value: string | null | undefined, selectedValues: readonly string[]): boolean {
  return selectedValues.length === 0 || (value != null && selectedValues.includes(value));
}

export function managementAvailability(hasManagementName: boolean): 'available' | 'unavailable' {
  return hasManagementName ? 'available' : 'unavailable';
}

export interface FilterableOption {
  label: string;
  value: string;
}

export function filterOptionsByQuery(options: readonly FilterableOption[], query: string): FilterableOption[] {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  if (!normalizedQuery) return [...options];
  return options.filter((option) => option.label.toLocaleLowerCase().includes(normalizedQuery));
}
