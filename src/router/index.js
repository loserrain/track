import { createRouter, createWebHistory } from 'vue-router'
import Video from '../components/Video.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'Video',
      component: Video
    }
  ]
})

export default router
