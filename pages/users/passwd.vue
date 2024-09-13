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
                <v-form @submit.prevent="submitForm">
                  <v-text-field
                    v-model="form.email"
                    label="Email"
                    type="email"
                    required
                    class="animated-input"
                  ></v-text-field>
                  <v-btn type="submit" color="primary" large class="animated-btn">Envoyer</v-btn>
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
import { ref, onMounted } from 'vue'
import axios from 'axios'
import AOS from 'aos'
import 'aos/dist/aos.css'
import { useRouter } from 'vue-router'

const router = useRouter()

const form = ref({
  email: ''
})

function submitForm() {
  // Envoyer les données via Axios pour réinitialiser le mot de passe
  axios.post('http://localhost:3001/api/send-verification-code', form.value)
    .then(response => {
      alert('Un email de réinitialisation a été envoyé!')
      // Redirection ou autre action après succès
    })
    .catch(error => {
      console.error('Erreur lors de la demande de réinitialisation:', error)
      alert('Une erreur est survenue. Veuillez réessayer.')
    })
}

function goToLogin() {
  router.push('/login')
}

onMounted(() => {
  AOS.init({ duration: 1000 })
})
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
