/**
 * Copy the selected FileList before clearing the input.
 *
 * A FileList is live: assigning `input.value = ''` empties the same FileList
 * object that was previously read from `input.files`. The copy must happen
 * first or every multi-file selection silently becomes an empty array.
 */
export function copySelectedFilesAndReset(
  input: Pick<HTMLInputElement, 'files' | 'value'>
): File[] {
  const files = input.files ? Array.from(input.files) : [];
  input.value = '';
  return files;
}
