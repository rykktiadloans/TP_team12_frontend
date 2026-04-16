import axios from "axios"

function getBaseUrl() {
  const backend = sessionStorage.getItem("backendUrl") || "http://localhost:8000"
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