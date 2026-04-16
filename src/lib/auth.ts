import { api } from "./api.ts"

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
export async function login({ backendUrl, username, password }) {
  sessionStorage.setItem('backendUrl', backendUrl)

  const res = await api.post('/token/', {
    username,
    password,
  })

  const { access, refresh } = res.data

  sessionStorage.setItem('accessToken', access)
  sessionStorage.setItem('refreshToken', refresh)

  return res.data
}

export function logout() {
  sessionStorage.removeItem("accessToken")
  sessionStorage.removeItem("refreshToken")
}