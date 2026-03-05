<template>
  <div class="app-container">
    <h1 class="page-title">내 댓글</h1>
    <div v-if="loading" class="empty-state">불러오는 중...</div>
    <div v-else-if="error" class="empty-state error-msg">{{ error }}</div>
    <div v-else-if="!comments.length" class="empty-state">작성한 댓글이 없습니다.</div>
    <div v-else class="comment-list">
      <div
        v-for="c in comments"
        :key="c.commentId"
        class="card comment-card"
        @click="goToPost(c.postId ?? c.post?.id)"
      >
        <div class="comment-meta">
          <span class="comment-author">{{ c.author }}</span>
          <span v-if="c.postTitle" class="comment-post">글: {{ c.postTitle }}</span>
        </div>
        <p class="comment-content">{{ c.content }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getMyComments } from '@/api/comments.js'

const router = useRouter()
const comments = ref([])
const loading = ref(true)
const error = ref('')

function goToPost(postId) {
  if (postId) router.push({ name: 'post-detail', params: { id: String(postId) } })
}

onMounted(async () => {
  try {
    const data = await getMyComments()
    comments.value = Array.isArray(data) ? data : data.content ?? data ?? []
  } catch (e) {
    error.value = e.response?.data?.message || '목록을 불러오지 못했습니다.'
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.comment-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.comment-card {
  cursor: pointer;
  transition: box-shadow 0.2s;
}
.comment-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}
.comment-meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  color: var(--text-muted);
}
.comment-author {
  color: var(--text);
  font-weight: 500;
}
.comment-post {
  color: var(--accent);
}
.comment-content {
  margin: 0;
  font-size: 0.95rem;
  color: var(--text);
}
</style>
