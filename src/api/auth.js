import { apiClient } from './client.js'

export async function login(username, password) {
  const { data } = await apiClient.post('/api/auth/login', { username, password })
  return data
}

export async function checkUsername(username) {
  const { data } = await apiClient.get(`/api/auth/check-username/${encodeURIComponent(username)}`)
  return data
}

export async function checkEmail(email) {
  const { data } = await apiClient.get(`/api/auth/check-email/${encodeURIComponent(email)}`)
  return data
}

// Backend signature:
// @PostMapping("/join")
// public ResponseEntity<UserResponse> join(
//   @RequestPart("userJoinRequest") UserJoinRequest userJoinRequest,
//   @RequestPart(value = "profileImage", required = false) MultipartFile multipartFile)
export async function register({ username, password, email, bio, profileImageFile }) {
  const formData = new FormData()

  const userJoinRequest = {
    username,
    password,
    email: email || null,
    bio: bio || null,
  }

  // userSignupRequest를 JSON 파트로 전송
  formData.append(
    'userSignupRequest',
    new Blob([JSON.stringify(userJoinRequest)], { type: 'application/json' }),
  )

  // 선택된 프로필 이미지 파일을 profileImage 파트로 전송
  if (profileImageFile) {
    formData.append('profileImage', profileImageFile)
  }

  const { data } = await apiClient.post('/api/auth/signup', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })

  return data
}
