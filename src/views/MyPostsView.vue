<template>
  <div class="app-container">
    <h1 class="page-title">내 작성 글</h1>
    <div v-if="loading" class="empty-state">불러오는 중...</div>
    <div v-else-if="error" class="empty-state error-msg">{{ error }}</div>
    <div v-else-if="!posts.length" class="empty-state">작성한 글이 없습니다.</div>
    <article
      v-else
      v-for="post in posts"
      :key="post.id"
      class="card post-card"
      @click="goToPost(post.id)"
    >
      <div class="post-meta">
        <span v-if="post.categoryName" class="category">{{ post.categoryName }}</span>
        <span class="date">{{ formatDate(post.createdAt) }}</span>
        <span class="visibility">{{ post.publicStatus ? '공개' : '비공개' }}</span>
      </div>
      <h2 class="post-title">{{ post.title }}</h2>
      <p class="post-excerpt">{{ excerpt(post.content) }}</p>
    </article>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getMyPosts } from '@/api/posts.js'

const router = useRouter()
const posts = ref([])
const loading = ref(true)
const error = ref('')

function formatDate(val) {
  if (!val) return ''
  return new Date(val).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function excerpt(text) {
  if (!text) return ''
  const plain = String(text).replace(/<[^>]+>/g, '')
  return plain.length > 120 ? plain.slice(0, 120) + '…' : plain
}

function goToPost(id) {
  router.push({ name: 'post-detail', params: { id } })
}

onMounted(async () => {
  try {
    const data = await getMyPosts()
    posts.value = Array.isArray(data) ? data : data.content ?? data ?? []
  } catch (e) {
    error.value = e.response?.data?.message || '목록을 불러오지 못했습니다.'
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.post-card {
  cursor: pointer;
  transition: box-shadow 0.2s;
}
.post-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}
.post-meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  color: var(--text-muted);
}
.category {
  background: var(--border);
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  color: var(--text);
}
.visibility {
  margin-left: auto;
  font-size: 0.8rem;
  color: var(--text-muted);
}
.post-title {
  font-family: var(--font-serif);
  font-size: 1.25rem;
  margin: 0 0 0.5rem;
  color: var(--text);
}
.post-excerpt {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.95rem;
}
</style>
