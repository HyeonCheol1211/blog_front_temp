import { apiClient } from './client.js'

export async function getCategoryList(userId) {
  const { data } = await apiClient.get(`/api/users/${encodeURIComponent(userId)}/categories`)
  return data
}

export async function getCategoryPosts(categoryId) {
  const { data } = await apiClient.get(`/api/categories/${categoryId}/posts`)
  return data
}
