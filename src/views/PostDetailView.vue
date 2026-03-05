<template>
  <div class="app-container">
    <div v-if="loading" class="empty-state">불러오는 중...</div>
    <div v-else-if="error" class="empty-state error-msg">{{ error }}</div>
    <template v-else-if="post">
      <article class="card post-detail">
        <div class="post-meta">
          <span v-if="post.categoryName" class="category">{{ post.categoryName }}</span>
          <span class="date">{{ formatDate(post.createdAt) }}</span>
          <span v-if="post.updatedAt !== post.createdAt" class="updated">
            (수정: {{ formatDate(post.updatedAt) }})
          </span>
        </div>
        <h1 class="post-title">{{ post.title }}</h1>
        <div class="post-author">{{ post.author }}</div>
        <div class="post-body" v-html="post.content"></div>

        <!-- 좋아요: 글 내용과 댓글 사이 -->
        <div class="like-section">
          <span class="like-count-only">♥ {{ post.likeCount ?? 0 }}</span>
        </div>
      </article>

      <!-- 글 수정/삭제 (본인만) -->
      <div v-if="isLoggedIn && canEdit" class="actions">
        <router-link :to="{ name: 'post-edit', params: { id: post.id } }" class="btn btn-secondary btn-sm">
          수정
        </router-link>
        <button type="button" class="btn btn-danger btn-sm" @click="confirmDelete">삭제</button>
      </div>

      <!-- 댓글 목록 -->
      <section class="comments-section">
        <h2 class="comments-title">댓글 ({{ comments.length }})</h2>

        <!-- 댓글 작성 (로그인 시) -->
        <div v-if="isLoggedIn" class="comment-form card">
          <div class="form-group">
            <label for="comment-content">댓글 작성</label>
            <textarea
              id="comment-content"
              v-model="newComment"
              placeholder="댓글을 입력하세요."
              rows="3"
            />
            <button type="button" class="btn btn-primary btn-sm" :disabled="!newComment.trim()" @click="submitComment">
              등록
            </button>
          </div>
        </div>

        <div v-if="!comments.length" class="empty-state">댓글이 없습니다.</div>
        <ul v-else class="comment-list">
          <li v-for="c in comments" :key="c.commentId" class="card comment-item">
            <div class="comment-header">
              <span class="comment-author">{{ c.author }}</span>
              <div v-if="isLoggedIn && canEditComment(c)" class="comment-actions">
                <button
                  v-if="editingId !== c.commentId"
                  type="button"
                  class="btn-ghost btn-sm"
                  @click="startEdit(c)"
                >
                  수정
                </button>
                <button
                  v-if="editingId !== c.commentId"
                  type="button"
                  class="btn-ghost btn-sm"
                  @click="confirmDeleteComment(c)"
                >
                  삭제
                </button>
              </div>
            </div>
            <div v-if="editingId === c.commentId" class="comment-edit">
              <textarea v-model="editContent" rows="2" />
              <div>
                <button type="button" class="btn btn-primary btn-sm" @click="saveComment(c)">저장</button>
                <button type="button" class="btn btn-ghost btn-sm" @click="cancelEdit">취소</button>
              </div>
            </div>
            <p v-else class="comment-content">{{ c.content }}</p>
          </li>
        </ul>
      </section>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth.js'
import { getPost, deletePost } from '@/api/posts.js'
import { createComment, updateComment, deleteComment } from '@/api/comments.js'

const route = useRoute()
const router = useRouter()
const { user, isLoggedIn } = useAuth()

const post = ref(null)
const loading = ref(true)
const error = ref('')
const comments = ref([])
const newComment = ref('')
const editingId = ref(null)
const editContent = ref('')

const canEdit = computed(() => {
  if (!post.value || !user.value) return false
  return post.value.author === user.value.username
})

function canEditComment(comment) {
  return comment.author === user.value?.username
}

function formatDate(val) {
  if (!val) return ''
  return new Date(val).toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function loadPost() {
  const id = route.params.id
  loading.value = true
  error.value = ''
  getPost(id)
    .then((data) => {
      post.value = data
      comments.value = Array.isArray(data.commentsResponse) ? data.commentsResponse : []
    })
    .catch((e) => {
      error.value = e.response?.data?.message || '글을 불러오지 못했습니다.'
    })
    .finally(() => {
      loading.value = false
    })
}

function confirmDelete() {
  if (!confirm('이 글을 삭제할까요?')) return
  deletePost(post.value.id)
    .then(() => router.push({ name: 'home' }))
    .catch((e) => alert(e.response?.data?.message || '삭제에 실패했습니다.'))
}

function submitComment() {
  const content = newComment.value.trim()
  if (!content || !post.value?.id) return
  createComment(post.value.id, content)
    .then((data) => {
      comments.value = [data, ...comments.value]
      newComment.value = ''
    })
    .catch((e) => alert(e.response?.data?.message || '댓글 등록에 실패했습니다.'))
}

function startEdit(c) {
  editingId.value = c.commentId
  editContent.value = c.content
}

function cancelEdit() {
  editingId.value = null
  editContent.value = ''
}

function saveComment(c) {
  const content = editContent.value.trim()
  if (!content) return
  updateComment(c.commentId, content)
    .then((data) => {
      c.content = data.content ?? content
      cancelEdit()
    })
    .catch((e) => alert(e.response?.data?.message || '수정에 실패했습니다.'))
}

function confirmDeleteComment(c) {
  if (!confirm('이 댓글을 삭제할까요?')) return
  deleteComment(c.commentId)
    .then(() => {
      comments.value = comments.value.filter((x) => x.commentId !== c.commentId)
    })
    .catch((e) => alert(e.response?.data?.message || '삭제에 실패했습니다.'))
}

onMounted(loadPost)
watch(() => route.params.id, loadPost)
</script>

<style scoped>
.post-detail .post-title {
  font-family: var(--font-serif);
  font-size: 1.75rem;
  margin: 0 0 0.25rem;
}
.post-body {
  margin-top: 1rem;
  white-space: pre-wrap;
  word-break: break-word;
}
.post-body :deep(p) {
  margin: 0 0 0.75rem;
}
.like-section {
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border);
}
.like-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.4rem 0.75rem;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--bg-card);
  color: var(--text-muted);
  font-size: 0.9rem;
}
.like-btn:hover {
  background: var(--border);
  color: var(--text);
}
.like-btn.liked {
  color: var(--danger);
  border-color: rgba(185, 28, 28, 0.3);
  background: rgba(185, 28, 28, 0.06);
}
.like-count {
  margin-left: 0.25rem;
  font-size: 0.85rem;
  color: var(--text-muted);
}
.like-count-only {
  font-size: 0.95rem;
  color: var(--text-muted);
}
.actions {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 2rem;
}
.comments-section {
  margin-top: 2rem;
}
.comments-title {
  font-size: 1.1rem;
  margin: 0 0 1rem;
}
.comment-form .form-group {
  margin-bottom: 0.5rem;
}
.comment-list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.comment-item {
  padding: 1rem;
  margin-bottom: 0.75rem;
}
.comment-header {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}
.comment-author {
  font-weight: 500;
  color: var(--text);
}
.comment-actions {
  margin-left: auto;
  display: flex;
  gap: 0.25rem;
}
.comment-content {
  margin: 0;
  font-size: 0.95rem;
}
.comment-edit textarea {
  width: 100%;
  margin-bottom: 0.5rem;
  padding: 0.5rem;
  border: 1px solid var(--border);
  border-radius: var(--radius);
}
.updated {
  font-size: 0.8rem;
  color: var(--text-muted);
}
</style>
