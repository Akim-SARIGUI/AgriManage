<template>
  <v-app>
    <v-navigation-drawer
      app
      v-model="drawer"
      color="#1b5e20"
      dark
      width="300"
    >
      <v-list>
        <v-list-item class="align-horizontal mt-10" @click="updatePage('dashboard')" >
         
          <v-list-item-title class="align-title"> <v-icon left>mdi-view-dashboard</v-icon>Tableau de bord</v-list-item-title>
        </v-list-item>

        <v-list-item @click="updatePage('parcel-management')">
          
          <v-list-item-title class="align-title"><v-icon>mdi-map</v-icon> Gestion des parcelles</v-list-item-title>
        </v-list-item>

        <v-list-item class="align-horizontal" @click="updatePage('crop-tracking')">
          
          <v-list-item-title class="align-title"> <v-icon>mdi-leaf</v-icon> Suivi des cultures</v-list-item-title>
        </v-list-item>

        <v-list-item class="align-horizontal" @click="updatePage('stock-management')">
         
          <v-list-item-title class="align-title"><v-icon>mdi-package</v-icon> Gestion des stocks</v-list-item-title>
        </v-list-item>

        <v-list-item class="align-horizontal" @click="updatePage('weather-forecast')">
          
          <v-list-item-title class="align-title"> <v-icon>mdi-weather-cloudy</v-icon> Prévision météorologiques</v-list-item-title>
        </v-list-item>

        <v-list-item class="align-horizontal" @click="updatePage('financial-accounting')">
          <v-list-item-title class="align-title"><v-icon>mdi-cash-multiple</v-icon> Comptabilité financière</v-list-item-title>
        </v-list-item>

        <v-list-item class="align-horizontal" @click="updatePage('recommendations')">
         
          <v-list-item-title class="align-title"><v-icon>mdi-lightbulb-on</v-icon> Recommandations</v-list-item-title>
        </v-list-item>

        <v-list-item class="align-horizontal" @click="updatePage('user-profile')">
         
          <v-list-item-title class="align-title"><v-icon>mdi-account</v-icon> Profil utilisateur</v-list-item-title>
        </v-list-item>

        <v-list-item class="align-horizontal" @click="updatePage('support')">
          
          <v-list-item-title class="align-title"><v-icon>mdi-help-circle</v-icon> Support et aide</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-app-bar app color="#1b5e20" dark > 
      <v-app-bar-nav-icon @click="drawer = !drawer"></v-app-bar-nav-icon>
      <v-toolbar-title class="agri">AgriManage</v-toolbar-title> <!-- Nom de l'application sur la barre de navigation -->
    </v-app-bar>

    <v-main>
      <v-container fluid>
        <!-- Section dynamique pour les composants -->
        <component :is="currentComponent" />
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'

// État pour le tiroir et la page actuelle
const drawer = ref(false)
const currentPage = ref('dashboard')

// Importation des composants
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

// Associer les pages aux composants
const pages = {
  dashboard: Dashboard,
  'parcel-management': ParcelManagement,
  'crop-tracking': CropTracking,
  'stock-management': StockManagement,
  'weather-forecast': WeatherForecast,
  'reports': Reports,
  'financial-accounting': FinancialAccounting,
  'recommendations': Recommendations,
  'user-profile': UserProfile,
  'support': Support
}

// Mettre à jour la page actuelle
const currentComponent = ref(pages[currentPage.value])

function updatePage(page) {
  currentPage.value = page
  currentComponent.value = pages[page]
}

// Titre de la page selon la page sélectionnée
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

// Gestion de l'authentification
const router = useRouter()
const user = ref(null)
const error = ref(null)

onMounted(async () => {
  try {
    const token = localStorage.getItem('authToken')
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
    error.value = 'Erreur lors de la récupération des informations.'
    router.push('/users/connexion')
  }
})
</script>

<style scoped>
/* Style pour aligner horizontalement les icônes et le texte */

.align-horizontal {
  display: flex;
  align-items: center;
}

.align-icon {
  margin-right: 16px;
}
.agri {
  font-size: 1.7em;
}
.align-title {
  flex: 1;
  font-size: 1.2em;
}
</style>
