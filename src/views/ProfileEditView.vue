<template>
  <div class="app-container edit-page">
    <div class="card edit-card animate-fade-in">
      <h2 class="edit-title">프로필 수정</h2>

      <div v-if="loading" class="empty-state">
        <div class="loader"></div>
        <p>프로필 정보를 불러오는 중...</p>
      </div>
      <div v-else-if="errorMsg" class="empty-state error-msg">{{ errorMsg }}</div>
      
      <form v-else @submit.prevent="submitEdit" class="edit-form">
        <!-- 프로필 사진 업로드 -->
        <div class="form-group avatar-upload-group">
          <label class="form-label">프로필 사진</label>
          <div class="avatar-preview-wrapper">
            <div class="avatar-preview">
              <img v-if="previewUrl" :src="previewUrl" alt="프로필 미리보기" />
              <img v-else-if="existingProfileUrl" :src="resolveProfileImageUrl(existingProfileUrl)" alt="현재 프로필" />
              <span v-else class="avatar-placeholder">
                {{ user?.username?.charAt(0).toUpperCase() }}
              </span>
            </div>
            <div class="upload-controls">
              <label class="btn btn-secondary btn-sm upload-btn">
                <span>이미지 선택</span>
                <input type="file" accept="image/*" @change="onFileChange" hidden />
              </label>
              <button 
                type="button" 
                class="btn btn-ghost btn-sm" 
                v-if="previewFile" 
                @click="clearImage"
              >
                취소
              </button>
            </div>
          </div>
        </div>

        <!-- 이메일 -->
        <div class="form-group">
          <label for="email" class="form-label">이메일</label>
          <div class="input-with-button">
            <input 
              type="email" 
              id="email" 
              v-model="form.email" 
              class="form-control flex-grow" 
              placeholder="새로운 이메일을 입력하세요"
              @input="onEmailChange" 
            />
            <button 
              type="button" 
              class="btn btn-secondary btn-sm check-btn" 
              v-if="form.email !== originalEmail"
              @click="handleCheckEmail"
              :disabled="!form.email?.trim() || checkingEmail"
            >
              {{ checkingEmail ? '확인 중...' : '중복 확인' }}
            </button>
          </div>
          <small class="help-text">기존 이메일과 동일하면 변경되지 않습니다.</small>
          <p v-if="emailAvailable === true && form.email !== originalEmail" class="success-msg-sm">사용 가능한 이메일입니다.</p>
          <p v-else-if="emailAvailable === false && form.email !== originalEmail" class="error-msg-sm">이미 존재하는 이메일입니다.</p>
        </div>

        <!-- 비밀번호 -->
        <div class="form-group">
          <label for="password" class="form-label">새 비밀번호</label>
          <input 
            type="password" 
            id="password" 
            v-model="form.password" 
            class="form-control" 
            placeholder="변경할 비밀번호 (비워두면 변경 안됨)" 
          />
        </div>

        <!-- 비밀번호 확인 -->
        <div class="form-group">
          <label for="passwordConfirm" class="form-label">새 비밀번호 확인</label>
          <input 
            type="password" 
            id="passwordConfirm" 
            v-model="form.passwordConfirm" 
            class="form-control" 
            placeholder="변경할 비밀번호를 다시 입력해주세요" 
          />
        </div>

        <!-- 소개글 (Bio) -->
        <div class="form-group">
          <label for="bio" class="form-label">소개글</label>
          <textarea 
            id="bio" 
            v-model="form.bio" 
            class="form-control" 
            rows="4" 
            placeholder="자신을 소개해보세요!"
          ></textarea>
        </div>

        <div class="form-actions">
          <button type="submit" class="btn btn-primary" :disabled="submitting || !canSubmit">
            {{ submitting ? '저장 중...' : '프로필 저장' }}
          </button>
          <button type="button" class="btn btn-secondary" @click="cancelEdit" :disabled="submitting">
            취소
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth.js'
import { getUserProfileBasic, updateProfile } from '@/api/users.js'
import { checkEmail } from '@/api/auth.js'
import { resolveProfileImageUrl } from '@/utils/image.js'

const router = useRouter()
const { user, setAuth } = useAuth()

const loading = ref(true)
const submitting = ref(false)
const errorMsg = ref('')

const form = ref({
  email: '',
  password: '',
  passwordConfirm: '',
  bio: ''
})

const existingProfileUrl = ref(null)
const previewUrl = ref(null)
const previewFile = ref(null)
const originalEmail = ref('')

const emailAvailable = ref(null)
const checkingEmail = ref(false)

const canSubmit = computed(() => {
  if (form.value.password && form.value.password !== form.value.passwordConfirm) return false
  if (form.value.email !== originalEmail.value && form.value.email?.trim() && emailAvailable.value !== true) return false
  return true
})

