<template>
  <v-container fluid class="contact-form">
    <v-card>
      <v-card-title>
        <h1>Contactez l'Administrateur</h1>
      </v-card-title>
      <v-card-text>
        <v-form @submit.prevent="submitForm">
          <v-text-field
            v-model="form.name"
            label="Nom"
            required
            outlined
          ></v-text-field>
          <v-text-field
            v-model="form.email"
            label="Email"
            required
            outlined
            type="email"
          ></v-text-field>
          <v-textarea
            v-model="form.message"
            label="Message"
            required
            outlined
          ></v-textarea>
          <v-btn type="submit" color="primary">Envoyer</v-btn>
        </v-form>

        <!-- Animation pour le message de succès -->
        <transition name="fade">
          <p v-if="successMessage" class="success">{{ successMessage }}</p>
        </transition>

        <!-- Animation pour le message d'erreur -->
        <transition name="fade">
          <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
        </transition>
      </v-card-text>
    </v-card>

   <v-card class="mt-8 p-4 bg-light-green-50 shadow-lg rounded-lg">
  <v-card-title>
    <h2 class="text-xl font-bold text-green-700">Messages Envoyés</h2>
  </v-card-title>

  <!-- Liste des messages avec espacement et bordures douces -->
  <v-list>
    <v-list-item-group>
      <v-list-item v-for="msg in messages" :key="msg.id">
        <!-- Ajout d'une ombre, bordures douces et espacement pour chaque message -->
        <v-card class="message-card mb-4 p-4 rounded-lg shadow-md border border-gray-200 bg-white" outlined>
          <v-card-title class="text-lg font-semibold text-green-600">
            {{ formatDate(msg.created_at) }} - {{ msg.name }}
          </v-card-title>
          <v-card-subtitle class="text-gray-700">
            {{ msg.message }}
          </v-card-subtitle>
        </v-card>
      </v-list-item>
    </v-list-item-group>
  </v-list>
</v-card>

  </v-container>
</template>

<script setup>
// Importing necessary libraries and functions
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { validate as validateUUID } from 'uuid';
import { useRouter } from 'vue-router'; // Ensure you import useRouter

const router = useRouter();
const userId = ref(null);

// Reactive references for form data, messages, and feedback messages
const form = ref({
  name: '',
  email: '',
  message: '',
});
const successMessage = ref('');
const errorMessage = ref('');
const messages = ref([]);

// Function to format date
const formatDate = (dateString) => {
  const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
  return new Intl.DateTimeFormat('fr-FR', options).format(new Date(dateString));
};

// Function to submit the contact form
const submitForm = async () => {
  try {
    const token = localStorage.getItem('authToken');

    if (!token) {
      window.location.href = '/users/connexion'; // Redirect if no token found
      return;
    }

    // Fetch user profile to get user ID
    const response = await axios.get('http://localhost:3001/api/user-profile', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const userIdFromServer = response.data.id;

    // Validate user ID
    if (!validateUUID(userIdFromServer)) {
      console.error("ID utilisateur non valide pour UUID:", userIdFromServer);
      return;
    }

    // Send message with user ID
    await axios.post(`http://localhost:3001/api/contact-support/${userIdFromServer}`, form.value);

    successMessage.value = 'Votre message a été envoyé avec succès!';
    errorMessage.value = '';

    // Reset form fields
    form.value.name = '';
    form.value.email = '';
    form.value.message = '';

    await fetchMessages(); // Fetch messages after sending
  } catch (error) {
    console.error('Erreur lors de l\'envoi du message:', error);
    errorMessage.value = 'Erreur lors de l\'envoi du message. Veuillez réessayer.';
  }
};

// Function to fetch sent messages
const fetchMessages = async () => {
  try {
   const token = localStorage.getItem('authToken')

    if (!token) {
      router.push('/users/connexion')
      return;
    }

    const response = await axios.get('http://localhost:3001/api/user-profile', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const userIdFromServer = response.data.id;

    // Vérification et conversion en UUID valide
    if (!validateUUID(userIdFromServer)) {
      console.error("ID utilisateur non valide pour UUID:", userIdFromServer);
      return;
    }

    userId.value = userIdFromServer;
      
     // Fetch sent messages using the valid user ID
     const Envoyeresponse = await axios.get(`http://localhost:3001/api/contact-support/${userId.value}`);
     
     messages.value = Envoyeresponse.data; // Store fetched messages in the reactive reference
   } catch (error) {
     console.error('Erreur lors de la récupération des messages:', error);
   }
};

// Lifecycle hook to fetch messages when component is mounted
onMounted(() => {
  fetchMessages(); // Load messages on component mount
});
</script>

<style scoped>
.contact-form {
  max-width: 100%; /* Utiliser toute la largeur */
  margin: auto;
}

.success {
  color: green;
  font-weight: bold;
}

.error {
  color: red;
  font-weight: bold;
}

/* Styles pour les cartes de messages */
.message-card {
  margin-bottom: 15px; /* Espacement entre les cartes */
}

/* Animation de fondu */
.fade-enter-active, .fade-leave-active {
  transition: opacity .5s;
}
.fade-enter, .fade-leave-to /* .fade-leave-active in <2.1.8 */ {
  opacity: 0;
}
</style>
