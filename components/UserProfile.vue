<template>
  <div class="profile-container">
    <div class="profile-header p-6 bg-white shadow-lg rounded-lg flex items-center space-x-6">
  <div class="profile-info">
    <!-- Nom de l'utilisateur avec une taille et un style plus audacieux -->
    <h1 class="text-4xl font-bold text-green-600 leading-tight text-h5">{{ user.full_name }}</h1>
    
    <!-- Email de l'utilisateur avec un style plus discret -->
    <p class="text-lg text-gray-500 mt-1 ">{{ user.email }}</p>
  </div>
</div>


    <div class="profile-content">
      <v-card class="profile-card">
        <v-card-title class="bg-green-50 text-green-700 text-h4">Informations Personnelles</v-card-title>
        <v-card-subtitle class="p-4">
          <div class="flex flex-col">
            <div class="mb-2"><strong>Nom :</strong> {{ user.full_name }}</div>
            <div class="mb-2"><strong>Email :</strong> {{ user.email }}</div>
          </div>
        </v-card-subtitle>
      </v-card>

<v-card class="profile-card pa-4 elevation-4">
  <v-card-title class="bg-green-50 text-green-700 text-h4">Paramètres</v-card-title>
  
  <v-card-text class="d-flex flex-column align-start">
    <!-- Boutons empilés verticalement avec des marges pour espacer -->
    <v-btn @click="resetPassword" color="green" class="mb-3">
      Changer le Mot de Passe
    </v-btn>
    
    <v-btn color="blue" @click="openEditUserDialog" class="mb-3">
      Modifier mes données
    </v-btn>
    
    <v-btn @click="logout" class="btn-red">
      Déconnexion
    </v-btn>
  </v-card-text>
</v-card>



    </div>

    <!-- Edit User Dialog -->
    <v-dialog v-model="editUserDialog" max-width="600px">
      <v-card>
        <v-card-title>
          <span class="headline">Modifier l'Utilisateur</span>
        </v-card-title>
        <v-card-text>
          <v-text-field v-model="selectedUser.full_name" label="Nom Complet" required></v-text-field>
          <v-text-field v-model="selectedUser.email" label="Email" required></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-btn color="yellow darken-1" text @click="updateUser">Modifier</v-btn>
          <v-btn color="grey" text @click="closeEditUserDialog">Annuler</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </div>
</template>

<script setup>
// Importing necessary libraries
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { validate as validateUUID } from 'uuid';

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
const editUserDialog = ref(false);
const selectedUser = ref({}); // Store selected user data for editing
const userId = ref(null);
const photoPath = ref(null); // Store the path of the profile photo

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
    userId.value = response.data.id; // Store user ID for future use
    photoPath.value = response.data.avatarUrl; // Assuming avatarUrl is part of the response
  } catch (err) {
    console.error('Erreur lors de la récupération des informations de l\'utilisateur:', err);
    error.value = 'Erreur lors de la récupération des informations.';
    router.push('/users/connexion');
  }
}

function resetPassword() {
  // Redirect to password reset page
  router.push('/users/passwd'); // Adjust this path according to your routing setup
}

function logout() {
  localStorage.removeItem('authToken');
  alert('Déconnexion réussie');
  window.location.href = '/connection';
}

onMounted(() => {
  fetchUserData();
});

// URL for the image (absolute path with the server)
const photoUrl = computed(() => {
  return photoPath.value ? `/uploads/${photoPath.value}` : null;
});

// Function to open the edit dialog
const openEditUserDialog = () => {
  selectedUser.value = { ...user.value }; // Clone current user data to selectedUser
  editUserDialog.value = true; // Open the dialog
};

const closeEditUserDialog = () => {
  editUserDialog.value = false; // Close the dialog
};

const updateUser = async () => {
  try {
    await axios.put(`http://localhost:3001/api/users/${userId.value}`, selectedUser.value);
    alert('Utilisateur mis à jour avec succès.');
    fetchUserData(); // Reload user data after update
    closeEditUserDialog(); // Close the dialog
  } catch (error) {
    console.error('Error updating user:', error);
    alert("Erreur lors de la mise à jour de l'utilisateur.");
  }
};

// Function to handle photo upload
const changePhoto = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append('profileImage', file);

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

    const userIdFromServer = response.data.id;

    // Verify and convert to valid UUID
    if (!validateUUID(userIdFromServer)) {
      console.error("ID utilisateur non valide pour UUID:", userIdFromServer);
      return;
    }

    const UsersResponse = await axios.post(`/api/users/${userIdFromServer}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    photoPath.value = UsersResponse.data.photoPath;
    alert('Votre photo de profil a été mise à jour');
    
    // Optionally refresh user data to reflect changes
    fetchUserData();
    
  } catch (error) {
    console.error('Erreur lors du téléchargement de la photo', error);
    alert("Une erreur s'est produite lors du téléchargement.");
  }
};

// Dialog management for alerts
const dialog = ref(false);

// Function to open the dialog
function openDialog() {
  dialog.value = true;
}

// Function to close the dialog
function closeDialog() {
  dialog.value = false;
}
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

.profile-info {
  flex: 1;
}

.profile-content {
  flex: 1;
}

.profile-card {
  margin-bottom: 18px;
}

.btn-green {
  background-color: #4CAF50;
}

.btn-red {
  background-color: #f44336;
}
.headline {
   font-weight: bold;
}
.container {
   max-width:800px; /* Adjust max-width as needed */
}
</style>

