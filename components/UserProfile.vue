<template>
  <div class="profile-container">
    <div class="profile-header">
      <v-avatar size="100" class="profile-avatar">
        <img :src="user.avatarUrl" alt="Profile Picture" />
      </v-avatar>
      <div class="profile-info">
        <h1 class="text-3xl font-extrabold text-green-600">{{ user.full_name }}</h1>
        <p class="text-lg text-gray-700">{{ user.email }}</p>
      </div>
    </div>

    <div class="profile-content">
      <v-card class="profile-card">
        <v-card-title class="bg-green-50 text-green-700">Informations Personnelles</v-card-title>
        <v-card-subtitle class="p-4">
          <div class="flex flex-col">
            <div class="mb-2"><strong>Nom :</strong>  {{ user.full_name }}</div>
            <div class="mb-2"><strong>Email :</strong> {{ user.email }}</div>
            <div class="mb-2"><strong>Téléphone :</strong> {{ user.phone }}</div>
            <div class="mb-2"><strong>Adresse :</strong> {{ user.id }}</div>
          </div>
        </v-card-subtitle>
      </v-card>

      <v-card class="profile-card">
        <v-card-title class="bg-green-50 text-green-700">Statistiques de l'Utilisateur</v-card-title>
        <v-card-subtitle class="p-4">
          <div class="flex flex-col">
            <div class="mb-2"><strong>Parcelles Gérées :</strong> {{ user.parcelsManaged }}</div>
            <div class="mb-2"><strong>Nombre de Cultures :</strong> {{ user.cropsCount }}</div>
            <div class="mb-2"><strong>Stocks Actuels :</strong> {{ user.currentStock }}</div>
          </div>
        </v-card-subtitle>
      </v-card>

      <v-card class="profile-card">
        <v-card-title class="bg-green-50 text-green-700">Paramètres de Sécurité</v-card-title>
        <v-card-subtitle class="p-4">
          <v-btn @click="changePassword" class="btn-green">Changer le Mot de Passe</v-btn>
        </v-card-subtitle>
      </v-card>

      <v-btn @click="logout" class="btn-red">Déconnexion</v-btn>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';

const router = useRouter();
const user = ref({
  full_name: '',
  email: '',
  phone: '',
  address: '',
  avatarUrl: '',
  parcelsManaged: 0,
  cropsCount: 0,
  currentStock: ''
});
const error = ref(null);

async function fetchUserData() {
  try {
    const token = localStorage.getItem('authToken');
    if (!token) {
      router.push('/users/connexion');
      return;
    }

    const response = await axios.get('http://localhost:3001/api/user-profile', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    user.value = response.data;
  } catch (err) {
    console.error('Erreur lors de la récupération des informations de l\'utilisateur:', err);
    error.value = 'Erreur lors de la récupération des informations.';
    router.push('/users/connexion');
  }
}

function changePassword() {
  alert('Changer le mot de passe');
}

function logout() {
  alert('Déconnexion');
}

onMounted(() => {
  fetchUserData();
});
</script>

<style scoped>
html, body {
  height: 100%;
  margin: 0;
}

.profile-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding: 16px;
  background-color: #f5f5f5;
}

.profile-header {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}

.profile-avatar {
  margin-right: 16px;
}

.profile-info {
  flex: 1;
}

.profile-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.profile-card {
  margin-bottom: 16px;
}

.btn-green {
  background-color: #4CAF50;
  color: white;
  width: 500px;
  margin-top: 10px;
  margin-bottom: 20px;
}

.btn-red {
  background-color: #f44336;
  color: white;
  width: 500px;
  margin-left: 20px;
}
</style>
