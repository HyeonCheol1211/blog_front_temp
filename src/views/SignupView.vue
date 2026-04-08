<template>
  <div class="auth-wrapper">
    <div class="auth-box card animate-fade-in">
      <div class="auth-header">
        <h1 class="page-title">회원가입</h1>
        <p class="auth-subtitle">새로운 계정을 만들고 모든 기능을 즐겨보세요.</p>
      </div>
      <form class="auth-form" @submit.prevent="submit">
        <div class="form-group">
          <label for="username">아이디</label>
          <div class="input-with-button">
            <div class="input-icon-wrapper flex-grow">
              <input
                id="username"
                v-model="username"
                type="text"
                required
                autocomplete="username"
                placeholder="원하는 아이디를 입력하세요"
                @input="onUsernameChange"
              />
            </div>
            <button 
              type="button" 
              class="btn btn-secondary btn-sm check-btn" 
              @click="handleCheckUsername" 
              :disabled="!username.trim() || checkingUsername"
            >
              {{ checkingUsername ? '확인 중...' : '중복 확인' }}
            </button>
          </div>
          <p v-if="usernameAvailable === true" class="success-msg-sm">사용 가능한 아이디입니다.</p>
          <p v-else-if="usernameAvailable === false" class="error-msg-sm">이미 존재하는 아이디입니다.</p>
        </div>
        <div class="form-group">
          <label for="email">이메일 <span class="text-sm font-normal text-slate-400">(선택)</span></label>
          <div class="input-with-button">
            <div class="input-icon-wrapper flex-grow">
              <input
                id="email"
                v-model="email"
                type="email"
                autocomplete="email"
                placeholder="email@example.com"
                @input="onEmailChange"
              />
            </div>
            <button 
              type="button" 
              class="btn btn-secondary btn-sm check-btn" 
              @click="handleCheckEmail"
              :disabled="!email.trim() || checkingEmail"
            >
              {{ checkingEmail ? '확인 중...' : '중복 확인' }}
            </button>
          </div>
          <p v-if="emailAvailable === true" class="success-msg-sm">사용 가능한 이메일입니다.</p>
          <p v-else-if="emailAvailable === false" class="error-msg-sm">이미 존재하는 이메일입니다.</p>
        </div>
        <div class="form-group">
          <label for="profileImageFile">프로필 사진 <span class="text-sm font-normal text-slate-400">(선택)</span></label>
          <div class="file-input-wrapper">
            <input
              id="profileImageFile"
              type="file"
              accept="image/*"
              class="file-input"
              @change="onProfileImageChange"
            />
          </div>
          <p class="hint">자신을 표현할 멋진 사진을 올려주세요.</p>
          <div v-if="profileImagePreview" class="profile-image-preview">
            <img :src="profileImagePreview" alt="프로필 사진 미리보기" />
          </div>
        </div>
        <div class="form-group">
          <label for="bio">자기소개 <span class="text-sm font-normal text-slate-400">(선택)</span></label>
          <textarea
            id="bio"
            v-model="bio"
            rows="3"
            placeholder="사람들에게 나를 간략히 소개해보세요!"
          />
        </div>
        <div class="form-group">
          <label for="password">비밀번호</label>
          <div class="input-icon-wrapper">
            <input
              id="password"
              v-model="password"
              type="password"
              required
              autocomplete="new-password"
              placeholder="안전한 비밀번호"
            />
          </div>
        </div>
        <div class="form-group">
          <label for="passwordConfirm">비밀번호 확인</label>
          <div class="input-icon-wrapper">
            <input
              id="passwordConfirm"
              v-model="passwordConfirm"
              type="password"
              required
              autocomplete="new-password"
              placeholder="비밀번호를 다시 한 번 입력하세요"
            />
          </div>
          <p v-if="passwordConfirm && password !== passwordConfirm" class="error-msg-sm">비밀번호가 일치하지 않습니다.</p>
        </div>
        <div v-if="error" class="error-msg text-center mb-3">{{ error }}</div>
        <button
          type="submit"
          class="btn btn-primary btn-block mb-3"
          :disabled="loading || !canSubmit"
        >
          {{ loading ? '가입 중...' : '가입하기' }}
        </button>
      </form>
      <div class="auth-footer text-center">
        이미 계정이 있으신가요?
        <router-link to="/login" class="font-bold">로그인</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { register, checkUsername, checkEmail } from '@/api/auth.js'

const router = useRouter()

const username = ref('')
const email = ref('')
const password = ref('')
const passwordConfirm = ref('')
const bio = ref('')
const loading = ref(false)
const error = ref('')
const profileImageFile = ref(null)
const profileImagePreview = ref('')

const usernameAvailable = ref(null)
const emailAvailable = ref(null)
const checkingUsername = ref(false)
const checkingEmail = ref(false)

