<template>
  <div class="app-container">
    <h1 class="page-title">{{ isMyPosts ? '내 작성 글' : '사용자 작성 글' }}</h1>

    <div class="posts-layout">
      <!-- 카테고리 사이드바 -->
      <aside class="category-sidebar">
        <div class="sidebar-title">카테고리</div>
        <ul class="category-list">
          <li>
            <button
              class="category-item"
              :class="{ active: selectedCategoryId === null }"
              @click="selectCategory(null)"
            >
              <span class="cat-name">전체 글</span>
              <span class="cat-count">{{ allPosts.length }}</span>
            </button>
          </li>
          <li v-for="cat in categories" :key="cat.id">
            <button
              class="category-item"
              :class="{ active: selectedCategoryId === cat.id }"
              @click="selectCategory(cat.id)"
            >
              <span class="cat-name">{{ cat.categoryName }}</span>
              <span class="cat-count">{{ cat.postsCount ?? '' }}</span>
            </button>
          </li>
        </ul>
      </aside>

      <!-- 글 목록 -->
      <div class="posts-area">
        <div v-if="loading" class="empty-state">불러오는 중...</div>
        <div v-else-if="error" class="empty-state error-msg">{{ error }}</div>
        <div v-else-if="!posts.length" class="empty-state">
          {{ selectedCategoryId ? '이 카테고리에 작성한 글이 없습니다.' : '작성한 글이 없습니다.' }}
        </div>
        <template v-else>
          <div
            v-if="selectedCategoryId"
            class="selected-category-label"
          >
            <span class="selected-cat-badge">
              {{ selectedCategoryName }}
            </span>
            <span class="selected-cat-count">{{ posts.length }}개</span>
          </div>
          <article
            v-for="post in posts"
            :key="post.id"
            class="card post-card"
            :class="{ 'private-post': isMyPosts && !post.publicStatus }"
            @click="goToPost(post.id)"
          >
            <div class="post-meta">
              <div class="meta-left">
                <span v-if="post.categoryName" class="category">{{ post.categoryName }}</span>
                <span class="date">{{ formatDate(post.createdAt) }}</span>
                <!-- 내 페이지일 때만 공개/비공개 배지 표시 -->
                <span
                  v-if="isMyPosts"
                  class="visibility"
                  :class="post.publicStatus ? 'public' : 'private'"
                >
                  {{ post.publicStatus ? '공개' : '🔒 비공개' }}
                </span>
              </div>
              <span class="likes">♥ {{ post.likeCount ?? 0 }}</span>
            </div>
            <h2 class="post-title">{{ post.title }}</h2>
            <p class="post-excerpt">{{ excerpt(post.content) }}</p>
          </article>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth.js'
import { getUserPosts } from '@/api/posts.js'
import { getCategoryList, getCategoryPosts } from '@/api/categories.js'

const route = useRoute()
const router = useRouter()
const { user } = useAuth()

const allPosts = ref([])
const posts = ref([])
const categories = ref([])
const loading = ref(true)
const error = ref('')
const selectedCategoryId = ref(null)

const targetUserId = computed(() => route.params.userId || user.value?.userId || user.value?.id || user.value?.username || '')
const isMyPosts = computed(() => targetUserId.value == (user.value?.userId || user.value?.id || user.value?.username))

const selectedCategoryName = computed(() => {
  if (!selectedCategoryId.value) return ''
  const cat = categories.value.find(c => c.id === selectedCategoryId.value)

  return cat?.categoryName ?? ''
})

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

async function selectCategory(categoryId) {
  selectedCategoryId.value = categoryId

  if (categoryId === null) {
    posts.value = allPosts.value
    return
  }

  loading.value = true
  try {
    const data = await getCategoryPosts(categoryId)
    posts.value = Array.isArray(data) ? data : data.content ?? data ?? []
  } catch (e) {
    error.value = e.response?.data?.message || '카테고리 글을 불러오지 못했습니다.'
  } finally {
    loading.value = false
  }
}

