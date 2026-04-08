import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomeView.vue'),
      meta: { title: '전체 글' },
    },
    {
      path: '/posts/:id',
      name: 'post-detail',
      component: () => import('@/views/PostDetailView.vue'),
      meta: { title: '글 보기' },
    },
    {
      path: '/users/:userId',
      name: 'user-profile',
      component: () => import('@/views/UserProfileView.vue'),
      meta: { title: '프로필' },
    },
    {
      path: '/profile/edit',
      name: 'profile-edit',
      component: () => import('@/views/ProfileEditView.vue'),
      meta: { title: '프로필 수정', requiresAuth: true },
    },
    {
      path: '/users/:userId/posts',
      name: 'user-posts',
      component: () => import('@/views/MyPostsView.vue'),
      meta: { title: '작성 글' },
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { title: '로그인', guest: true },
    },
    {
      path: '/signup',
      name: 'signup',
      component: () => import('@/views/SignupView.vue'),
      meta: { title: '회원가입', guest: true },
    },
    {
      path: '/write',
      name: 'post-write',
      component: () => import('@/views/PostFormView.vue'),
      meta: { title: '글 쓰기', requiresAuth: true },
    },
    {
      path: '/posts/:id/edit',
      name: 'post-edit',
      component: () => import('@/views/PostFormView.vue'),
      meta: { title: '글 수정', requiresAuth: true },
    },
    {
      path: '/my/posts',
      name: 'my-posts',
      component: () => import('@/views/MyPostsView.vue'),
      meta: { title: '내 작성 글', requiresAuth: true },
    },
    {
      path: '/my/comments',
      name: 'my-comments',
      component: () => import('@/views/MyCommentsView.vue'),
      meta: { title: '내 댓글', requiresAuth: true },
    },
  ],
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  const isLoggedIn = !!token

  if (to.meta.requiresAuth && !isLoggedIn) {
    next({ name: 'login', query: { redirect: to.fullPath } })
    return
  }
  if (to.meta.guest && isLoggedIn) {
    next({ name: 'home' })
    return
  }
  next()
})

router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} | 블로그` : '블로그'
})

export default router