const canSubmit = computed(() => {
  if (password.value !== passwordConfirm.value) return false
  if (usernameAvailable.value !== true) return false
  if (email.value.trim() && emailAvailable.value !== true) return false
  return true
})

function onUsernameChange() {
  usernameAvailable.value = null
}

function onEmailChange() {
  emailAvailable.value = null
}

async function handleCheckUsername() {
  if (!username.value.trim()) return
  checkingUsername.value = true
  error.value = ''
  try {
    await checkUsername(username.value)
    usernameAvailable.value = true
  } catch (err) {
    if (err.response?.status === 409 || err.response?.data?.message?.includes('이미')) {
      usernameAvailable.value = false
    } else {
      error.value = '아이디 중복 확인 중 오류가 발생했습니다.'
    }
  } finally {
    checkingUsername.value = false
  }
}

async function handleCheckEmail() {
  if (!email.value.trim()) return
  checkingEmail.value = true
  error.value = ''
  try {
    await checkEmail(email.value)
    emailAvailable.value = true
  } catch (err) {
    if (err.response?.status === 409 || err.response?.data?.message?.includes('이미')) {
      emailAvailable.value = false
    } else {
      error.value = '이메일 중복 확인 중 오류가 발생했습니다.'
    }
  } finally {
    checkingEmail.value = false
  }
}

function onProfileImageChange(event) {
  const files = event.target.files || event.currentTarget.files
  const file = files && files[0]
  profileImageFile.value = file || null

  if (profileImagePreview.value) {
    URL.revokeObjectURL(profileImagePreview.value)
    profileImagePreview.value = ''
  }

  if (file) {
    profileImagePreview.value = URL.createObjectURL(file)
  }
}

async function submit() {
  if (!canSubmit.value) return
  error.value = ''
  loading.value = true
  try {
    await register({
      username: username.value,
      password: password.value,
      email: email.value,
      bio: bio.value,
      profileImageFile: profileImageFile.value,
    })
    router.push('/login')
  } catch (e) {
    error.value = e.response?.data?.message ?? '가입에 실패했습니다. 다시 시도해 주세요.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 160px);
  padding: 3rem 1rem;
}
.auth-box {
  width: 100%;
  max-width: 460px;
  padding: 2.5rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.02);
  border: 1px solid rgba(226, 232, 240, 0.8);
  border-radius: var(--radius-lg);
  position: relative;
  overflow: hidden;
}
.auth-box::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 6px;
  background: linear-gradient(135deg, var(--accent), #818cf8);
}
.auth-header {
  text-align: center;
  margin-bottom: 2.5rem;
}
.page-title {
  font-size: 2rem;
  margin-bottom: 0.5rem;
  color: var(--text);
}
.auth-subtitle {
  color: var(--text-muted);
  font-size: 1rem;
}
.form-group {
  margin-bottom: 1.5rem;
}
.form-group label {
  font-size: 0.95rem;
  font-weight: 600;
  color: #334155;
  margin-bottom: 0.5rem;
  display: block;
}
.text-sm {
  font-size: 0.85rem;
}
.font-normal {
  font-weight: 400;
}
.text-slate-400 {
  color: #94a3b8;
}
.file-input {
  font-size: 0.9rem;
  padding: 0.5rem;
  border: 1px dashed var(--border);
  background: #f8fafc;
  cursor: pointer;
}
.file-input:hover {
  border-color: var(--accent);
}
.hint {
  margin-top: 0.4rem;
  font-size: 0.85rem;
  color: var(--text-muted);
}
.profile-image-preview {
  margin-top: 1rem;
  display: flex;
  justify-content: center;
}
.profile-image-preview img {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #fff;
  box-shadow: var(--shadow-md);
}
.error-msg-sm {
  color: var(--danger);
  font-size: 0.85rem;
  font-weight: 500;
  margin-top: 0.4rem;
}
.btn-block {
  width: 100%;
  padding: 0.85rem;
  font-size: 1.05rem;
  margin-top: 1rem;
}
.mb-3 {
  margin-bottom: 1rem;
}
.text-center {
  text-align: center;
}
.font-bold {
  font-weight: 600;
}
.auth-footer {
  color: var(--text-muted);
  font-size: 0.95rem;
  padding-top: 1.25rem;
  border-top: 1px solid var(--border);
  margin-top: 1rem;
}
.auth-footer a {
  color: var(--accent);
  margin-left: 0.25rem;
}
.auth-footer a:hover {
  text-decoration: underline;
}
.input-with-button {
  display: flex;
  gap: 0.5rem;
  align-items: stretch;
}
.input-with-button .input-icon-wrapper {
  flex-grow: 1;
}
.check-btn {
  white-space: nowrap;
  font-size: 0.85rem;
  padding: 0 0.75rem;
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.flex-grow {
  flex-grow: 1;
}
.success-msg-sm {
  color: #10b981;
  font-size: 0.85rem;
  font-weight: 500;
  margin-top: 0.4rem;
}
</style>
