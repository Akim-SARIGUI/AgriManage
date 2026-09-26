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
                  <div v-if="remainingAttempts !== null">
                    Tentatives restantes : {{ remainingAttempts }}
                  </div>
                  <div v-if="lockTimeRemaining !== null">
                    Temps avant réessai : {{ lockTimeRemaining }} secondes
                  </div>
                </v-alert>
                
                <v-form @submit.prevent="submitForm">
                  <v-text-field
                    v-model="form.email"
                    label="Email"
                    type="email"
                    required
                    class="animated-input"
                    :error-messages="emailErrors"
                    @input="v$.form.email.$touch()"
                    @blur="v$.form.email.$touch()"
                  ></v-text-field>
                  <v-text-field
                    v-model="form.password"
                    label="Mot de passe"
                    type="password"
                    required
                    class="animated-input"
                    :error-messages="passwordErrors"
                    @input="v$.form.password.$touch()"
                    @blur="v$.form.password.$touch()"
                  ></v-text-field>
                  <v-btn type="submit" color="primary" large class="animated-btn">Se Connecter</v-btn>
                  <v-btn @click="resetPassword" class="forgot-password-btn">Mot de passe oublié?</v-btn>
                </v-form>
                <v-divider class="my-4"></v-divider>
              </v-card>
            </v-col>
          </v-row>
        </v-col>
      </v-row>
    </v-container>
  </v-app>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { useRouter } from 'vue-router';
import { useVuelidate } from '@vuelidate/core';
import { required, email } from '@vuelidate/validators';

const router = useRouter();

const form = ref({
  email: '',
  password: '',
});

const rules = computed(() => ({
  email: { required, email },
  password: { required },
}));

const v$ = useVuelidate(rules, form);

const alertMessage = ref('');
const alertType = ref(''); // 'success', 'error', or 'info'
const remainingAttempts = ref(null); // Nombre de tentatives restantes
const lockTimeRemaining = ref(null); // Temps restant avant réessai

const emailErrors = computed(() => {
  if (!v$.value || !v$.value.form || !v$.value.form.email) return [];
  const errors = [];
  if (!v$.value.form.email.$dirty) return errors;
  !v$.value.form.email.required && errors.push('Email est requis.');
  !v$.value.form.email.email && errors.push('L’email doit être valide.');
  return errors;
});

const passwordErrors = computed(() => {
  if (!v$.value || !v$.value.form || !v$.value.form.password) return [];
  const errors = [];
  if (!v$.value.form.password.$dirty) return errors;
  !v$.value.form.password.required && errors.push('Mot de passe requis.');
  return errors;
});

function submitForm() {
  v$.value.$touch();
  if (v$.value.$invalid) {
    alertMessage.value = 'Veuillez remplir tous les champs correctement.';
    alertType.value = 'error';
    return;
  }

  axios.post('http://localhost:3001/api/login', form.value)
    .then(response => {
      localStorage.setItem('authToken', response.data.token);
      alertMessage.value = 'Connexion réussie!';
      alertType.value = 'success';
      remainingAttempts.value = null; // Réinitialiser le compteur
      lockTimeRemaining.value = null; // Réinitialiser le temps de blocage
      setTimeout(() => router.push('/users/dashbord'), 1000);
    })
    .catch(error => {
      if (error.response) {
        if (error.response.status === 403) {
          // Compte bloqué
          alertMessage.value = error.response.data.message;
          if (error.response.data.lockedUntil) {
            const lockedUntil = new Date(error.response.data.lockedUntil);
            startLockTimer(lockedUntil);
          }
        } else if (error.response.status === 401) {
          // Mot de passe incorrect
          alertMessage.value = 'Mot de passe ou email incorrect';
          if (error.response.data.remainingAttempts !== undefined) {
            remainingAttempts.value = error.response.data.remainingAttempts; // Afficher les tentatives restantes
          }
        }
      } else {
        // Erreur réseau ou autre
        alertMessage.value = 'Une erreur est survenue. Veuillez réessayer.';
      }
      alertType.value = 'error';
    });
}

function startLockTimer(lockedUntil) {
  const interval = setInterval(() => {
    const now = new Date();
    const timeDiff = Math.floor((lockedUntil - now) / 1000); // Temps restant en secondes
    if (timeDiff <= 0) {
      clearInterval(interval);
      lockTimeRemaining.value = null;
      alertMessage.value = 'Vous pouvez réessayer maintenant.';
    } else {
      lockTimeRemaining.value = timeDiff;
    }
  }, 1000);
}

function resetPassword() {
  alertMessage.value = 'Réinitialisation du mot de passe';
  alertType.value = 'info';
  setTimeout(() => router.push('/users/passwd'), 1000);
}

onMounted(() => {
  AOS.init({ duration: 1000 });
});
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
