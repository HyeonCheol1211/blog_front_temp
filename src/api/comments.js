import { apiClient } from './client.js'

export async function createComment(postId, content) {
  const { data } = await apiClient.post(`/api/comments/${postId}`, {
    content,
  })
  return data
}

export async function updateComment(commentId, content) {
  const { data } = await apiClient.put(`/api/comments/${commentId}`, {
    content,
  })
  return data
}

export async function deleteComment(commentId) {
  await apiClient.delete(`/api/comments/${commentId}`)
}

export async function getMyComments() {
  const { data } = await apiClient.get('/api/comments')
  return data
}
