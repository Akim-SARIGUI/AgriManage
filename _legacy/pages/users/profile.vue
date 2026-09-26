<template>
  <v-app>
    <v-container fluid class="profile-container">
      <h1 class="text-3xl font-bold text-green-600 mb-6">Profil Utilisateur</h1>
      
      <div v-if="user" class="profile-info">
        <p><strong>Nom :</strong> {{ user.full_name }}</p>
        <p><strong>Email :</strong> {{ user.email }}</p>
        <p><strong>Rôle :</strong> {{ user.role }}</p>
      </div>
      <div v-else>
        <p>Chargement des informations...</p>
      </div>
    </v-container>
  </v-app>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'

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
.profile-container {
  padding: 20px;
  max-width: 800px;
  margin: auto;
}

.profile-info p {
  font-size: 18px;
  margin-bottom: 10px;
}
</style>
