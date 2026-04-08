import { apiClient } from './client.js'

export async function getUserProfileBasic(userId) {
  const { data } = await apiClient.get(`/api/users/profile/basic/${encodeURIComponent(userId)}`)
  return data
}

export async function getUserProfileExtra(userId) {
  const { data } = await apiClient.get(`/api/users/profile/extra/${encodeURIComponent(userId)}`)
  return data
}

/**
 * 팔로우 추가 / 취소
 * 409 → 이미 팔로우 중 (정상 예외 흐름)
 */
export async function addFollow(userId) {
  const { data } = await apiClient.post(`/api/follows/${encodeURIComponent(userId)}`)
  return data
}

export async function removeFollow(userId) {
  const { data } = await apiClient.delete(`/api/follows/${encodeURIComponent(userId)}`)
  return data
}

export async function getFollowerList(userId) {
  const { data } = await apiClient.get(`/api/users/${encodeURIComponent(userId)}/followers`)
  return data
}

export async function getFollowingList(userId) {
  const { data } = await apiClient.get(`/api/users/${encodeURIComponent(userId)}/followings`)
  return data
}

/**
 * 프로필 수정 (multipart)
 * 파일 파트 이름은 백엔드 스펙 그대로 profileImage 유지
 * 응답 JSON의 이미지 필드는 profileImageUrl
 */
export async function updateProfile(userUpdateRequest, profileImage) {
  const formData = new FormData()
  const jsonBlob = new Blob([JSON.stringify(userUpdateRequest)], { type: 'application/json' })
  formData.append('userUpdateRequest', jsonBlob)
  if (profileImage) {
    formData.append('profileImage', profileImage)  // 요청 파트명은 그대로 유지
  }
  const { data } = await apiClient.put(`/api/users/profile`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}
