<template>
  <div class="app-container form-page">
    <div class="card editor-card animate-fade-in">
      <h1 class="page-title">{{ isEdit ? '글 수정' : '새 글 작성' }}</h1>
      <p class="editor-subtitle">당신의 멋진 생각을 기록해보세요.</p>
      <form class="editor-form" @submit.prevent="submit">
        <div class="form-group">
          <label for="title" class="sr-only">제목</label>
          <input 
            id="title" 
            v-model="form.title" 
            type="text" 
            class="title-input" 
            required 
            placeholder="제목을 입력하세요" 
          />
        </div>
        <div class="form-group category-group">
          <label for="category">카테고리</label>
          <div class="category-input-wrapper">
            <input
              id="category"
              v-model="form.categoryName"
              type="text"
              class="category-input"
              placeholder="예: 일상, 개발, 여행"
            />
            <button type="button" class="btn btn-secondary btn-sm" @click="toggleCategories">
              내 카테고리 보기
            </button>
          </div>
          <!-- 카테고리 목록 표시 영역 -->
          <div v-if="showCategories" class="category-list-dropdown">
            <div v-if="loadingCategories" class="loader-sm"></div>
            <div v-else-if="categories.length === 0" class="empty-text">등록된 카테고리가 없습니다.</div>
            <ul v-else class="category-list">
              <li 
                v-for="cat in categories" 
                :key="cat.categoryName" 
                class="category-item"
                @click="selectCategory(cat.categoryName)"
              >
                {{ cat.categoryName }}
              </li>
            </ul>
          </div>
        </div>
        <div class="form-group content-group">
          <label for="content" class="sr-only">내용</label>
          <textarea 
            id="content" 
            v-model="form.content" 
            class="content-input" 
            required 
            placeholder="이곳에 멋진 이야기를 적어주세요..." 
            rows="16" 
          />
        </div>
        
        <div class="bottom-actions">
          <div class="form-group form-group-inline mb-0">
            <label class="checkbox-label" tabindex="0">
              <input v-model="form.publicStatus" type="checkbox" />
              <span class="checkbox-custom"></span>
              전체 공개
            </label>
          </div>
          <div class="form-actions">
            <router-link v-if="isEdit" :to="{ name: 'post-detail', params: { id: route.params.id } }" class="btn btn-ghost">
              취소
            </router-link>
            <router-link v-else to="/" class="btn btn-ghost">취소</router-link>
            <button type="submit" class="btn btn-primary btn-publish" :disabled="loading">
              {{ loading ? '저장 중...' : (isEdit ? '수정 완료' : '출간하기') }}
            </button>
          </div>
        </div>
        <p v-if="error" class="error-msg text-right">{{ error }}</p>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getPost, createPost, updatePost } from '@/api/posts.js'
import { getCategoryList } from '@/api/categories.js'
import { useAuth } from '@/composables/useAuth.js'

const route = useRoute()
const router = useRouter()
const { user } = useAuth()

const isEdit = computed(() => !!route.params.id && route.name === 'post-edit')

const form = ref({
  title: '',
  content: '',
  categoryName: '',
  publicStatus: true,
})

const loading = ref(false)
const error = ref('')

// 카테고리 목록 관련 상태
const showCategories = ref(false)
const loadingCategories = ref(false)
const categories = ref([])

async function toggleCategories() {
  showCategories.value = !showCategories.value
  if (showCategories.value && categories.value.length === 0) {
    loadingCategories.value = true
    try {
      const data = await getCategoryList(user.value?.userId)
      categories.value = data || []
    } catch (e) {
      console.error('카테고리를 불러오지 못했습니다.', e)
    } finally {
      loadingCategories.value = false
    }
  }
}

function selectCategory(categoryName) {
  form.value.categoryName = categoryName
  showCategories.value = false
}

onMounted(async () => {
  if (isEdit.value) {
    try {
      const data = await getPost(route.params.id)
      form.value = {
        title: data.title,
        content: data.content,
        categoryName: data.categoryName ?? data.category ?? '',
        publicStatus: data.publicStatus ?? true,
      }
    } catch (e) {
      error.value = e.response?.data?.message || '글을 불러오지 못했습니다.'
    }
  }
})

