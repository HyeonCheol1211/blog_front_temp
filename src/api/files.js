import { apiClient } from './client.js'

// 프로필 이미지 업로드 (멀티파트 업로드 엔드포인트 예시: POST /api/files/profile-image)
export async function uploadProfileImage(file) {
  const formData = new FormData()
  formData.append('file', file)

  const { data } = await apiClient.post('/api/files/profile-image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })

  // 백엔드에서 반환하는 형태에 따라 최대한 유연하게 URL을 추출
  if (typeof data === 'string') {
    return data
  }
  return data.url || data.location || data.profileImageUrl || ''
}

