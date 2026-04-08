<template>
  <div class="auth-wrapper">
    <div class="auth-box card animate-fade-in">
      <div class="auth-header">
        <h1 class="page-title">환영합니다</h1>
        <p class="auth-subtitle">계정에 로그인하여 계속하세요.</p>
      </div>
      <form class="auth-form" @submit.prevent="submit">
        <div class="form-group">
          <label for="username">아이디</label>
          <div class="input-icon-wrapper">
            <input
              id="username"
              v-model="username"
              type="text"
              required
              autocomplete="username"
              placeholder="아이디를 입력하세요"
            />
          </div>
        </div>
        <div class="form-group">
          <label for="password">비밀번호</label>
          <div class="input-icon-wrapper">
            <input
              id="password"
              v-model="password"
              type="password"
              required
              autocomplete="current-password"
              placeholder="비밀번호를 입력하세요"
            />
          </div>
        </div>
        <div v-if="error" class="error-msg text-center mb-3">{{ error }}</div>
        <button type="submit" class="btn btn-primary btn-block mb-3" :disabled="loading">
          {{ loading ? '로그인 중...' : '로그인' }}
        </button>
      </form>
      <div class="auth-footer text-center">
        계정이 없으신가요?
        <router-link to="/signup" class="font-bold">회원가입</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuth } from '@/composables/useAuth.js'
import { login } from '@/api/auth.js'

const router = useRouter()
const route = useRoute()
const { setAuth } = useAuth()

const username = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

async function submit() {
  error.value = ''
  loading.value = true
  try {
    const data = await login(username.value, password.value)
    // 백엔드에서 LoginResponse(userId, token)를 반환하므로 바로 꺼내어 씁니다.
    const token = data.token
    const userObj = { 
      username: username.value,
      userId: data.userId
    }
    setAuth(token, userObj)
    const redirect = route.query.redirect || '/'
    router.push(redirect)
  } catch (e) {
    error.value = e.response?.data?.message ?? '아이디 또는 비밀번호를 확인해 주세요.'
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
  padding: 2rem 1rem;
}
.auth-box {
  width: 100%;
  max-width: 420px;
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
  margin-bottom: 2rem;
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
.form-group label {
  font-size: 0.9rem;
  font-weight: 600;
  color: #334155;
  margin-bottom: 0.4rem;
}
.input-icon-wrapper input {
  padding-left: 1rem;
}
.btn-block {
  width: 100%;
  padding: 0.85rem;
  font-size: 1.05rem;
  margin-top: 0.5rem;
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
</style>
