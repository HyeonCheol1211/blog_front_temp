<template>
  <div class="app-container auth-page">
    <div class="card auth-card">
      <h1 class="page-title">로그인</h1>
      <form @submit.prevent="submit">
        <div class="form-group">
          <label for="username">아이디</label>
          <input
            id="username"
            v-model="username"
            type="text"
            required
            autocomplete="username"
            placeholder="아이디"
          />
        </div>
        <div class="form-group">
          <label for="password">비밀번호</label>
          <input
            id="password"
            v-model="password"
            type="password"
            required
            autocomplete="current-password"
            placeholder="비밀번호"
          />
        </div>
        <p v-if="error" class="error-msg">{{ error }}</p>
        <button type="submit" class="btn btn-primary" :disabled="loading">
          {{ loading ? '로그인 중...' : '로그인' }}
        </button>
      </form>
      <p class="auth-footer">
        계정이 없으신가요?
        <router-link to="/signup">회원가입</router-link>
      </p>
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
    const token = await login(username.value, password.value)
    setAuth(token, { username: username.value })
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
.auth-page {
  max-width: 400px;
  padding-top: 3rem;
}
.auth-card {
  padding: 1.5rem;
}
.auth-card .btn {
  width: 100%;
  margin-top: 0.5rem;
}
.auth-footer {
  margin-top: 1.25rem;
  font-size: 0.95rem;
  color: var(--text-muted);
}
</style>
