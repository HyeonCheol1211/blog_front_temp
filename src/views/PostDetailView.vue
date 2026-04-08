<template>
  <div class="app-container">
    <div v-if="loading" class="empty-state">
      <div class="loader"></div>
      <p>불러오는 중...</p>
    </div>
    <div v-else-if="forbidden" class="empty-state forbidden-msg">
      <div class="forbidden-icon">🔒</div>
      <p class="forbidden-title">접근 권한이 없습니다</p>
      <p class="forbidden-desc">{{ error }}</p>
    </div>
    <div v-else-if="error" class="empty-state error-msg">{{ error }}</div>
    <template v-else-if="post">
      <article class="card post-detail-card">
        <header class="post-header">
          <div class="post-meta">
            <span v-if="post.categoryName" class="category">{{ post.categoryName }}</span>
            <span class="date">{{ formatDate(post.createdAt) }}</span>
          </div>
          <h1 class="post-title">{{ post.title }}</h1>
          <div v-if="post.author" class="post-author-row">
            <button type="button" class="post-author-link" @click="goToAuthorProfile">
              <span class="post-author-avatar">
                <img
                  :src="resolveProfileImageUrl(post.profileImageUrl)"
                  alt="작성자 프로필"
                />
              </span>
              <span class="post-author-name">{{ post.author }}</span>
            </button>
          </div>
        </header>

        <div class="post-body-wrapper">
          <div class="post-body" v-html="post.content"></div>
        </div>

        <div class="like-section">
          <div class="like-btn-group">
            <button
              v-if="isLoggedIn"
              type="button"
              class="like-btn"
              :class="{ liked: !!post.liked }"
              :disabled="likePending"
              @click="onToggleLike"
            >
              <span>{{ post.liked ? '♥ 좋아요 취소' : '♡ 좋아요' }}</span>
              <span class="like-count">
                {{ post.likeCount ?? 0 }}
              </span>
            </button>
            <span v-else class="like-count-only">♥ {{ post.likeCount ?? 0 }}</span>
            <button
              v-if="canEdit"
              type="button"
              class="view-likes-btn"
              @click="openLikesModal"
              title="좋아요 누른 사람 보기"
            >
              누른 사람 보기 👀
            </button>
          </div>
        </div>
      </article>

      <div v-if="isLoggedIn && canEdit" class="actions">
        <router-link :to="{ name: 'post-edit', params: { id: post.id } }" class="btn btn-secondary btn-sm">수정</router-link>
        <button type="button" class="btn btn-danger btn-sm" @click="confirmDelete">삭제</button>
      </div>

      <section class="comments-section">
        <h2 class="comments-title">댓글 <span>{{ comments.length }}</span></h2>

        <div v-if="!comments.length" class="empty-state">첫 댓글을 작성해보세요!</div>
        <ul v-else class="comment-list">
          <li v-for="c in paginatedComments" :key="c.commentId" class="card comment-item">
            <div class="comment-header">
              <div class="comment-author-info" @click.stop="goToProfile({ userId: c.authorId, username: c.author })" style="cursor: pointer;" title="프로필 보기">
                <div class="avatar-sm">
                  <img
                    :src="resolveProfileImageUrl(c.profileImageUrl)"
                    alt="프로필 이미지"
                  />
                </div>
                <span class="comment-author">{{ c.author }}</span>
              </div>
              <div v-if="isLoggedIn && canEditComment(c)" class="comment-actions">
                <button v-if="editingId !== c.commentId" type="button" class="btn-ghost btn-sm" @click="startEdit(c)">수정</button>
                <button v-if="editingId !== c.commentId" type="button" class="btn-ghost btn-sm" @click="confirmDeleteComment(c)">삭제</button>
              </div>
            </div>
            <div v-if="editingId === c.commentId" class="comment-edit">
              <textarea v-model="editContent" rows="3" />
              <div class="comment-edit-actions">
                <button type="button" class="btn btn-primary btn-sm" @click="saveComment(c)">저장</button>
                <button type="button" class="btn btn-secondary btn-sm" @click="cancelEdit">취소</button>
              </div>
            </div>
            <p v-else class="comment-content">{{ c.content }}</p>
          </li>
        </ul>

        <div v-if="totalPages > 1" class="pagination">
          <button 
            type="button" 
            class="pagination-btn" 
            :disabled="currentPage === 1" 
            @click="prevPage"
          >
            이전
          </button>
          <span class="pagination-info">{{ currentPage }} / {{ totalPages }}</span>
          <button 
            type="button" 
            class="pagination-btn" 
            :disabled="currentPage === totalPages" 
            @click="nextPage"
          >
            다음
          </button>
        </div>

        <div v-if="isLoggedIn" class="comment-form card">
          <div class="form-group mb-0">
            <textarea
              id="comment-content"
              v-model="newComment"
              placeholder="따뜻한 댓글을 남겨주세요."
              rows="3"
            />
            <div class="comment-form-actions">
              <button type="button" class="btn btn-primary" :disabled="!newComment.trim()" @click="submitComment">등록</button>
            </div>
          </div>
        </div>
      </section>
    </template>

    <!-- 좋아요 유저 모달 -->
    <div v-if="showLikesModal" class="modal-overlay" @click.self="closeLikesModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>좋아요 누른 유저</h3>
          <button type="button" class="close-btn" @click="closeLikesModal">&times;</button>
        </div>
        <div class="modal-body">
          <div v-if="loadingLikes" class="empty-state">불러오는 중...</div>
          <div v-else-if="likeUsers.length === 0" class="empty-state">아직 좋아요를 누른 유저가 없습니다.</div>
          <ul v-else class="like-user-list">
            <li v-for="u in likeUsers" :key="u.username" class="like-user-item clickable" @click="goToProfile(u)">
              <div class="like-user-avatar">
                <img :src="resolveProfileImageUrl(u.profileImageUrl)" alt="프로필" />
              </div>
              <span class="like-user-name">{{ u.username }}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth.js'
