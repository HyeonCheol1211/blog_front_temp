<template>
  <div class="app-container">
    <div class="card">
      <h1 class="page-title">{{ isEdit ? '글 수정' : '글 쓰기' }}</h1>
      <form @submit.prevent="submit">
        <div class="form-group">
          <label for="title">제목</label>
          <input id="title" v-model="form.title" type="text" required placeholder="제목" />
        </div>
        <div class="form-group">
          <label for="category">카테고리</label>
          <input
            id="category"
            v-model="form.categoryName"
            type="text"
            placeholder="원하는 카테고리 이름 (예: 일상, 개발)"
          />
        </div>
        <div class="form-group">
          <label for="content">내용</label>
          <textarea id="content" v-model="form.content" required placeholder="내용을 입력하세요." rows="12" />
        </div>
        <div class="form-group form-group-inline">
          <label class="checkbox-label">
            <input v-model="form.publicStatus" type="checkbox" />
            공개
          </label>
        </div>
        <p v-if="error" class="error-msg">{{ error }}</p>
        <div class="form-actions">
          <button type="submit" class="btn btn-primary" :disabled="loading">
            {{ loading ? '저장 중...' : (isEdit ? '수정' : '등록') }}
          </button>
          <router-link v-if="isEdit" :to="{ name: 'post-detail', params: { id: route.params.id } }" class="btn btn-secondary">
            취소
          </router-link>
          <router-link v-else to="/" class="btn btn-secondary">취소</router-link>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getPost, createPost, updatePost } from '@/api/posts.js'

const route = useRoute()
const router = useRouter()

const isEdit = computed(() => !!route.params.id && route.name === 'post-edit')

const form = ref({
  title: '',
  content: '',
  categoryName: '',
  publicStatus: true,
})

const loading = ref(false)
const error = ref('')

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
.form-group-inline {
  margin-bottom: 1rem;
}
.checkbox-label {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-weight: normal;
}
.checkbox-label input {
  width: auto;
}
.form-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}
</style>
