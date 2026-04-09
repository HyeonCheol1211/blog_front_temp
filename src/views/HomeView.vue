<template>
  <div class="app-container">
    <!-- ── 헤더 ── -->
    <div class="page-header">
      <h1 class="page-title">블로그</h1>
      <p class="page-subtitle">최신 블로그 포스트를 만나보세요</p>
    </div>

    <!-- ── 탭 ── -->
    <div class="tab-bar">
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'all' }"
        @click="switchTab('all')"
      >
        전체 글
      </button>
      <button
        v-if="isLoggedIn"
        class="tab-btn"
        :class="{ active: activeTab === 'following' }"
        @click="switchTab('following')"
      >
        팔로잉
        <span v-if="activeTab === 'following' && followingPosts.length" class="tab-badge">
          {{ followingPosts.length }}
        </span>
      </button>
    </div>

    <!-- ═══════════════ 전체글 탭 ═══════════════ -->
    <template v-if="activeTab === 'all'">
      <!-- 정렬 컨트롤 -->
      <div class="sort-bar">
        <div class="sort-btns">
          <button
            class="sort-btn"
            :class="{ active: sortMode === POST_SORT_TYPE.LATEST }"
            @click="setSortMode(POST_SORT_TYPE.LATEST)"
          >
            🕐 최신순
          </button>
          <button
            class="sort-btn"
            :class="{ active: isLikeSort }"
            @click="setSortMode(POST_SORT_TYPE.WEEKLY_LIKE)"
          >
            ♥ 좋아요순
          </button>
        </div>
        <transition name="fade-slide">
          <div v-if="isLikeSort" class="period-select-wrap">
            <select class="period-select" v-model="sortMode" @change="loadPosts">
              <option :value="POST_SORT_TYPE.WEEKLY_LIKE">일주일</option>
              <option :value="POST_SORT_TYPE.MONTHLY_LIKE">한 달</option>
              <option :value="POST_SORT_TYPE.YEARLY_LIKE">1년</option>
            </select>
          </div>
        </transition>
      </div>

      <div v-if="loading" class="empty-state">
        <div class="loader"></div>
        <p>불러오는 중...</p>
      </div>
      <div v-else-if="error" class="empty-state error-msg">{{ error }}</div>
      <div v-else-if="!posts.length" class="empty-state">
        <p>등록된 글이 없습니다.</p>
      </div>
      <div v-else class="post-grid">
        <article
          v-for="post in pagedPosts"
          :key="post.id"
          class="card post-card"
          @click="goToPost(post.id)"
        >
          <div class="post-meta">
            <div class="meta-left">
              <span v-if="post.categoryName" class="category">{{ post.categoryName }}</span>
              <span class="date">{{ formatDate(post.createdAt) }}</span>
            </div>
            <span class="likes">♥ {{ post.likeCount ?? 0 }}</span>
          </div>
          <h2 class="post-title">{{ post.title }}</h2>
          <p class="post-excerpt">{{ excerpt(post.content) }}</p>
          <div class="post-author-row" @click.stop="goToProfile(post.authorId || post.author)" title="프로필 보기">
            <div class="avatar">
              <img :src="resolveProfileImageUrl(post.profileImageUrl)" alt="프로필" />
            </div>
            <div class="post-author">{{ post.author }}</div>
          </div>
        </article>
      </div>

      <!-- 페이지네이션 콘트롤 -->
      <div v-if="totalPages > 1" class="pagination">
        <button
          class="page-btn"
          :disabled="currentPage === 1"
          @click="currentPage = 1"
          title="첫 페이지"
        >«</button>
        <button
          class="page-btn"
          :disabled="currentPage === 1"
          @click="currentPage--"
          title="이전 페이지"
        >‹</button>

        <button
          v-for="p in pageNumbers"
          :key="p"
          class="page-btn"
          :class="{ active: p === currentPage, ellipsis: p === '...' }"
          :disabled="p === '...'"
          @click="p !== '...' && (currentPage = p)"
        >{{ p }}</button>

        <button
          class="page-btn"
          :disabled="currentPage === totalPages"
          @click="currentPage++"
          title="다음 페이지"
        >›</button>
        <button
          class="page-btn"
          :disabled="currentPage === totalPages"
          @click="currentPage = totalPages"
          title="마지막 페이지"
        >»</button>
      </div>
    </template>

    <!-- ═══════════════ 팔로잉 탭 ═══════════════ -->
    <template v-if="activeTab === 'following'">
      <div v-if="followingLoading" class="empty-state">
        <div class="loader"></div>
        <p>팔로잉 피드 불러오는 중...</p>
      </div>
      <div v-else-if="followingError" class="empty-state error-msg">{{ followingError }}</div>
      <div v-else-if="!followingPosts.length" class="empty-state following-empty">
        <div class="empty-icon">🔭</div>
        <p class="empty-title">아직 팔로잉 피드가 없어요</p>
        <p class="empty-desc">다른 사용자를 팔로우하면 여기서 글을 볼 수 있어요.</p>
      </div>
      <div v-else class="post-grid">
        <article
          v-for="post in followingPosts"
          :key="post.id"
          class="card post-card"
          @click="goToPost(post.id)"
        >
          <div class="post-meta">
            <div class="meta-left">
              <span v-if="post.categoryName" class="category">{{ post.categoryName }}</span>
              <span class="date">{{ formatDate(post.createdAt) }}</span>
            </div>
            <span class="likes">♥ {{ post.likeCount ?? 0 }}</span>
          </div>
          <h2 class="post-title">{{ post.title }}</h2>
          <p class="post-excerpt">{{ excerpt(post.content) }}</p>
          <div class="post-author-row" @click.stop="goToProfile(post.authorId || post.author)" title="프로필 보기">
            <div class="avatar">
              <img :src="resolveProfileImageUrl(post.profileImageUrl)" alt="프로필" />
            </div>
            <div class="post-author">{{ post.author }}</div>
          </div>
        </article>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getPosts, getUserPosts, POST_SORT_TYPE } from '@/api/posts.js'
