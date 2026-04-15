import axios from "axios"

function getBaseUrl() {
  const backend = localStorage.getItem("backendUrl") || "http://100.114.45.50:8000"
  return `${backend}/api`
}

function getProjectId() {
  return localStorage.getItem("projectId")
}

export const api = axios.create()

api.interceptors.request.use((config) => {
  // base URL
  config.baseURL = getBaseUrl()

  // 🔐 access token
  const token = localStorage.getItem("accessToken")
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  // 📦 project_id – iba pre niektoré endpointy
  const url = config.url ?? ""

  const needsProjectId =
    url.startsWith("/component") &&
    !url.includes("/component/") // list potrebuje project_id

  const needsProjectIdForDetail =
    url.startsWith("/component/") // detail tiež potrebuje

  if ((needsProjectId || needsProjectIdForDetail) && getProjectId()) {
    config.params = {
      ...(config.params || {}),
      project_id: getProjectId(),
    }
  }

  return config
})