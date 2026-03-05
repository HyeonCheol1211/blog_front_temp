<template>
  <div class="app-container auth-page">
    <div class="card auth-card">
      <h1 class="page-title">회원가입</h1>
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
          <label for="email">이메일 (선택)</label>
          <input
            id="email"
            v-model="email"
            type="email"
            autocomplete="email"
            placeholder="email@example.com"
          />
        </div>
        <div class="form-group">
          <label for="password">비밀번호</label>
          <input
            id="password"
            v-model="password"
            type="password"
            required
            autocomplete="new-password"
            placeholder="비밀번호"
          />
        </div>
        <div class="form-group">
          <label for="passwordConfirm">비밀번호 확인</label>
          <input
            id="passwordConfirm"
            v-model="passwordConfirm"
            type="password"
            required
            autocomplete="new-password"
            placeholder="비밀번호 확인"
          />
          <p v-if="passwordConfirm && password !== passwordConfirm" class="error-msg">비밀번호가 일치하지 않습니다.</p>
        </div>
        <p v-if="error" class="error-msg">{{ error }}</p>
        <button
          type="submit"
          class="btn btn-primary"
          :disabled="loading || (passwordConfirm && password !== passwordConfirm)"
        >
          {{ loading ? '가입 중...' : '가입하기' }}
        </button>
      </form>
      <p class="auth-footer">
        이미 계정이 있으신가요?
        <router-link to="/login">로그인</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { register } from '@/api/auth.js'

const router = useRouter()

const username = ref('')
const email = ref('')
const password = ref('')
const passwordConfirm = ref('')
const loading = ref(false)
const error = ref('')

async function submit() {
  if (password.value !== passwordConfirm.value) return
  error.value = ''
  loading.value = true
  try {
    await register({ username: username.value, password: password.value, email: email.value })
    router.push('/login')
  } catch (e) {
    error.value = e.response?.data?.message ?? '가입에 실패했습니다. 다시 시도해 주세요.'
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
