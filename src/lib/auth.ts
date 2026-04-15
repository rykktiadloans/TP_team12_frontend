import { api } from "./api.ts"

export async function login({ backendUrl, username, password }) {
  localStorage.setItem('backendUrl', backendUrl)

  const res = await api.post('/token/', {
    username,
    password,
  })

  const { access, refresh } = res.data

  localStorage.setItem('accessToken', access)
  localStorage.setItem('refreshToken', refresh)

  return res.data
}

export function logout() {
  localStorage.removeItem("accessToken")
  localStorage.removeItem("refreshToken")
}