async function submit() {
  error.value = ''
  loading.value = true
  try {
    const payload = {
      title: form.value.title,
      content: form.value.content,
      categoryName: form.value.categoryName || undefined,
      publicStatus: form.value.publicStatus,
    }
    if (isEdit.value) {
      await updatePost(route.params.id, payload)
      router.push({ name: 'post-detail', params: { id: route.params.id } })
    } else {
      const data = await createPost(payload)
      router.push({ name: 'post-detail', params: { id: data.id } })
    }
  } catch (e) {
    error.value = e.response?.data?.message ?? '저장에 실패했습니다.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.form-page {
  padding-top: 1rem;
}
.editor-card {
  padding: 3rem;
  max-width: 800px;
  margin: 0 auto;
  border-radius: var(--radius-lg);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.02);
  border: 1px solid rgba(226, 232, 240, 0.8);
  background: rgba(255, 255, 255, 0.9);
}
.page-title {
  font-size: 2.2rem;
  margin-bottom: 0.25rem;
}
.editor-subtitle {
  color: var(--text-muted);
  margin-bottom: 2rem;
  font-size: 1.05rem;
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}

.title-input {
  width: 100%;
  font-family: var(--font-serif);
  font-size: 2.5rem;
  font-weight: 700;
  border: none;
  border-bottom: 2px solid var(--border);
  border-radius: 0;
  padding: 0.5rem 0;
  background: transparent;
  color: var(--text);
  box-shadow: none !important;
  transition: border-color 0.2s;
}
.title-input::placeholder {
  color: #cbd5e1;
}
.title-input:focus {
  border-color: var(--accent);
  outline: none;
}

.category-group {
  margin-top: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.category-group label {
  margin: 0;
  font-weight: 600;
  color: var(--text-muted);
}
.category-input-wrapper {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.category-input {
  max-width: 300px;
  background: #f8fafc;
  border: 1px solid var(--border);
  border-radius: var(--radius-full);
  padding: 0.5rem 1rem;
}
.category-list-dropdown {
  margin-top: 0.5rem;
  max-width: 300px;
  background: #fff;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 0.5rem;
  box-shadow: var(--shadow-sm);
}
.category-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.category-item {
  background: var(--bg-color);
  padding: 0.25rem 0.75rem;
  border-radius: var(--radius-full);
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
}
.category-item:hover {
  background: var(--accent-light);
  color: var(--accent-hover);
  border-color: var(--accent);
}
.empty-text {
  font-size: 0.9rem;
  color: var(--text-muted);
  text-align: center;
  padding: 0.5rem;
}
.loader-sm {
  border: 2px solid #f3f3f3;
  border-top: 2px solid var(--accent);
  border-radius: 50%;
  width: 20px;
  height: 20px;
  animation: spin 1s linear infinite;
  margin: 0 auto;
}

.content-group {
  margin-top: 2rem;
  margin-bottom: 2rem;
}
.content-input {
  width: 100%;
  border: none;
  background: transparent;
  font-size: 1.15rem;
  line-height: 1.8;
  color: #334155;
  resize: vertical;
  min-height: 400px;
  box-shadow: none !important;
  padding: 0;
  border-radius: 0;
}
.content-input:focus {
  outline: none;
}
.content-input::placeholder {
  color: #94a3b8;
  font-style: italic;
}

.bottom-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border);
  flex-wrap: wrap;
  gap: 1rem;
}

.checkbox-label {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-weight: 500;
  color: var(--text);
  user-select: none;
}
.checkbox-label input {
  position: absolute;
  opacity: 0;
  cursor: pointer;
  height: 0;
  width: 0;
}
.checkbox-custom {
  position: relative;
  display: inline-block;
  width: 20px;
  height: 20px;
  background-color: #fff;
  border: 2px solid var(--border);
  border-radius: 4px;
  transition: all 0.2s;
}
.checkbox-label:hover input ~ .checkbox-custom {
  border-color: var(--accent);
}
.checkbox-label input:checked ~ .checkbox-custom {
  background-color: var(--accent);
  border-color: var(--accent);
}
.checkbox-custom:after {
  content: "";
  position: absolute;
  display: none;
  left: 5px;
  top: 1px;
  width: 5px;
  height: 10px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}
.checkbox-label input:checked ~ .checkbox-custom:after {
  display: block;
}

.mb-0 {
  margin-bottom: 0;
}

.form-actions {
  display: flex;
  gap: 1rem;
  align-items: center;
}
.btn-publish {
  padding: 0.75rem 2rem;
  font-size: 1.05rem;
}
.btn-ghost {
  color: var(--text-muted);
  background: transparent;
  border: none;
  box-shadow: none;
  font-weight: 500;
}
.btn-ghost:hover {
  background: #f1f5f9;
  color: var(--text);
  text-decoration: none;
}
.text-right {
  text-align: right;
  margin-top: 0.5rem;
}

@media (max-width: 640px) {
  .editor-card {
    padding: 1.5rem;
  }
  .bottom-actions {
    flex-direction: column;
    align-items: stretch;
  }
  .form-actions {
    justify-content: space-between;
  }
}
</style>