import { getPost, deletePost, addPostLike, removePostLike, getLikeUserList } from '@/api/posts.js'
import { createComment, updateComment, deleteComment, getPostComments } from '@/api/comments.js'
import { resolveProfileImageUrl } from '@/utils/image.js'

const route = useRoute()
const router = useRouter()
const { user, isLoggedIn } = useAuth()

const post = ref(null)
const loading = ref(true)
const error = ref('')
const forbidden = ref(false)  // 403 비공개 접근 여부
const comments = ref([])
const newComment = ref('')
const editingId = ref(null)
const editContent = ref('')
const likePending = ref(false)

const currentPage = ref(1)
const commentsPerPage = 20

const showLikesModal = ref(false)
const likeUsers = ref([])
const loadingLikes = ref(false)

const authorUserId = computed(() => {
  if (!post.value) return ''
  // 백엔드에서 PostDetailResponse DTO에 authorId를 내려준다고 가정하고 우선 사용,
  // 없으면 기존 author(아이디/닉네임)를 그대로 userId로 사용
  return post.value.authorId ?? post.value.author ?? ''
})

const canEdit = computed(() => {
  if (!post.value || !user.value) return false
  return post.value.author === user.value.username
})

function canEditComment(comment) {
  return comment.author === user.value?.username
}

const totalPages = computed(() => {
  return Math.max(1, Math.ceil(comments.value.length / commentsPerPage))
})

const paginatedComments = computed(() => {
  const start = (currentPage.value - 1) * commentsPerPage
  const end = start + commentsPerPage
  return comments.value.slice(start, end)
})

function prevPage() {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}

function nextPage() {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
  }
}

function goToAuthorProfile() {
  if (!authorUserId.value) return
  router.push({ name: 'user-profile', params: { userId: authorUserId.value } })
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
  forbidden.value = false
  getPost(id)
    .then((data) => {
      post.value = data
      return getPostComments(id)
    })
    .then((commentsData) => {
      comments.value = Array.isArray(commentsData) ? commentsData : []
      currentPage.value = 1
    })
    .catch((e) => {
      const status = e.response?.status
      if (status === 403) {
        forbidden.value = true
        error.value = e.response?.data?.message || '작성자만 접근할 수 있는 게시글입니다.'
      } else {
        error.value = e.response?.data?.message || '글 또는 댓글을 불러오지 못했습니다.'
      }
    })
    .finally(() => {
      loading.value = false
    })
}

