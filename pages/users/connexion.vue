<template>
  <v-app>
    <v-container fluid class="login-page">
      <v-row no-gutters>
        <!-- Image Section -->
        <v-col cols="12" md="6" class="image-section">
          <v-img
            src="@/public/SE1.jpg"
            height="100vh"
            contain
          ></v-img>
        </v-col>

        <!-- Form Section -->
        <v-col cols="12" md="6" class="form-section">
          <v-row align="center" justify="center">
            <v-col cols="12" sm="10" md="8">
              <v-card class="form-card" data-aos="fade-up">
                <v-card-title class="text-center">Connexion</v-card-title>
                <v-card-subtitle class="text-center">Accédez à votre compte</v-card-subtitle>
                
                <!-- Alert Messages -->
                <v-alert v-if="alertMessage" :type="alertType" class="mb-4" dismissible>
                  {{ alertMessage }}
                </v-alert>
                
                <v-form @submit.prevent="submitForm">
                  <v-text-field
                    v-model="form.email"
                    label="Email"
                    type="email"
                    required
                    class="animated-input"
                  ></v-text-field>
                  <v-text-field
                    v-model="form.password"
                    label="Mot de passe"
                    type="password"
                    required
                    class="animated-input"
                  ></v-text-field>
                  <v-btn type="submit" color="primary" large class="animated-btn">Se Connecter</v-btn>
                  <v-btn @click="resetPassword" class="forgot-password-btn">Mot de passe oublié?</v-btn>
                </v-form>
                <v-divider class="my-4"></v-divider>
                <v-row>
                  <v-col class="text-center">
                    <v-btn @click="loginWithGoogle" color="red" class="social-login-btn">
                      Se connecter avec Google
                    </v-btn>
                  </v-col>
                  <v-col class="text-center">
                    <v-btn @click="loginWithFacebook" color="blue" class="social-login-btn">
                      Se connecter avec Facebook
                    </v-btn>
                  </v-col>
                </v-row>
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
  email: '',
  password: ''
})

const alertMessage = ref('')
const alertType = ref('') // 'success', 'error', or 'info'

function submitForm() {
  axios.post('http://localhost:3001/api/login', form.value)
    .then(response => {
      // Stocker le token dans localStorage
      localStorage.setItem('authToken', response.data.token);

      // Afficher un message de succès et rediriger vers la page de profil
      alertMessage.value = 'Connexion réussie!';
      alertType.value = 'success';
      setTimeout(() => router.push('/users/dashbord'), 1000); // Rediriger vers la page de profil
    })
    .catch(error => {
      alertMessage.value = 'Mot de passe ou email incorrect';
      alertType.value = 'error';
    });
}


function resetPassword() {
  alertMessage.value = 'Réinitialisation du mot de passe'
  alertType.value = 'info'
  setTimeout(() => router.push('/users/passwd'), 1000) 
}

function loginWithGoogle() {
  alertMessage.value = 'Connexion avec Google'
  alertType.value = 'info'
}

function loginWithFacebook() {
  alertMessage.value = 'Connexion avec Facebook'
  alertType.value = 'info'
}

onMounted(() => {
  AOS.init({ duration: 1000 })
})
</script>

<style scoped>
.login-page {
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
  max-width: 500px;
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
  font-size: 1.5em;
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

.forgot-password-btn {
  display: block;
  margin-top: 20px;
  color: #2196f3;
  text-align: center;
}

.social-login-btn {
  width: 100%;
  font-weight: bold;
  color: white;
}

.social-login-btn.color-red {
  background-color: #db4437;
}

.social-login-btn.color-blue {
  background-color: #3b5998;
}

/* Responsive Design */
@media (max-width: 600px) {
  .login-page {
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

/* Add styles for v-alert */
.v-alert {
  border-radius: 8px;
  transition: opacity 0.3s ease;
}

.v-alert.success {
  background-color: #d4edda; /* Light green */
  color: #155724; /* Dark green */
}

.v-alert.error {
  background-color: #f8d7da; /* Light red */
  color: #721c24; /* Dark red */
}

.v-alert.info {
  background-color: #d1ecf1; /* Light blue */
  color: #0c5460; /* Dark blue */
}
</style>
