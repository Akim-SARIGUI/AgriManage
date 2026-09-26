<template>
  <v-container fluid class="contact-form">
    <!-- Formulaire de contact -->
    <v-card>
      <v-card-title>
        <h1>Contactez l'Administrateur</h1>
      </v-card-title>
      <v-card-text>
        <v-form @submit.prevent="submitForm">
          <v-text-field v-model="form.name" label="Nom" required outlined></v-text-field>
          <v-text-field v-model="form.email" label="Email" required outlined></v-text-field>
          <v-textarea v-model="form.message" label="Message" required outlined></v-textarea>
          <v-btn type="submit" color="primary">Envoyer</v-btn>
        </v-form>
      </v-card-text>
    </v-card>

    <!-- Liste des messages -->
    <v-card class="mt-8 p-4 bg-light-green-50 shadow-lg rounded-lg">
      <v-card-title>
        <h2 class="text-xl font-bold text-green-700">Mes Messages</h2>
      </v-card-title>

      <v-list>
        <v-list-item-group>
          <v-list-item v-for="msg in messages" :key="msg.id">
            <v-card class="message-card mb-4 p-4 rounded-lg shadow-md border border-gray-200 bg-white" outlined>
              <v-card-title class="text-lg font-semibold text-green-600">
                {{ formatDate(msg.created_at) }} - {{ msg.name }}
              </v-card-title>
              <v-card-subtitle class="text-gray-700">
                {{ msg.message }}
              </v-card-subtitle>
              <v-card-text v-if="msg.responses && msg.responses.length > 0">
                <div v-for="response in msg.responses" :key="response.id" class="mt-2 pl-4 border-l-4 border-blue-200">
                  <div class="text-sm text-blue-600 font-medium">Réponse admin:</div>
                  <div class="text-gray-700">{{ response.message }}</div>
                  <div class="text-xs text-gray-500">{{ formatDate(response.created_at) }}</div>
                </div>
              </v-card-text>
              <v-card-actions>
                <v-btn color="red" @click="openDeleteDialog(msg.id)">Supprimer</v-btn>
                <v-btn color="blue" @click="openEditDialog(msg)">Modifier</v-btn>
              </v-card-actions>
            </v-card>
          </v-list-item>
        </v-list-item-group>
      </v-list>
    </v-card>

    <!-- Dialogs -->
    <v-dialog v-model="successDialog" max-width="500">
      <v-card>
        <v-card-title>Succès</v-card-title>
        <v-card-text>{{ successMessage }}</v-card-text>
        <v-card-actions>
          <v-btn color="primary" @click="successDialog = false">Fermer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="errorDialog" max-width="500">
      <v-card>
        <v-card-title>Erreur</v-card-title>
        <v-card-text>{{ errorMessage }}</v-card-text>
        <v-card-actions>
          <v-btn color="primary" @click="errorDialog = false">Fermer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteDialog" max-width="500">
      <v-card>
        <v-card-title>Confirmer la suppression</v-card-title>
        <v-card-text>Êtes-vous sûr de vouloir supprimer ce message ?</v-card-text>
        <v-card-actions>
          <v-btn color="red" @click="confirmDelete">Supprimer</v-btn>
          <v-btn color="primary" @click="deleteDialog = false">Annuler</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="editDialog" max-width="500">
      <v-card>
        <v-card-title>Modifier le message</v-card-title>
        <v-card-text>
          <v-textarea v-model="editMessageText" label="Message" outlined></v-textarea>
        </v-card-text>
        <v-card-actions>
          <v-btn color="blue" @click="confirmEdit">Enregistrer</v-btn>
          <v-btn color="primary" @click="editDialog = false">Annuler</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, onMounted, watchEffect } from 'vue';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

// Configuration d'Axios
const api = axios.create({
  baseURL: 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// États réactifs
const errorMessage = ref('');
const successMessage = ref('');
const form = ref({
  name: '',
  email: '',
  message: '',
});
const messages = ref([]);
const successDialog = ref(false);
const errorDialog = ref(false);
const deleteDialog = ref(false);
const editDialog = ref(false);
const messageToDelete = ref(null);
const messageToEdit = ref(null);
const editMessageText = ref('');

// Formater la date
const formatDate = (dateString) => {
  if (!dateString) return 'Date inconnue';

  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    console.error('Date invalide:', dateString);
    return 'Date inconnue';
  }

  const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
  return new Intl.DateTimeFormat('fr-FR', options).format(date);
};

// Valider le formulaire
const validateForm = () => {
  if (!form.value.name || !form.value.email || !form.value.message) {
    errorMessage.value = "Tous les champs sont requis.";
    return false;
  }
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(form.value.email)) {
    errorMessage.value = "L'adresse e-mail est invalide.";
    return false;
  }
  errorMessage.value = '';
  return true;
};

