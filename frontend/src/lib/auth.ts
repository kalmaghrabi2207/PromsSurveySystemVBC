export function getToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("accessToken");
}

export function setToken(token: string) {
  window.localStorage.setItem("accessToken", token);
}

export function clearToken() {
  window.localStorage.removeItem("accessToken");
}

