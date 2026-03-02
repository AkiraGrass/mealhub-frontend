import { createRouter, createWebHistory } from 'vue-router';
import LoginPage from '@/pages/auth/LoginPage.vue';
import RegisterPage from '@/pages/auth/RegisterPage.vue';
import RestaurantsListPage from '@/pages/restaurants/RestaurantsListPage.vue';
import RestaurantDetailPage from '@/pages/restaurants/RestaurantDetailPage.vue';
import ReservationFlowPage from '@/pages/reservations/ReservationFlowPage.vue';
import MyReservationsPage from '@/pages/reservations/MyReservationsPage.vue';
import ReservationCodeLookupPage from '@/pages/reservations/ReservationCodeLookupPage.vue';
import AdminDashboardPage from '@/pages/admin/AdminDashboardPage.vue';
import PermissionDeniedPage from '@/pages/state/PermissionDeniedPage.vue';
import { requireAuthGuard } from './guards';

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: LoginPage
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterPage
    },
    {
      path: '/',
      redirect: { name: 'restaurants-list' }
    },
    {
      path: '/restaurants',
      name: 'restaurants-list',
      component: RestaurantsListPage,
      meta: { requiresAuth: true }
    },
    {
      path: '/restaurants/:restaurantId',
      name: 'restaurant-detail',
      component: RestaurantDetailPage,
      meta: { requiresAuth: true }
    },
    {
      path: '/reservations',
      redirect: { name: 'reservation-flow' },
      meta: { requiresAuth: true }
    },
    {
      path: '/reservations/flow',
      name: 'reservation-flow',
      component: ReservationFlowPage,
      meta: { requiresAuth: true }
    },
    {
      path: '/reservations/my',
      name: 'my-reservations',
      component: MyReservationsPage,
      meta: { requiresAuth: true }
    },
    {
      path: '/reservations/lookup',
      name: 'reservation-code-lookup',
      component: ReservationCodeLookupPage
    },
    {
      path: '/admin/:restaurantId',
      name: 'admin-dashboard',
      component: AdminDashboardPage,
      meta: { requiresAuth: true, requiresAdmin: true }
    },
    {
      path: '/permission-denied',
      name: 'permission-denied',
      component: PermissionDeniedPage
    }
  ]
});

router.beforeEach(requireAuthGuard);
