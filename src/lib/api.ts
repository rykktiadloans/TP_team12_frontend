import axios from "axios"

function getDefaultBackendUrl() {
  if (typeof window === "undefined") {
    return "http://127.0.0.1:8000"
  }

  const host = window.location.hostname || "127.0.0.1"
  return `${window.location.protocol}//${host}:8000`
}

function getBaseUrl() {
  const backend = sessionStorage.getItem("backendUrl") || getDefaultBackendUrl()
  return `${backend}/api`
}

export const api = axios.create()

api.interceptors.request.use((config) => {
  // base URL
  config.baseURL = getBaseUrl()

  // 🔐 access token
  const token = sessionStorage.getItem("accessToken")
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})
