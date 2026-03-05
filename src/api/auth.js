import { apiClient } from './client.js'

export async function login(username, password) {
  const { data } = await apiClient.post('/api/users/login', { username, password })
  return data
}

export async function register({ username, password, email }) {
  const { data } = await apiClient.post('/api/users/join', {
    username,
    password,
    email: email || null,
  })
  return data
}
