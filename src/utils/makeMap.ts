// Make a map and return a function for checking if a key
// is in that map.
//
// IMPORTANT: all calls of this function must be prefixed with /*#__PURE__*/
// So that rollup can tree-shake them if necessary.
export function makeMap(str: string, expectsLowerCase?: boolean): (key: string) => boolean {
  const map: Record<string, boolean> = Object.create(null);
  const list: Array<string> = str.split(',');
  for (let i = 0; i < list.length; i++) {
    map[list[i]] = true;
  }
  return expectsLowerCase
    ? (val): boolean => !!map[val.toLowerCase()]
    : (val): boolean => !!map[val];
}
