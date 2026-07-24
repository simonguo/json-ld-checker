export type JsonPath = readonly (string | number)[];

const identifierPattern = /^[@A-Za-z_$][@A-Za-z0-9_$-]*$/;

export function formatJsonPath(path?: JsonPath): string {
  if (!path || path.length === 0) return '$';

  return path.reduce<string>((result, segment) => {
    if (typeof segment === 'number') return `${result}[${segment}]`;
    if (identifierPattern.test(segment)) return `${result}.${segment}`;
    return `${result}[${JSON.stringify(segment)}]`;
  }, '$');
}

export function serializeJsonPath(path: JsonPath): string {
  return JSON.stringify(path);
}

export function pathsEqual(left?: JsonPath, right?: JsonPath): boolean {
  if (!left || !right || left.length !== right.length) return false;
  return left.every((segment, index) => segment === right[index]);
}

export function isPathAncestor(ancestor: JsonPath, target: JsonPath): boolean {
  if (ancestor.length > target.length) return false;
  return ancestor.every((segment, index) => segment === target[index]);
}

export function treeKeyPathToJsonPath(keyPath: readonly (string | number)[]): JsonPath {
  const withoutRoot = keyPath[keyPath.length - 1] === 'root' ? keyPath.slice(0, -1) : keyPath;
  return [...withoutRoot].reverse();
}

export function getValueAtJsonPath(data: unknown, path: JsonPath): unknown {
  let current = data;
  for (const segment of path) {
    if (current === null || current === undefined || typeof current !== 'object') return undefined;
    if (!(segment in current)) return undefined;
    current = (current as Record<string | number, unknown>)[segment];
  }
  return current;
}

export function resolveExistingJsonPath(data: unknown, requestedPath: JsonPath): {
  path: JsonPath;
  exact: boolean;
} {
  const existing: Array<string | number> = [];
  let current = data;

  for (const segment of requestedPath) {
    if (current === null || current === undefined || typeof current !== 'object' || !(segment in current)) {
      return { path: existing, exact: false };
    }
    existing.push(segment);
    current = (current as Record<string | number, unknown>)[segment];
  }

  return { path: existing, exact: true };
}
