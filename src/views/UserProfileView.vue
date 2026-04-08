<template>
  <div class="app-container profile-page">
    <div v-if="loading" class="empty-state">
      <div class="loader"></div>
      <p>프로필을 불러오는 중...</p>
    </div>
    <div v-else-if="error" class="empty-state error-msg">{{ error }}</div>
    <div v-else-if="!profile" class="empty-state">프로필 정보를 찾을 수 없습니다.</div>
    <div v-else class="card profile-card animate-fade-in">
      <div class="profile-header">
        <div class="avatar-wrapper">
          <div class="avatar-glow"></div>
          <div class="avatar">
            <img
              :src="resolveProfileImageUrl(profile.profileImageUrl)"
              alt="프로필 사진"
            />
          </div>
        </div>
        <div class="profile-main">
          <h1 class="profile-name">
            {{ profile.displayName || profile.username }}
          </h1>
          <p class="profile-username">@{{ profile.username }}</p>
          <p v-if="profile.bio" class="profile-bio">
            {{ profile.bio }}
          </p>
          <div class="profile-info">
            <span v-if="profile.email" class="profile-info-item">
              <span class="info-icon">📧</span>
              {{ profile.email }}
            </span>
            <span v-if="profile.createdAt" class="profile-info-item">
              <span class="info-icon">📅</span>
              {{ formatDate(profile.createdAt) }} 가입
            </span>
          </div>
          <div class="profile-stats">
            <div class="stat-item clickable" @click="openModal('followers')">
              <span class="stat-value">{{ profile.followerCount ?? 0 }}</span>
              <span class="stat-label">팔로워</span>
            </div>
            <div class="stat-item clickable" @click="openModal('following')">
              <span class="stat-value">{{ profile.followingCount ?? 0 }}</span>
              <span class="stat-label">팔로잉</span>
            </div>
            <div class="stat-item clickable" v-if="profile.postAllCount != null || profile.postPublicCount != null" @click="goToUserPosts">
              <span class="stat-value">{{ isOwnProfile ? (profile.postAllCount ?? 0) : (profile.postPublicCount ?? 0) }}</span>
              <span class="stat-label">작성글</span>
            </div>
          </div>
        </div>
        <div v-if="isLoggedIn && !isOwnProfile" class="profile-actions">
          <button
            type="button"
            class="btn btn-primary"
            :class="{ 'btn-secondary': isFollowing }"
            :disabled="followPending"
            @click="onToggleFollow"
          >
            {{ isFollowing ? '팔로우 취소' : '팔로우' }}
          </button>
        </div>
        <div v-else-if="isLoggedIn && isOwnProfile" class="profile-actions">
          <button
            type="button"
            class="btn btn-secondary"
            @click="goToProfileEdit"
          >
            프로필 수정
          </button>
        </div>
      </div>
    </div>

    <!-- Follow List Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content animate-fade-in">
        <div class="modal-header">
          <h3>{{ modalType === 'followers' ? '팔로워' : '팔로잉' }}</h3>
          <button class="close-btn" @click="closeModal">&times;</button>
        </div>
        <div class="modal-body">
          <div v-if="modalLoading" class="loader"></div>
          <div v-else-if="modalUsers.length === 0" class="empty-list">
            {{ modalType === 'followers' ? '팔로워가 없습니다.' : '팔로잉하는 유저가 없습니다.' }}
          </div>
          <ul v-else class="user-list">
            <li
              v-for="userItem in modalUsers"
              :key="userItem.followerId ?? userItem.followingId ?? userItem.userId ?? userItem.username"
              class="user-item"
              @click="goToProfile(userItem)"
            >
              <div class="user-avatar">
                <img
                  :src="resolveProfileImageUrl(userItem.profileImageUrl)"
                  alt="프로필"
                />
              </div>
              <span class="user-name">{{ userItem.username }}</span>
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
import { getUserProfileBasic, getUserProfileExtra, addFollow, removeFollow, getFollowerList, getFollowingList } from '@/api/users.js'
import { resolveProfileImageUrl } from '@/utils/image.js'

const route = useRoute()
const router = useRouter()
const { user, isLoggedIn } = useAuth()