async function onToggleLike() {
  if (!post.value?.id || likePending.value) return

  likePending.value = true
  const prevLiked = !!post.value.liked
  const prevCount = post.value.likeCount ?? 0

  try {
    let result
    if (prevLiked) {
      result = await removePostLike(post.value.id)
    } else {
      result = await addPostLike(post.value.id)
    }
    // 서버 반환값으로 likeCount 갱신, liked 토글
    post.value.likeCount = result?.totalCount ?? result ?? prevCount
    post.value.liked = !prevLiked
  } catch (e) {
    const status = e.response?.status
    if (status === 409) {
      // 중복 요청 → 이미 처리된 요청, 화면은 유지
      alert('이미 처리된 요청입니다.')
    } else if (status === 403) {
      alert(e.response?.data?.message || '작성자만 접근할 수 있습니다.')
    } else {
      alert(e.response?.data?.message || '좋아요 처리에 실패했습니다.')
    }
    // 실패 시 값 유지
    post.value.liked = prevLiked
    post.value.likeCount = prevCount
  } finally {
    likePending.value = false
  }
}

function confirmDelete() {
  if (!confirm('이 글을 삭제할까요?')) return
  deletePost(post.value.id)
    .then(() => router.push({ name: 'home' }))
    .catch((e) => alert(e.response?.data?.message || '삭제에 실패했습니다.'))
}

async function openLikesModal() {
  if (!post.value?.id) return
  showLikesModal.value = true
  loadingLikes.value = true
  try {
    const data = await getLikeUserList(post.value.id)
    likeUsers.value = data || []
  } catch {
    alert('좋아요 유저 목록을 불러오지 못했습니다.')
  } finally {
    loadingLikes.value = false
  }
}

function closeLikesModal() {
  showLikesModal.value = false
}

function goToProfile(userItem) {
  closeLikesModal()
  router.push({ name: 'user-profile', params: { userId: userItem.userId ?? userItem.id ?? userItem.username } })
}

function submitComment() {
  const content = newComment.value.trim()
  if (!content || !post.value?.id) return
  createComment(post.value.id, content)
    .then((data) => {
      // 댓글 응답: commentId, profileImageUrl, author, authorId, content
      comments.value = [...comments.value, data]
      newComment.value = ''
      // 등록 후 마지막 페이지로 이동
      currentPage.value = totalPages.value
    })
    .catch((e) => {
      const status = e.response?.status
      if (status === 403) {
        alert(e.response?.data?.message || '작성자만 댓글을 작성할 수 있습니다.')
      } else {
        alert(e.response?.data?.message || '댓글 등록에 실패했습니다.')
      }
    })
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
.loader {
  border: 3px solid #f3f3f3;
  border-top: 3px solid var(--accent);
  border-radius: 50%;
  width: 30px;
  height: 30px;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.post-detail-card {
  padding: 3rem 2.5rem;
}
.post-header {
  border-bottom: 1px solid var(--border);
  padding-bottom: 2rem;
  margin-bottom: 2rem;
  text-align: center;
}
.post-meta {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}
.category {
  background: var(--accent-light);
  color: var(--accent-hover);
  padding: 0.35rem 0.8rem;
  border-radius: var(--radius-full);
  font-weight: 600;
  font-size: 0.85rem;
  letter-spacing: 0.02em;
}
.date, .updated {
  color: #94a3b8;
  font-size: 0.95rem;
}
.post-title {
  font-family: var(--font-serif);
  font-size: 2.5rem;
  font-weight: 700;
  line-height: 1.3;
  margin: 0 0 1.5rem;
  color: var(--text);
}
.post-author-row {
  display: flex;
  justify-content: center;
}
.post-author-link {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 1rem;
  border: 1px solid transparent;
  background: rgba(241, 245, 249, 0.5);
  border-radius: var(--radius-full);
  cursor: pointer;
  transition: all 0.2s;
}
.post-author-link:hover {
  background: #f1f5f9;
  border-color: var(--border);
  transform: translateY(-1px);
}
.post-author-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--accent), #818cf8);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  font-weight: 600;
  color: #fff;
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}
.post-author-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.post-author-name {
  font-size: 1rem;
  font-weight: 500;
  color: var(--text);
}

.post-body-wrapper {
  font-size: 1.1rem;
  line-height: 1.8;
  color: #334155;
  border-radius: 0;
}
.post-body {
  white-space: pre-wrap;
  word-break: break-word;
}
.post-body :deep(p) {
  margin: 0 0 1.25rem;
  border-radius: 0;
}

