<template>
  <div class="app">
    <header class="header">
      <div class="header-inner app-container">
        <router-link to="/" class="logo">블로그</router-link>
        <nav class="nav">
          <router-link to="/">전체 글</router-link>
          <template v-if="isLoggedIn">
            <router-link to="/write">글 쓰기</router-link>
            <router-link to="/my/posts">내 글</router-link>
            <router-link to="/my/comments">내 댓글</router-link>
            <span class="user-name">{{ displayName }}</span>
            <button type="button" class="btn btn-ghost btn-sm" @click="logout">로그아웃</button>
          </template>
          <template v-else>
            <router-link to="/login">로그인</router-link>
            <router-link to="/signup">회원가입</router-link>
          </template>
        </nav>
      </div>
    </header>
    <main class="main">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAuth } from '@/composables/useAuth.js'
import '@/assets/style.css'

const { user, isLoggedIn, logout } = useAuth()

const displayName = computed(() => {
  const u = user.value
  return u?.displayName ?? u?.username ?? ''
})
</script>

<style scoped>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
.header {
  background: var(--bg-card);
  border-bottom: 1px solid var(--border);
  box-shadow: var(--shadow);
}
.header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 0.75rem;
  padding-bottom: 0.75rem;
}
.logo {
  font-family: var(--font-serif);
  font-size: 1.35rem;
  font-weight: 600;
  color: var(--text);
}
.logo:hover {
  color: var(--accent);
  text-decoration: none;
}
.nav {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}
.nav a {
  color: var(--text-muted);
  font-size: 0.95rem;
}
.nav a:hover {
  color: var(--accent);
  text-decoration: none;
}
.nav a.router-link-active {
  color: var(--accent);
  font-weight: 500;
}
.user-name {
  font-size: 0.9rem;
  color: var(--text-muted);
  margin-right: 0.25rem;
}
.main {
  flex: 1;
  padding-bottom: 3rem;
}
</style>
