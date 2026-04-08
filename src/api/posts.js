import { apiClient } from './client.js'

// ── 정렬 타입 enum 상수 ─────────────────────────────────────────
export const POST_SORT_TYPE = {
  LATEST:       'LATEST',
  WEEKLY_LIKE:  'WEEKLY_LIKE',
  MONTHLY_LIKE: 'MONTHLY_LIKE',
  YEARLY_LIKE:  'YEARLY_LIKE',
}

/**
 * 게시글 목록 조회
 * @param {string} postSortType - POST_SORT_TYPE 중 하나
 */
export async function getPosts(postSortType = POST_SORT_TYPE.LATEST) {
  const { data } = await apiClient.get('/api/posts/list', {
    params: { postSortType },
  })
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

export async function getUserPosts(userId) {
  const { data } = await apiClient.get(`/api/users/${encodeURIComponent(userId)}/posts`)
  return data
}

/**
 * 좋아요 추가 / 취소
 * 409 → 이미 처리된 요청 (정상 예외 흐름)
 */
export async function addPostLike(id) {
  const { data } = await apiClient.post(`/api/posts/${id}/like`)
  return data
}

export async function removePostLike(id) {
  const { data } = await apiClient.delete(`/api/likes/${id}`)
  return data
}

export async function getLikeUserList(postId) {
  const { data } = await apiClient.get(`/api/posts/${postId}/likes`)
  return data
}