.like-section {
  display: flex;
  justify-content: center;
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 1px dotted var(--border);
}
.like-btn-group {
  display: flex;
  gap: 1rem;
  align-items: center;
}
.like-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: 2px solid var(--border);
  border-radius: var(--radius-full);
  background: #fff;
  color: var(--text-muted);
  font-size: 1.05rem;
  font-weight: 600;
  transition: all 0.2s;
  box-shadow: var(--shadow-sm);
}
.like-btn:hover {
  border-color: #fca5a5;
  color: var(--danger);
  transform: translateY(-2px);
}
.like-btn.liked {
  color: var(--danger);
  border-color: rgba(239, 68, 68, 0.5);
  background: rgba(239, 68, 68, 0.05);
}
.like-count {
  margin-left: 0.25rem;
  font-size: 1.1rem;
}
.like-count-only {
  font-size: 1.1rem;
  color: var(--danger);
  font-weight: 600;
  background: rgba(239, 68, 68, 0.05);
  padding: 0.75rem 1.5rem;
  border-radius: var(--radius-full);
}
.view-likes-btn {
  padding: 0.75rem 1.5rem;
  border-radius: var(--radius-full);
  border: 1px solid var(--border);
  background: #f8fafc;
  color: var(--text-muted);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: var(--shadow-sm);
}
.view-likes-btn:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
  color: #334155;
  transform: translateY(-2px);
}

.actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  margin-bottom: 3rem;
  margin-top: 1rem;
}

.comments-section {
  margin-top: 2rem;
}
.comments-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 0 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.comments-title span {
  background: var(--accent-light);
  color: var(--accent-hover);
  padding: 0.1rem 0.6rem;
  border-radius: var(--radius-full);
  font-size: 1.1rem;
}

.mb-0 { margin-bottom: 0 !important; }
.comment-form {
  padding: 1.5rem;
  margin-bottom: 2rem;
  border: 2px solid transparent;
}
.comment-form:focus-within {
  border-color: rgba(99, 102, 241, 0.2);
}
.comment-form textarea {
  border: none;
  background: transparent;
  box-shadow: none;
  padding: 0;
  font-size: 1.05rem;
  width: 100%;
  resize: vertical;
  border-radius: 0;
}
.comment-form textarea:focus {
  outline: none;
  box-shadow: none;
}
.comment-form-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 1rem;
  border-top: 1px solid var(--border);
  padding-top: 1rem;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin: 2rem 0;
}
.pagination-btn {
  padding: 0.5rem 1rem;
  border: 1px solid var(--border);
  background: white;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s;
}
.pagination-btn:hover:not(:disabled) {
  background: var(--accent-light);
  color: var(--accent-hover);
  border-color: var(--accent-light);
}
.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.pagination-info {
  font-weight: 600;
  color: var(--text-muted);
}

.comment-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.comment-item {
  padding: 1.5rem;
  margin-bottom: 0;
}
.comment-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}
.comment-author-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.avatar-sm {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-muted);
  overflow: hidden;
}
.avatar-sm img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.comment-author {
  font-weight: 600;
  color: var(--text);
}
.comment-actions button {
  padding: 0.25rem 0.5rem;
  font-size: 0.85rem;
}
.comment-content {
  margin: 0;
  font-size: 1.05rem;
  line-height: 1.6;
  color: #334155;
  white-space: pre-wrap;
}
.comment-edit textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  margin-bottom: 0.75rem;
  font-size: 1.05rem;
}
.comment-edit-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

/* Modal CSS */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
  padding-bottom: 64px; /* 헤더 높이 보정 */
}
.modal-content {
  background: #fff;
  border-radius: var(--radius-lg);
  width: 90%;
  max-width: 400px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
}
.modal-header {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
}
.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #64748b;
}
.close-btn:hover {
  color: var(--text);
}
.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
}
.like-user-list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.like-user-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  border-bottom: 1px solid #f1f5f9;
  border-radius: 8px;
  transition: background-color 0.2s;
}
.like-user-item.clickable {
  cursor: pointer;
}
.like-user-item.clickable:hover {
  background-color: rgba(0, 0, 0, 0.03);
}
.like-user-item:last-child {
  border-bottom: none;
}
.like-user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--accent), #818cf8);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 1.1rem;
  overflow: hidden;
}
.like-user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.like-user-name {
  font-weight: 500;
  color: var(--text);
  font-size: 1rem;
}

/* 403 비공개 접근 */
.forbidden-msg {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 5rem 1rem;
  color: var(--text-muted);
}
.forbidden-icon {
  font-size: 3rem;
  margin-bottom: 0.5rem;
}
.forbidden-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text);
  margin: 0;
}
.forbidden-desc {
  font-size: 0.95rem;
  color: var(--text-muted);
  margin: 0;
}
</style>
