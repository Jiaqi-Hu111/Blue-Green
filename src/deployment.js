export const BUILD_SHA =
  typeof __BUILD_SHA__ === "string" ? __BUILD_SHA__ : "development";
export function releaseURL(base, sha, location = window.location) {
  const url = new URL(base, location.origin);
  url.searchParams.set("__bluegreen_update", sha);
  return url;
}
export function cleanReleaseMarker(
  location = window.location,
  history = window.history,
) {
  const url = new URL(location.href);
  if (url.searchParams.has("__bluegreen_update")) {
    url.searchParams.delete("__bluegreen_update");
    history.replaceState(
      history.state,
      "",
      `${url.pathname}${url.search}${url.hash}`,
    );
  }
}
export async function checkDeployment({
  fetcher = fetch,
  base = import.meta.env.BASE_URL,
  sha = BUILD_SHA,
  signal,
} = {}) {
  const response = await fetcher(`${base}version.json?check=${Date.now()}`, {
    cache: "no-store",
    credentials: "same-origin",
    signal,
    headers: { Accept: "application/json" },
  });
  if (!response.ok) return null;
  const data = await response.json();
  return data.schema === 1 &&
    /^[a-f0-9]{40}$/i.test(data.sha) &&
    data.sha !== sha
    ? data.sha
    : null;
}
