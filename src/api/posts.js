import { apiClient } from './client.js'

export async function getPosts() {
  const { data } = await apiClient.get('/api/posts/list')
  return data
}

export async function getPost(id) {
  const { data } = await apiClient.get(`/api/posts/${id}`)
  return data
}

export async function createPost(post) {
  const { data } = await apiClient.post('/api/posts', post)
  return data
}

export async function updatePost(id, post) {
  const { data } = await apiClient.put(`/api/posts/${id}`, post)
  return data
}

export async function deletePost(id) {
  await apiClient.delete(`/api/posts/${id}`)
}

export async function getMyPosts() {
  const { data } = await apiClient.get('/api/posts/my-list')
  return data
}