import { getFollowingList } from '@/api/users.js'
import { useAuth } from '@/composables/useAuth.js'
import { resolveProfileImageUrl } from '@/utils/image.js'

function formatDate(val) {
  if (!val) return ''
  return new Date(val).toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}

function excerpt(text) {
  if (!text) return ''
  const plain = text.replace(/<[^>]+>/g, '')
  return plain.length > 120 ? plain.slice(0, 120) + '…' : plain
}

// ── 상태 ────────────────────────────────────────────────────────
const router = useRouter()
const { isLoggedIn, user } = useAuth()

const activeTab = ref('all')

// 전체글
const posts = ref([])
const loading = ref(true)
const error = ref('')

// 페이지네이션
const PAGE_SIZE = 10
const currentPage = ref(1)
const totalPages = computed(() => Math.max(1, Math.ceil(posts.value.length / PAGE_SIZE)))
const pagedPosts = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return posts.value.slice(start, start + PAGE_SIZE)
})
// 페이지 번호 모음 (슬라이딩 번호 + '...' 진입서)
const pageNumbers = computed(() => {
  const total = totalPages.value
  const cur = currentPage.value
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages = []
  pages.push(1)
  if (cur > 3) pages.push('...')
  const start = Math.max(2, cur - 1)
  const end = Math.min(total - 1, cur + 1)
  for (let i = start; i <= end; i++) pages.push(i)
  if (cur < total - 2) pages.push('...')
  pages.push(total)
  return pages
})

// 정렬 — POST_SORT_TYPE enum 상수 사용
const sortMode = ref(POST_SORT_TYPE.LATEST)
const isLikeSort = computed(() => sortMode.value !== POST_SORT_TYPE.LATEST)

// 정렬 모드 전환
async function setSortMode(mode) {
  sortMode.value = mode
  currentPage.value = 1
  await loadPosts()
}