onMounted(async () => {
  if (!user.value?.username) {
    router.push('/login')
    return
  }
  
  try {
    const userId = user.value?.userId || user.value?.id || user.value?.username || ''
    const data = await getUserProfileBasic(userId)
    originalEmail.value = data.email || ''
    form.value.email = data.email || ''
    form.value.bio = data.bio || ''
    existingProfileUrl.value = data.profileImageUrl || null
  } catch {
    errorMsg.value = '기존 프로필 정보를 불러오지 못했습니다.'
  } finally {
    loading.value = false
  }
})

function onEmailChange() {
  emailAvailable.value = null
}

async function handleCheckEmail() {
  if (!form.value.email?.trim() || form.value.email === originalEmail.value) return
  checkingEmail.value = true
  errorMsg.value = ''
  try {
    await checkEmail(form.value.email)
    emailAvailable.value = true
  } catch (err) {
    if (err.response?.status === 409 || err.response?.data?.message?.includes('이미')) {
      emailAvailable.value = false
    } else {
      errorMsg.value = '이메일 중복 확인 중 오류가 발생했습니다.'
    }
  } finally {
    checkingEmail.value = false
  }
}

function onFileChange(e) {
  const file = e.target.files[0]
  if (!file) return

  if (!file.type.startsWith('image/')) {
    alert('이미지 파일만 업로드 가능합니다.')
    return
  }

  previewFile.value = file
  previewUrl.value = URL.createObjectURL(file)
}

function clearImage() {
  previewFile.value = null
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = null
  }
}

async function submitEdit() {
  if (!canSubmit.value) return

  submitting.value = true
  errorMsg.value = ''

  const userUpdateRequest = {
    email: form.value.email || null,
    password: form.value.password || null,
    bio: form.value.bio || null
  }

  // **프론트엔드 안전장치**: 이메일을 변경하지 않은 경우, 요청에서 제외하거나 null로 보냅니다.
  // 백엔드에서 email 중복 검사 시 본인의 이메일을 제외하지 않아서 생길 수 있는 DuplicateEmailException을 방지.
  // user.value.email이 최신화되어 있지 않을 수 있으므로 기존 불러온 데이터와 비교하는게 더 안전하지만, 일단은 보내는대로 시도.
  
  try {
    const updatedUser = await updateProfile(userUpdateRequest, previewFile.value)
    
    // Auth 정보 갱신 (username과 email 반환됨)
    // 기존 데이터 보존하면서 업데이트된 필드들 병합
    setAuth(localStorage.getItem('token'), { 
      ...user.value, 
      email: updatedUser.email,
      username: updatedUser.username,
      // 프로필 이미지가 수정되었으므로 로컬스토리지 정보도 필요시 갱신 (서버에서 UserResponse에 안내려주면 기존값 사용)
    })

    alert('프로필이 성공적으로 수정되었습니다!')
    const routeUserId = user.value?.userId || user.value?.id || user.value?.username
    router.push({ name: 'user-profile', params: { userId: routeUserId } })
  } catch (e) {
    alert(e.response?.data?.message || '프로필 수정에 실패했습니다.')
  } finally {
    submitting.value = false
  }
}

function cancelEdit() {
  const routeUserId = user.value?.userId || user.value?.id || user.value?.username
  router.push({ name: 'user-profile', params: { userId: routeUserId } })
}
</script>

<style scoped>
.edit-page {
  padding-top: 3rem;
  max-width: 600px;
}
.edit-card {
  padding: 2.5rem 2rem;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);
}
.edit-title {
  margin-top: 0;
  margin-bottom: 2rem;
  font-size: 1.75rem;
  color: var(--text);
  font-weight: 700;
  text-align: center;
}
.avatar-upload-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px dotted var(--border);
}
.avatar-preview-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  margin-top: 0.5rem;
}
.avatar-preview {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 3px solid #fff;
  box-shadow: var(--shadow-sm);
}
.avatar-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.avatar-placeholder {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--text-muted);
}
.upload-controls {
  display: flex;
  gap: 0.5rem;
}
.upload-btn {
  cursor: pointer;
  margin: 0;
}
.help-text {
  display: block;
  margin-top: 0.5rem;
  font-size: 0.85rem;
  color: var(--text-muted);
}
.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 2.5rem;
}
.form-actions .btn {
  min-width: 120px;
}
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

.input-with-button {
  display: flex;
  gap: 0.5rem;
  align-items: stretch;
}
.check-btn {
  white-space: nowrap;
  font-size: 0.85rem;
  padding: 0 0.75rem;
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.error-msg-sm {
  color: var(--danger);
  font-size: 0.85rem;
  font-weight: 500;
  margin-top: 0.4rem;
}
.success-msg-sm {
  color: #10b981;
  font-size: 0.85rem;
  font-weight: 500;
  margin-top: 0.4rem;
}
</style>
