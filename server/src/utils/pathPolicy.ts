import os from 'os';
import path from 'path';
type PathPolicyOptions = {
  allowTemp?: boolean;
  allowNonExisting?: boolean;
};
function isInsideRoot(candidate: string, root: string): boolean {
  const normalizedCandidate = path.normalize(candidate).toLowerCase();
  const normalizedRoot = path.normalize(root).toLowerCase();
  return normalizedCandidate === normalizedRoot || normalizedCandidate.startsWith(`${normalizedRoot}${path.sep}`);
}

function getAllowedRoots(allowTemp: boolean): string[] {
  const roots = [
    path.resolve(process.env.UPLOADS_DIR || './uploads'),
    path.resolve(process.env.PROCESSED_DIR || './processed')
  ];
  if (process.env.MEDIA_ROOT) {
    roots.push(path.resolve(process.env.MEDIA_ROOT));
  }
  if (allowTemp) {
    roots.push(path.resolve(os.tmpdir()));
  }
  return roots;
}

export function enforcePathPolicy(
  rawPath: string,
  label: string,
  options?: PathPolicyOptions
): string {
  const resolvedPath = path.resolve(rawPath);
  const roots = getAllowedRoots(options?.allowTemp ?? false);
  const pathToCheck = options?.allowNonExisting ? path.dirname(resolvedPath) : resolvedPath;
  if (!roots.some((root) => isInsideRoot(pathToCheck, root))) {
    const error = new Error(`${label} is outside allowed media roots`);
    (error as Error & { status: number }).status = 400;
    throw error;
  }
  return resolvedPath;
}