function formatDate(val) {
  if (!val) return ''
  return new Date(val).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

const profile = ref(null)
const loading = ref(true)
const error = ref('')
const followPending = ref(false)

const showModal = ref(false)
const modalType = ref('followers')
const modalUsers = ref([])
const modalLoading = ref(false)

const isOwnProfile = computed(() => {
  if (!user.value?.username || !profile.value?.username) return false
  return user.value.username === profile.value.username
})

const isFollowing = computed(() => !!profile.value?.isFollowing)

function loadProfile() {
  const userId = route.params.userId
  if (!userId) return

  loading.value = true
  error.value = ''

  Promise.all([
    getUserProfileBasic(userId),
    getUserProfileExtra(userId)
  ])
    .then(([basicData, extraData]) => {
      profile.value = { ...basicData, ...extraData }
    })
    .catch((e) => {
      error.value = e.response?.data?.message || '프로필 정보를 불러오지 못했습니다.'
    })
    .finally(() => {
      loading.value = false
    })
}

async function onToggleFollow() {
  if (!profile.value?.id || followPending.value) return

  followPending.value = true
  const wasFollowing = !!profile.value.isFollowing

  try {
    if (wasFollowing) {
      await removeFollow(profile.value.id)
    } else {
      await addFollow(profile.value.id)
    }
    // API 성공 후 상태 확정
    profile.value.isFollowing = !wasFollowing
    profile.value.followerCount = wasFollowing
      ? Math.max((profile.value.followerCount ?? 1) - 1, 0)
      : (profile.value.followerCount ?? 0) + 1
  } catch (e) {
    const status = e.response?.status
    if (status === 409) {
      // 이미 팔로우/취소 한 상태 → 화면 유지
      alert('이미 처리된 요청입니다.')
    } else {
      alert(e.response?.data?.message || '팔로우 처리에 실패했습니다.')
    }
  } finally {
    followPending.value = false
  }
}

async function openModal(type) {
  if (!profile.value?.id) return
  modalType.value = type
  showModal.value = true
  modalLoading.value = true
  modalUsers.value = []

  try {
    if (type === 'followers') {
      modalUsers.value = await getFollowerList(profile.value.id)
    } else {
      modalUsers.value = await getFollowingList(profile.value.id)
    }
  } catch (e) {
    console.error('Failed to load list:', e)
  } finally {
    modalLoading.value = false
  }
}

function closeModal() {
  showModal.value = false
}

function goToProfile(userItem) {
  closeModal()
  // 팔로워: followerId, 팔로잉: followingId, 황일 로고인 유저: userId 순서로 fallback
  const id = userItem.followerId ?? userItem.followingId ?? userItem.userId ?? userItem.id ?? userItem.username
  router.push({ name: 'user-profile', params: { userId: id } })
}

function goToProfileEdit() {
  router.push({ name: 'profile-edit' })
}

function goToUserPosts() {
  if (!profile.value?.id) return
  router.push({ name: 'user-posts', params: { userId: profile.value.id } })
}

onMounted(loadProfile)
watch(
  () => route.params.userId,
  () => loadProfile()
)
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

.profile-page {
  padding-top: 3rem;
}
.profile-card {
  max-width: 720px;
  margin: 0 auto;
  padding: 3rem 2rem;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01);
}
.profile-header {
  display: flex;
  align-items: center;
  gap: 2rem;
  flex-wrap: wrap;
}

.avatar-wrapper {
  position: relative;
  width: 96px;
  height: 96px;
  flex-shrink: 0;
}
.avatar-glow {
  position: absolute;
  top: -4px;
  left: -4px;
  right: -4px;
  bottom: -4px;
  background: linear-gradient(135deg, var(--accent), #818cf8);
  border-radius: 50%;
  z-index: 0;
  opacity: 0.6;
  filter: blur(8px);
}
.avatar {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--accent);
  overflow: hidden;
  z-index: 1;
  border: 3px solid #fff;
  box-shadow: var(--shadow-sm);
}
.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.profile-main {
  flex: 1;
  min-width: 280px;
}
.profile-name {
  margin: 0 0 0.25rem;
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--text);
  line-height: 1.2;
}
.profile-username {
  margin: 0 0 1rem;
  font-size: 1.05rem;
  color: var(--accent);
  font-weight: 500;
}
.profile-bio {
  margin: 0 0 1rem;
  font-size: 1.05rem;
  line-height: 1.6;
  color: #475569;
}

.profile-info {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem 1.5rem;
  margin-bottom: 1.5rem;
}
.profile-info-item {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.9rem;
  color: var(--text-muted);
}
.info-icon {
  font-size: 0.9rem;
}

.profile-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 2rem;
}
.stat-item {
  display: flex;
  flex-direction: column;
}
.stat-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text);
}
.stat-label {
  font-size: 0.85rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-top: 0.1rem;
}

.stat-item.clickable {
  cursor: pointer;
  transition: opacity 0.2s;
}
.stat-item.clickable:hover {
  opacity: 0.7;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  padding-bottom: 64px; /* 헤더 높이 보정 */
}

.modal-content {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  border-radius: 16px;
  width: 100%;
  max-width: 400px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text);
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  line-height: 1;
  color: var(--text-muted);
  cursor: pointer;
  padding: 0;
  transition: color 0.2s;
}

.close-btn:hover {
  color: var(--text);
}

.modal-body {
  padding: 1rem;
  overflow-y: auto;
  flex: 1;
}

.empty-list {
  text-align: center;
  padding: 2rem;
  color: var(--text-muted);
}

.user-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.user-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.user-item:hover {
  background-color: rgba(0, 0, 0, 0.03);
}

.user-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--bg-color);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--accent);
  overflow: hidden;
  border: 2px solid #fff;
  box-shadow: var(--shadow-sm);
  flex-shrink: 0;
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-name {
  font-weight: 600;
  color: var(--text);
  font-size: 1rem;
}

.profile-actions {
  margin-left: auto;
  align-self: center;
}
.profile-actions .btn {
  padding: 0.75rem 1.5rem;
  min-width: 120px;
}
@media (max-width: 600px) {
  .profile-header {
    flex-direction: column;
    text-align: center;
    gap: 1.5rem;
  }
  .profile-actions {
    margin: 1rem auto 0;
  }
  .profile-stats {
    justify-content: center;
  }
}
</style>

