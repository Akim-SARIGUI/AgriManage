<template>
  <v-app>
    <v-container fluid class="forgot-password-page">
      <v-row no-gutters>
        <!-- Image Section -->
        <v-col cols="12" md="6" class="image-section">
          <v-img
            src="https://via.placeholder.com/800x1200.png?text=Mot+de+Passe+Oublié"
            height="100vh"
            contain
          ></v-img>
        </v-col>

        <!-- Form Section -->
        <v-col cols="12" md="6" class="form-section">
          <v-row align="center" justify="center">
            <v-col cols="12" sm="10" md="8">
              <v-card class="form-card" data-aos="fade-up">
                <v-card-title class="text-center">Mot de Passe Oublié</v-card-title>
                <v-card-subtitle class="text-center">Entrez votre adresse email pour réinitialiser votre mot de passe</v-card-subtitle>

                <!-- Messages d'erreur ou de succès -->
                <v-alert v-if="message" :type="messageType" class="mb-4">
                  {{ message }}
                </v-alert>

                <v-form @submit.prevent="submitForm" ref="form">
                  <v-text-field
                    v-model="form.email"
                    label="Email"
                    type="email"
                    :rules="emailRules"
                    required
                    class="animated-input"
                    outlined
                    dense
                  ></v-text-field>

                  <v-btn
                    type="submit"
                    color="primary"
                    large
                    class="animated-btn"
                    :loading="isLoading"
                    :disabled="isLoading"
                  >
                    Envoyer
                  </v-btn>
                </v-form>

                <v-divider class="my-4"></v-divider>
                <v-btn @click="goToLogin" color="secondary" class="back-to-login-btn">Retour à la connexion</v-btn>
              </v-card>
            </v-col>
          </v-row>
        </v-col>
      </v-row>
    </v-container>
  </v-app>
</template>

<script setup>
import { ref } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';

const router = useRouter();
const form = ref({ email: '' });
const isLoading = ref(false);
const message = ref('');
const messageType = ref('');

const emailRules = [
  (v) => !!v || 'L\'email est obligatoire',
  (v) => /.+@.+\..+/.test(v) || 'L\'email doit être valide',
];

async function submitForm() {
  if (!form.value.email) {
    message.value = 'Veuillez entrer votre email.';
    messageType.value = 'error';
    return;
  }

  isLoading.value = true;
  message.value = '';

  try {
    // Envoyer un objet simple avec l'email seulement
    const response = await axios.post('http://localhost:3001/api/send-verification-code', { email: form.value.email });

    message.value = 'Un email de réinitialisation a été envoyé!';
    messageType.value = 'success';
    router.push({ path: '/users/VerifyCode', query: { email: form.value.email } });
    // Réinitialiser le champ email après un envoi réussi
    form.value.email = '';
  } catch (error) {
    console.error('Erreur lors de la demande de réinitialisation:', error);
    console.log('Réponse du serveur:', error.response);

    if (error.response) {
      if (error.response.status === 400) {
        message.value = 'Veuillez remplir tous les champs requis.';
      } else if (error.response.status === 404) {
        message.value = 'Aucun utilisateur trouvé avec cet email.';
      } else {
        message.value = 'Une erreur est survenue. Veuillez réessayer.';
      }
    } else if (error.request) {
      message.value = 'Une erreur réseau est survenue. Veuillez vérifier votre connexion.';
    } else {
      message.value = 'Une erreur inattendue est survenue.';
    }
    messageType.value = 'error';
  } finally {
    isLoading.value = false;
  }
}



function goToLogin() {
  router.push('/users/connexion');
}
</script>

<style scoped>
.forgot-password-page {
  display: flex;
  height: 100vh;
}

.image-section {
  background-color: #e3f2fd; /* Bleu très clair */
}

.form-section {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #ffffff; /* Blanc pour contraste */
}

.form-card {
  padding: 40px;
  max-width: 400px;
  margin: auto;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  transition: transform 0.3s, box-shadow 0.3s;
}

.form-card:hover {
  transform: scale(1.02);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2);
}

.form-card .v-card-title {
  font-size: 2.5em;
  font-weight: bold;
}

.form-card .v-card-subtitle {
  font-size: 1.2em;
  margin-bottom: 20px;
}

.animated-input {
  transition: border-color 0.3s, box-shadow 0.3s;
}

.animated-input:hover,
.animated-input:focus {
  border-color: #2196f3; /* Change border color on hover/focus */
  box-shadow: 0 0 8px rgba(33, 150, 243, 0.5); /* Add shadow on hover/focus */
}

.animated-btn {
  transition: background-color 0.3s, transform 0.3s;
}

.animated-btn:hover {
  background-color: #1976d2; /* Darker blue */
  transform: translateY(-2px); /* Slight lift effect */
}

.back-to-login-btn {
  display: block;
  margin-top: 10px;
  color: #2196f3;
  text-align: center;
}

/* Responsive Design */
@media (max-width: 600px) {
  .forgot-password-page {
    flex-direction: column;
  }

  .image-section,
  .form-section {
    height: auto;
  }

  .form-card {
    max-width: 90%;
  }
}
</style>