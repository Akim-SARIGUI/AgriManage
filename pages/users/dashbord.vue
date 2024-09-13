<template>
  <v-app>
    <v-navigation-drawer
      app
      v-model="drawer"
      color="green"
      dark
      width="300"
    >
      <v-list>
        <v-list-item class="mt-10 align-horizontal" @click="updatePage('dashboard')">
          <v-list-item-icon class="align-icon">
            <v-icon>mdi-view-dashboard</v-icon>
          </v-list-item-icon>
          <v-list-item-title class="align-title">Tableau de bord</v-list-item-title>
        </v-list-item>
        <v-list-item class="align-horizontal" @click="updatePage('parcel-management')">
          <v-list-item-icon class="align-icon">
            <v-icon>mdi-map</v-icon>
          </v-list-item-icon>
          <v-list-item-title class="align-title">Gestion des parcelles</v-list-item-title>
        </v-list-item>
        <v-list-item class="align-horizontal" @click="updatePage('crop-tracking')">
          <v-list-item-icon class="align-icon">
            <v-icon>mdi-leaf</v-icon>
          </v-list-item-icon>
          <v-list-item-title class="align-title">Suivi des cultures</v-list-item-title>
        </v-list-item>
        <v-list-item class="align-horizontal" @click="updatePage('stock-management')">
          <v-list-item-icon class="align-icon">
            <v-icon>mdi-package</v-icon>
          </v-list-item-icon>
          <v-list-item-title class="align-title">Gestion des stocks</v-list-item-title>
        </v-list-item>
        <v-list-item class="align-horizontal" @click="updatePage('weather-forecast')">
          <v-list-item-icon class="align-icon">
            <v-icon>mdi-weather-cloudy</v-icon>
          </v-list-item-icon>
          <v-list-item-title class="align-title">Prévision météorologiques</v-list-item-title>
        </v-list-item>
        <v-list-item class="align-horizontal" @click="updatePage('financial-accounting')">
          <v-list-item-icon class="align-icon">
            <v-icon>mdi-cash-multiple</v-icon>
          </v-list-item-icon>
          <v-list-item-title class="align-title">Comptabilité financière</v-list-item-title>
        </v-list-item>
        <v-list-item class="align-horizontal" @click="updatePage('reports')">
          <v-list-item-icon class="align-icon">
            <v-icon>mdi-file-chart</v-icon>
          </v-list-item-icon>
          <v-list-item-title class="align-title">Rapports</v-list-item-title>
        </v-list-item>

        <v-list-item class="align-horizontal" @click="updatePage('recommendations')">
          <v-list-item-icon class="align-icon">
            <v-icon>mdi-lightbulb-on</v-icon>
          </v-list-item-icon>
          <v-list-item-title class="align-title">Recommandations</v-list-item-title>
        </v-list-item>
        <v-list-item class="align-horizontal" @click="updatePage('user-profile')">
          <v-list-item-icon class="align-icon">
            <v-icon>mdi-account</v-icon>
          </v-list-item-icon>
          <v-list-item-title class="align-title">Profil utilisateur</v-list-item-title>
        </v-list-item>
        <v-list-item class="align-horizontal" @click="updatePage('support')">
          <v-list-item-icon class="align-icon">
            <v-icon>mdi-help-circle</v-icon>
          </v-list-item-icon>
          <v-list-item-title class="align-title">Support et aide</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-app-bar app color="green" dark>
      <v-app-bar-nav-icon @click="drawer = !drawer"></v-app-bar-nav-icon>
      <v-toolbar-title>{{ pageTitle }}</v-toolbar-title>
    </v-app-bar>

    <v-main>
      <v-container fluid>
        <!-- Dynamic Content Section -->
        <component :is="currentComponent" />
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref, computed ,onMounted} from 'vue'

import axios from 'axios'
import { useRouter } from 'vue-router'

// State for drawer and current page
const drawer = ref(false)
const currentPage = ref('dashboard')

// Components for each page
import Dashboard from '@/components/Dashboard.vue'
import ParcelManagement from '@/components/ParcelManagement.vue'
import CropTracking from '@/components/CropTracking.vue'
import StockManagement from '@/components/StockManagement.vue'
import WeatherForecast from '@/components/WeatherForecast.vue'
import Reports from '@/components/Reports.vue'
import FinancialAccounting from '@/components/FinancialAccounting.vue'
import Recommendations from '@/components/Recommendations.vue'
import UserProfile from '@/components/UserProfile.vue'
import Support from '@/components/Support.vue'

// Map pages to components
const pages = {
  dashboard: Dashboard,
  'parcel-management': ParcelManagement,
  'crop-tracking': CropTracking,
  'stock-management': StockManagement,
  'weather-forecast': WeatherForecast,
  reports: Reports,
  'financial-accounting': FinancialAccounting,
  recommendations: Recommendations,
  'user-profile': UserProfile,
  support: Support
}

// Watch for page changes
const currentComponent = ref(pages[currentPage.value])

function updatePage(page) {
  currentPage.value = page
  currentComponent.value = pages[page]
}

const pageTitle = computed(() => {
  return {
    dashboard: 'Tableau de bord',
    'parcel-management': 'Gestion des parcelles',
    'crop-tracking': 'Suivi des cultures',
    'stock-management': 'Gestion des stocks',
    'weather-forecast': 'Prévision météorologiques',
    reports: 'Rapports',
    'financial-accounting': 'Comptabilité financière',
    recommendations: 'Recommandations',
    'user-profile': 'Profil utilisateur',
    support: 'Support et aide'
  }[currentPage.value] || 'Tableau de bord'
})

const router = useRouter()
const user = ref(null)
const error = ref(null)

onMounted(async () => {
  try {
      const token = localStorage.getItem('authToken')
    console.log(token)
    if (!token) {
      router.push('/users/connexion')
      return
    }

    const response = await axios.get('http://localhost:3001/api/user-profile', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    user.value = response.data
  } catch (err) {
    console.error('Erreur lors de la récupération des informations de l\'utilisateur:', err)
    error.value = 'Erreur lors de la récupération des informations.'
    router.push('/users/connexion')
  }
})
</script>

<style scoped>
/* Align items horizontally */
.align-horizontal {
  display: flex;
  align-items: center;
}

.align-icon {
  margin-right: 16px;
}

.align-title {
  flex: 1;
}
</style>
