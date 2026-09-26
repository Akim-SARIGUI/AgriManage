<template>
  <v-app>
    <v-container fluid class="verify-code-page">
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
                <v-card-title class="text-center">Vérification du Code</v-card-title>
                <v-card-subtitle class="text-center">Entrez le code reçu par email et votre nouveau mot de passe</v-card-subtitle>

                <!-- Messages d'erreur ou de succès -->
                <v-alert v-if="message" :type="messageType" class="mb-4">
                  {{ message }}
                </v-alert>

                <v-form @submit.prevent="submitResetForm" ref="form">
                  <v-text-field
                    v-model="resetForm.resetCode"
                    label="Code de vérification"
                    type="text"
                    :rules="codeRules"
                    required
                    class="animated-input"
                    outlined
                    dense
                  ></v-text-field>

                  <v-text-field
                    v-model="resetForm.newPassword"
                    label="Nouveau mot de passe"
                    type="password"
                    :rules="passwordRules"
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
                    <template v-slot:loader>
                      <v-progress-circular indeterminate size="24"></v-progress-circular>
                    </template>
                    Réinitialiser
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
import { useRouter, useRoute } from 'vue-router';

const router = useRouter();
const route = useRoute();
const resetForm = ref({
  email: route.query.email, // Récupère l'email depuis les query
  resetCode: '',
  newPassword: '',
});
const isLoading = ref(false);
const message = ref('');
const messageType = ref('');

const codeRules = [
  (v) => !!v || 'Le code est obligatoire',
  (v) => v.length === 6 || 'Le code doit contenir 6 chiffres',
];

const passwordRules = [
  (v) => !!v || 'Le mot de passe est obligatoire',
  (v) => v.length >= 8 || 'Le mot de passe doit contenir au moins 8 caractères',
  (v) => /[A-Z]/.test(v) || 'Le mot de passe doit contenir au moins une majuscule',
  (v) => /[0-9]/.test(v) || 'Le mot de passe doit contenir au moins un chiffre',
  (v) => /[!@#$%^&*]/.test(v) || 'Le mot de passe doit contenir au moins un caractère spécial',
];

async function submitResetForm() {
  if (!resetForm.value.email) {
    message.value = 'Email manquant. Veuillez réessayer.';
    messageType.value = 'error';
    return;
  }

  if (!resetForm.value.resetCode || !resetForm.value.newPassword) {
    message.value = 'Veuillez remplir tous les champs.';
    messageType.value = 'error';
    return;
  }

  isLoading.value = true;
  message.value = '';

  try {
    const response = await axios.post('http://localhost:3001/api/reset-password', resetForm.value);
    message.value = 'Votre mot de passe a été réinitialisé avec succès!';
    messageType.value = 'success';
    setTimeout(() => {
      router.push('/users/connexion');
    }, 2000); // Redirige après 2 secondes
  } catch (error) {
    console.error('Erreur lors de la réinitialisation du mot de passe:', error);
    if (error.response) {
      if (error.response.status === 400) {
        message.value = 'Données invalides. Veuillez vérifier les informations saisies.';
      } else if (error.response.status === 404) {
        message.value = 'Aucun utilisateur trouvé avec cet email.';
      } else if (error.response.status === 401) {
        message.value = 'Code de vérification incorrect.';
      } else {
        message.value = 'Une erreur est survenue. Veuillez réessayer.';
      }
    } else if (error.request) {
      message.value = 'Erreur réseau. Veuillez vérifier votre connexion.';
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
/* Vos styles ici */
</style>