// Soumettre le formulaire
const submitForm = async () => {
  if (!validateForm()) {
    return;
  }

  try {
    const token = localStorage.getItem('authToken');

    if (!token) {
      window.location.href = '/users/connexion';
      return;
    }

    const decoded = jwtDecode(token);
    if (!decoded || !decoded.id) {
      throw new Error('Token invalide ou expiré.');
    }

    const user_id = decoded.id;

    await api.post('/contact-support', {
      ...form.value,
      user_id,
    }, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    successMessage.value = 'Votre message a été envoyé avec succès!';
    successDialog.value = true;

    form.value.name = '';
    form.value.email = '';
    form.value.message = '';

    await fetchMessages(); // Recharger les messages après envoi
  } catch (error) {
    handleError(error, 'Erreur lors de l\'envoi du message.');
  }
};

// Récupérer les messages
const fetchMessages = async () => {
  try {
    const token = localStorage.getItem('authToken');
    
    // Récupère les messages principaux (sans parent_id)
    const mainMessages = await api.get('/user/requests', {
      headers: { Authorization: `Bearer ${token}` },
    });

    // Pour chaque message, récupère ses réponses
    const messagesWithResponses = await Promise.all(
      mainMessages.data.map(async (msg) => {
        const responses = await api.get(`/requests/${msg.id}/responses`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        return {
          ...msg,
          responses: responses.data // Assurez-vous que c'est bien un tableau
        };
      })
    );

    messages.value = messagesWithResponses;
    console.log('Messages avec réponses:', messages.value); // Debug
  } catch (error) {
    handleError(error, 'Erreur lors de la récupération des messages.');
  }
};

// Ouvrir la boîte de dialogue de suppression
const openDeleteDialog = (id) => {
  messageToDelete.value = id;
  deleteDialog.value = true;
};

// Confirmer la suppression
const confirmDelete = async () => {
  try {
    const token = localStorage.getItem('authToken');

    if (!token) {
      window.location.href = '/users/connexion';
      return;
    }

    await api.delete(`/requests/${messageToDelete.value}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    await fetchMessages(); // Recharger les messages après suppression

    successMessage.value = 'Message supprimé avec succès!';
    successDialog.value = true;
    deleteDialog.value = false;
  } catch (error) {
    handleError(error, 'Erreur lors de la suppression du message.');
  }
};

// Ouvrir la boîte de dialogue de modification
const openEditDialog = (msg) => {
  messageToEdit.value = msg;
  editMessageText.value = msg.message;
  editDialog.value = true;
};

// Confirmer la modification
const confirmEdit = async () => {
  try {
    const token = localStorage.getItem('authToken');

    if (!token) {
      window.location.href = '/users/connexion';
      return;
    }

    await api.put(
      `/requests/${messageToEdit.value.id}`,
      {
        message: editMessageText.value,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    await fetchMessages(); // Recharger les messages après modification

    successMessage.value = 'Message modifié avec succès!';
    successDialog.value = true;
    editDialog.value = false;
  } catch (error) {
    handleError(error, 'Erreur lors de la modification du message.');
  }
};

// Gestion des erreurs
const handleError = (error, defaultMessage) => {
  console.error(error);

  if (error.response) {
    errorMessage.value = error.response.data.message || defaultMessage;
  } else if (error.request) {
    errorMessage.value = 'Erreur de réseau. Veuillez vérifier votre connexion.';
  } else {
    errorMessage.value = defaultMessage;
  }

  errorDialog.value = true;
};

// Charger les messages au montage du composant
onMounted(() => {
  fetchMessages();
});

// Surveiller les changements de token
watchEffect(() => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    window.location.href = '/users/connexion';
  }
});
</script>

<style scoped>
.contact-form {
  max-width: 100%;
  margin: auto;
}

.message-card {
  margin-bottom: 15px;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity .5s;
}
.fade-enter, .fade-leave-to {
  opacity: 0;
}
</style>