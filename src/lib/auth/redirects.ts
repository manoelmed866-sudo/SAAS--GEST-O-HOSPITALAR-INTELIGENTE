const DEFAULT_NEXT_PATH = "/painel";
const PROTECTED_NEXT_PREFIX = `${DEFAULT_NEXT_PATH}/`;
const LOCAL_ORIGIN = "https://app.local";

function hasControlCharacter(value: string): boolean {
  return /[\u0000-\u001F\u007F]/.test(value);
}

export function getSafeNextPath(
  value: FormDataEntryValue | string | null | undefined,
): string {
  if (typeof value !== "string") {
    return DEFAULT_NEXT_PATH;
  }

  const nextPath = value.trim();

  if (
    nextPath.length === 0 ||
    !nextPath.startsWith("/") ||
    nextPath.startsWith("//") ||
    nextPath.includes("\\") ||
    hasControlCharacter(nextPath)
  ) {
    return DEFAULT_NEXT_PATH;
  }

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(nextPath, LOCAL_ORIGIN);
  } catch {
    return DEFAULT_NEXT_PATH;
  }

  if (
    parsedUrl.origin !== LOCAL_ORIGIN ||
    (parsedUrl.pathname !== DEFAULT_NEXT_PATH &&
      !parsedUrl.pathname.startsWith(PROTECTED_NEXT_PREFIX))
  ) {
    return DEFAULT_NEXT_PATH;
  }

  return `${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`;
}

export function getLoginPath(nextPath: string = DEFAULT_NEXT_PATH): string {
  return `/login?next=${encodeURIComponent(getSafeNextPath(nextPath))}`;
}
