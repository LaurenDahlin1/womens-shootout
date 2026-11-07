export function withBase(path = "/") {
  if (
    path.startsWith("#") ||
    path.startsWith("http://") ||
    path.startsWith("https://") ||
    path.startsWith("mailto:")
  ) {
    return path;
  }

  const base = import.meta.env.BASE_URL;
  if (path === "/" || path === "") return base;
  return `${base}${path.replace(/^\//, "")}`;
}

export function pagePath() {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  let pathname = window.location.pathname.replace(/\/$/, "") || "/";
  if (base && (pathname === base || pathname.startsWith(`${base}/`))) {
    pathname = pathname.slice(base.length) || "/";
  }
  return pathname.startsWith("/") ? pathname : `/${pathname}`;
}
