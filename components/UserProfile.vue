<template>
  <div class="profile-container">
    <div class="profile-header">
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
            <div class="mb-2"><strong>Nom :</strong> {{ user.full_name }}</div>
            <div class="mb-2"><strong>Email :</strong> {{ user.email }}</div>
          </div>
        </v-card-subtitle>
      </v-card>

      <!-- Hidden file input for photo selection -->
      <input type="file" ref="fileInput" @change="changePhoto" style="display: none" />

      <v-card class="profile-card">
        <v-card-title class="bg-green-50 text-green-700">Paramètres de Sécurité</v-card-title>
        <!-- Updated button to call resetPassword function -->
        <v-btn @click="resetPassword" color="green" class="ml-4 mb-4 mt-4">Changer le Mot de Passe</v-btn>
        <v-btn color="blue" @click="openEditUserDialog" class="mt-4 ml-4 mb-4">Modifier mes données</v-btn>
      </v-card>

      <v-btn @click="logout" class="btn-red">Déconnexion</v-btn>
      <v-btn @click="openDialog" class="ml-5" color="primary">Voir les Rapports</v-btn>
    </div>

    <!-- Alert Dialog -->
    <v-dialog v-model="dialog" max-width="500px">
      <v-card>
        <v-card-title>
          <span class="headline">Alerte</span>
        </v-card-title>
        <v-card-text>
          <p>
            Pour voir vos rapports, vous devez finir votre saison de culture. 
            Référez-vous aux autres interfaces pour plus d'informations.
          </p>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" @click="closeDialog">Fermer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

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
  margin-bottom: 16px;
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

