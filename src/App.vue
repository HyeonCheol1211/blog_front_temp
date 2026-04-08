ㅋ<template>
  <div class="app">
    <header class="header glass">
      <div class="header-inner app-container">
        <router-link to="/" class="logo">
          <span class="logo-text">Blog</span>
        </router-link>
        <nav class="nav">
          <router-link to="/" class="nav-link">전체 글</router-link>
          <template v-if="isLoggedIn">
            <router-link to="/write" class="nav-link">글 쓰기</router-link>
            <router-link to="/my/posts" class="nav-link">내 글</router-link>
            <router-link to="/my/comments" class="nav-link">내 댓글</router-link>
            <router-link
              v-if="currentUserId"
              :to="{ name: 'user-profile', params: { userId: currentUserId } }"
              class="user-name"
            >
              {{ displayName }}
            </router-link>
            <span v-else class="user-name">{{ displayName }}</span>
            <button type="button" class="btn btn-ghost btn-sm logout-btn" @click="handleLogout">로그아웃</button>
          </template>
          <template v-else>
            <router-link to="/login" class="nav-link">로그인</router-link>
            <router-link to="/signup" class="btn btn-primary btn-sm signup-btn">회원가입</router-link>
          </template>
        </nav>
      </div>
    </header>
    <main class="main animate-fade-in">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth.js'
import '@/assets/style.css'

const { user, isLoggedIn, logout } = useAuth()
const router = useRouter()

function handleLogout() {
  logout()
  router.push('/')
}

const displayName = computed(() => {
  const u = user.value
  return u?.displayName ?? u?.username ?? ''
})

const currentUserId = computed(() => user.value?.userId || user.value?.id || user.value?.username || '')
</script>

<style scoped>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
.header {
  position: sticky;
  top: 0;
  z-index: 50;
  border-bottom: 1px solid var(--border);
}
.header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 1rem;
  padding-bottom: 1rem;
}
.logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.logo-text {
  font-family: var(--font-serif);
  font-size: 1.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, var(--accent), #818cf8);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: -0.025em;
}
.logo:hover .logo-text {
  filter: brightness(1.2);
}
.nav {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  flex-wrap: wrap;
}
.nav-link {
  color: var(--text-muted);
  font-size: 0.95rem;
  font-weight: 500;
  transition: color 0.2s;
  position: relative;
}
.nav-link::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 0;
  width: 0%;
  height: 2px;
  background: var(--accent);
  transition: width 0.2s ease;
  border-radius: 2px;
}
.nav-link:hover {
  text-decoration: none;
  color: var(--text);
}
.nav-link:hover::after,
.nav-link.router-link-active::after {
  width: 100%;
}
.nav-link.router-link-active {
  color: var(--text);
  font-weight: 600;
}
.user-name {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--accent);
  margin-right: 0.5rem;
  padding: 0.25rem 0.75rem;
  background: var(--accent-light);
  border-radius: var(--radius-full);
}
.user-name:hover {
  background: #c7d2fe;
}
.logout-btn {
  margin-left: -0.5rem;
}
.signup-btn {
  margin-left: -0.5rem;
}
.main {
  flex: 1;
  padding-bottom: 4rem;
}
</style>