// ── 전체글 로드 ────────────────────────────────────────────────
async function loadPosts() {
  loading.value = true
  error.value = ''
  currentPage.value = 1
  try {
    const data = await getPosts(sortMode.value)
    const list = Array.isArray(data) ? data : data.content ?? data
    // LATEST 정렬은 프론트에서 id 내림차순으로 한 번 더 정렬 (서버 순서 보정)
    if (sortMode.value === POST_SORT_TYPE.LATEST) {
      list.sort((a, b) => b.id - a.id)
    }
    // 좋아요 0인 글도 그대로 렌더링 (likeCount ?? 0 처리는 템플릿에서)
    posts.value = list
  } catch (e) {
    const status = e.response?.status
    if (status === 400) {
      error.value = '잘못된 정렬 옵션입니다.'
    } else {
      error.value = e.response?.data?.message || '글 목록을 불러오지 못했습니다.'
    }
  } finally {
    loading.value = false
  }
}

// 팔로잉 피드
const followingPosts = ref([])
const followingLoading = ref(false)
const followingError = ref('')
let followingLoaded = false   // 한 번만 fetch

// ── 탭 전환 ────────────────────────────────────────────────────
async function switchTab(tab) {
  activeTab.value = tab
  if (tab === 'following' && !followingLoaded) {
    await loadFollowingFeed()
  }
}

// ── 팔로잉 피드 로드 ───────────────────────────────────────────
async function loadFollowingFeed() {
  followingLoading.value = true
  followingError.value = ''
  try {
    const myId = user.value?.userId
    if (!myId) throw new Error('로그인 정보를 확인할 수 없습니다.')

    const followingList = await getFollowingList(myId)
    const results = await Promise.allSettled(
      followingList.map((f) => getUserPosts(f.followingId))
    )
    const merged = []
    for (const r of results) {
      if (r.status === 'fulfilled' && Array.isArray(r.value)) {
        merged.push(...r.value)
      }
    }
    merged.sort((a, b) => b.id - a.id)
    followingPosts.value = merged
    followingLoaded = true
  } catch (e) {
    followingError.value = e.response?.data?.message || e.message || '팔로잉 피드를 불러오지 못했습니다.'
  } finally {
    followingLoading.value = false
  }
}

onMounted(loadPosts)

// ── 네비게이션 ──────────────────────────────────────────────────
function goToPost(id) {
  router.push({ name: 'post-detail', params: { id } })
}
function goToProfile(username) {
  router.push({ name: 'user-profile', params: { userId: username } })
}
</script>

<style scoped>
/* ── 헤더 ── */
.page-header {
  margin-bottom: 2rem;
  text-align: center;
}
.page-title {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
}
.page-subtitle {
  color: var(--text-muted);
  font-size: 1.1rem;
}

/* ── 탭 바 ── */
.tab-bar {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 2rem;
  border-bottom: 2px solid var(--border);
  padding-bottom: 0;
}
.tab-btn {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.6rem 1.4rem;
  border: none;
  background: transparent;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-muted);
  cursor: pointer;
  border-bottom: 3px solid transparent;
  margin-bottom: -2px;
  transition: color 0.2s, border-color 0.2s;
  border-radius: 0;
}
.tab-btn:hover {
  color: var(--accent);
}
.tab-btn.active {
  color: var(--accent);
  border-bottom-color: var(--accent);
}
.tab-badge {
  background: var(--accent);
  color: #fff;
  font-size: 0.72rem;
  font-weight: 700;
  padding: 0.1rem 0.45rem;
  border-radius: 99px;
  line-height: 1.4;
}

