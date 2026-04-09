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
        @click="goToPost(c.postId)"
      >
        <div class="comment-meta">
          <div class="author-info" @click.stop="goToProfile(c.authorId)" style="cursor: pointer;" title="프로필 보기">
            <div class="avatar-sm">
              <img
                :src="resolveProfileImageUrl(c.profileImageUrl)"
                alt="프로필 이미지"
              />
            </div>
            <span class="comment-author">{{ c.author }}</span>
          </div>
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
import { resolveProfileImageUrl } from '@/utils/image.js'
import { useAuth } from '@/composables/useAuth.js'

const router = useRouter()
const { user } = useAuth()
const comments = ref([])
const loading = ref(true)
const error = ref('')

// 내 댓글 화면이므로 authorId가 없을 경우 로그인 유저의 userId를 사용
function goToProfile(authorId) {
  const userId = authorId ?? user.value?.userId
  if (userId) router.push({ name: 'user-profile', params: { userId: String(userId) } })
}

// 댓글이 작성된 글 보기 페이지로 이동
function goToPost(postId) {
  if (postId) router.push({ name: 'post-detail', params: { id: String(postId) } })
}

onMounted(async () => {
  try {
    const data = await getMyComments()
    // 응답 스펜: commentId, profileImageUrl, author, authorId, content
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
.author-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.avatar-sm {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-muted);
  overflow: hidden;
  flex-shrink: 0;
}
.avatar-sm img {
  width: 100%;
  height: 100%;
  object-fit: cover;
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