async function loadPosts() {
  if (!targetUserId.value) {
    error.value = '사용자 정보를 불러오지 못했습니다.'
    loading.value = false
    return
  }

  loading.value = true
  error.value = ''
  selectedCategoryId.value = null

  try {
    const [postsData, catsData] = await Promise.all([
      getUserPosts(targetUserId.value),
      // 본인: 공개+비공개 모두 / 타인·비로그인: 공개글만 (API에서 자동 필터)
      getCategoryList(targetUserId.value),
    ])
    allPosts.value = Array.isArray(postsData) ? postsData : postsData.content ?? postsData ?? []
    posts.value = allPosts.value
    // 카테고리: 본인이면 비공개글만 있는 카테고리도 포함, 타인이면 공개글 1개 이상 카테고리만
    categories.value = Array.isArray(catsData) ? catsData : catsData.content ?? catsData ?? []
  } catch (e) {
    const status = e.response?.status
    if (status === 403) {
      error.value = e.response?.data?.message || '접근 권한이 없습니다.'
    } else {
      error.value = e.response?.data?.message || '목록을 불러오지 못했습니다.'
    }
  } finally {
    loading.value = false
  }
}

onMounted(loadPosts)
watch(() => route.params.userId, loadPosts)
</script>

<style scoped>
/* 전체 레이아웃 */
.posts-layout {
  display: flex;
  gap: 1.5rem;
  align-items: flex-start;
}

/* 카테고리 사이드바 */
.category-sidebar {
  width: 200px;
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 1rem;
  position: sticky;
  top: 80px;
  backdrop-filter: blur(8px);
}

.sidebar-title {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted);
  padding: 0 0.5rem 0.75rem;
  border-bottom: 1px solid var(--border);
  margin-bottom: 0.5rem;
}

.category-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.category-item {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.6rem;
  border: none;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--text-muted);
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  text-align: left;
  gap: 0.4rem;
}

.category-item:hover {
  background: var(--accent-light);
  color: var(--accent-hover);
}

.category-item.active {
  background: var(--accent-light);
  color: var(--accent);
  font-weight: 700;
}

.cat-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cat-count {
  font-size: 0.75rem;
  background: var(--border);
  color: var(--text-muted);
  padding: 0.1rem 0.4rem;
  border-radius: 999px;
  min-width: 20px;
  text-align: center;
  flex-shrink: 0;
}

.category-item.active .cat-count {
  background: rgba(99, 102, 241, 0.15);
  color: var(--accent);
}

/* 선택된 카테고리 레이블 */
.selected-category-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.selected-cat-badge {
  background: var(--accent-light);
  color: var(--accent-hover);
  font-weight: 700;
  font-size: 0.95rem;
  padding: 0.3rem 0.9rem;
  border-radius: var(--radius-full);
}

.selected-cat-count {
  font-size: 0.9rem;
  color: var(--text-muted);
}

/* 글 목록 */
.posts-area {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.post-card {
  cursor: pointer;
  transition: box-shadow 0.2s, transform 0.2s;
}
.post-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.post-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  color: var(--text-muted);
}
.meta-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.category {
  background: var(--border);
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  color: var(--text);
  font-size: 0.8rem;
}
.likes {
  color: var(--danger);
  font-weight: 600;
  background: rgba(239, 68, 68, 0.05);
  padding: 0.2rem 0.6rem;
  border-radius: var(--radius-full);
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

/* 비밀글 스타일 */
.private-post {
  opacity: 0.55;
}
.private-post:hover {
  opacity: 0.85;
}
.visibility.public {
  font-size: 0.8rem;
  color: #22c55e;
  background: rgba(34, 197, 94, 0.08);
  padding: 0.15rem 0.45rem;
  border-radius: 4px;
}
.visibility.private {
  font-size: 0.8rem;
  color: #ef4444;
  background: rgba(239, 68, 68, 0.08);
  padding: 0.15rem 0.45rem;
  border-radius: 4px;
  font-weight: 600;
}

/* 반응형 */
@media (max-width: 640px) {
  .posts-layout {
    flex-direction: column;
  }
  .category-sidebar {
    width: 100%;
    position: static;
  }
  .category-list {
    flex-direction: row;
    flex-wrap: wrap;
    gap: 0.4rem;
  }
  .category-item {
    width: auto;
    flex: none;
  }
}
</style>