/* ── 정렬 바 ── */
.sort-bar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}
.sort-btns {
  display: flex;
  gap: 0.4rem;
  background: var(--surface, rgba(241,245,249,0.8));
  border-radius: 99px;
  padding: 0.25rem;
  border: 1px solid var(--border);
}
.sort-btn {
  padding: 0.35rem 1rem;
  border: none;
  border-radius: 99px;
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  background: transparent;
  color: var(--text-muted);
  transition: all 0.2s;
}
.sort-btn:hover {
  color: var(--accent);
}
.sort-btn.active {
  background: var(--accent, #6366f1);
  color: #fff;
  box-shadow: 0 2px 8px rgba(99,102,241,0.25);
}
.period-select-wrap {
  display: flex;
  align-items: center;
}
.period-select {
  padding: 0.35rem 0.9rem;
  border-radius: 99px;
  border: 1.5px solid var(--accent, #6366f1);
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--accent, #6366f1);
  background: transparent;
  cursor: pointer;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  appearance: none;
  -webkit-appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24'%3E%3Cpath fill='%236366f1' d='M7 10l5 5 5-5z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.6rem center;
  padding-right: 2rem;
}
.period-select:focus {
  box-shadow: 0 0 0 3px rgba(99,102,241,0.15);
}

/* ── 트랜지션 ── */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: opacity 0.2s, transform 0.2s;
}
.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(-6px);
}

/* ── 그리드 ── */
.post-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
}

/* ── 카드 ── */
.post-card {
  cursor: pointer;
  display: flex;
  flex-direction: column;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  height: 100%;
  margin-bottom: 0;
  border: 1px solid rgba(226, 232, 240, 0.6);
  background: rgba(255, 255, 255, 0.7);
}
.post-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
  border-color: rgba(99, 102, 241, 0.2);
  background: rgba(255, 255, 255, 0.95);
}



.post-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
  font-size: 0.85rem;
}
.category {
  background: var(--accent-light);
  color: var(--accent-hover);
  padding: 0.25rem 0.6rem;
  border-radius: var(--radius-full);
  font-weight: 600;
  letter-spacing: 0.02em;
}
.date { color: #94a3b8; }
.meta-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
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
  font-size: 1.35rem;
  font-weight: 700;
  margin: 0 0 0.75rem;
  color: var(--text);
  line-height: 1.4;
}
.post-excerpt {
  margin: 0 0 1.5rem;
  color: var(--text-muted);
  font-size: 0.95rem;
  line-height: 1.6;
  flex: 1;
}
.post-author-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: auto;
  border-top: 1px solid var(--border);
  padding-top: 1rem;
  border-radius: 4px;
  transition: background-color 0.2s;
}
.post-author-row:hover { background-color: rgba(0, 0, 0, 0.03); }
.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--accent), #818cf8);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.9rem;
  overflow: hidden;
  flex-shrink: 0;
}
.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.post-author {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text);
}

/* ── 빈 상태 ── */
.empty-state {
  text-align: center;
  padding: 4rem 1rem;
  color: var(--text-muted);
}
.following-empty {
  padding: 5rem 1rem;
}
.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}
.empty-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 0.5rem;
}
.empty-desc {
  font-size: 0.95rem;
  color: var(--text-muted);
}
.error-msg { color: var(--danger); }

/* ── 페이지네이션 ── */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.35rem;
  margin-top: 2.5rem;
  flex-wrap: wrap;
}
.page-btn {
  min-width: 36px;
  height: 36px;
  padding: 0 0.6rem;
  border: 1.5px solid var(--border);
  border-radius: 8px;
  background: transparent;
  color: var(--text-muted);
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.18s;
  display: flex;
  align-items: center;
  justify-content: center;
}
.page-btn:hover:not(:disabled):not(.ellipsis) {
  border-color: var(--accent);
  color: var(--accent);
  background: var(--accent-light, rgba(99,102,241,0.07));
}
.page-btn.active {
  background: var(--accent, #6366f1);
  border-color: var(--accent, #6366f1);
  color: #fff;
  box-shadow: 0 2px 8px rgba(99,102,241,0.25);
}
.page-btn:disabled {
  opacity: 0.35;
  cursor: default;
}
.page-btn.ellipsis {
  border-color: transparent;
  cursor: default;
  letter-spacing: 0.05em;
}

/* ── 로더 ── */
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
  0%   { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
