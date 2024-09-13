<template>
  <v-app>
    <v-container fluid class="signup-page">
      <v-row no-gutters>
        <!-- Image Section -->
        <v-col cols="12" md="6" class="image-section">
          <v-img
            src="@/public/In1.jpg"
            height="100vh"
            contain
          ></v-img>
        </v-col>

        <!-- Form Section -->
        <v-col cols="12" md="6" class="form-section">
          <v-row align="center" justify="center">
            <v-col cols="12" sm="10" md="8">
              <v-card class="form-card" data-aos="fade-up">
                <v-card-title class="text-center">Inscription</v-card-title>
                <v-card-subtitle class="text-center">Créez votre compte</v-card-subtitle>
                <v-form @submit.prevent="submitForm">
                  <v-text-field
                    v-model="form.firstName"
                    label="Prénom"
                    required
                    class="animated-input"
                  ></v-text-field>
                  <v-text-field
                    v-model="form.lastName"
                    label="Nom"
                    required
                    class="animated-input"
                  ></v-text-field>
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
                  <v-text-field
                    v-model="form.confirmPassword"
                    label="Confirmer le mot de passe"
                    type="password"
                    required
                    class="animated-input"
                  ></v-text-field>
                  <v-btn type="submit" color="primary" large class="animated-btn">Inscrire</v-btn>
                </v-form>
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
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: ''
})

function submitForm() {
  // Validation simple des mots de passe
  if (form.value.password !== form.value.confirmPassword) {
    alert('Les mots de passe ne correspondent pas!')
    return
  }

  // Préparer les données du formulaire
  const data = {
    firstName: form.value.firstName,
    lastName: form.value.lastName,
    email: form.value.email,
    password: form.value.password,
    confirmPassword: form.value.confirmPassword
  }

  // Envoyer les données via Axios
  axios.post('http://localhost:3001/api/register', data)
    .then(response => {
      alert('Inscription réussie!')
      router.push('/users/connexion')  // Correction du chemin de redirection
    })
    .catch(error => {
      console.error('Erreur lors de l\'inscription:', error)
      alert('Une erreur est survenue. Veuillez réessayer.')
    })
}

onMounted(() => {
  AOS.init({ duration: 1000 })
})
</script>

<style scoped>
.signup-page {
  display: flex;
  height: 100vh;
}

.image-section {
  background-color: #e8f5e9; /* Vert très clair */
}

.form-section {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #ffffff; /* Blanc pour contraste */
}

.form-card {
  padding: 40px;
  max-width: 500px; /* Agrandi le formulaire */
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
  border-color: #4caf50; /* Change border color on hover/focus */
  box-shadow: 0 0 8px rgba(76, 175, 80, 0.5); /* Add shadow on hover/focus */
}

.animated-btn {
  transition: background-color 0.3s, transform 0.3s;
}

.animated-btn:hover {
  background-color: #388e3c; /* Darker green */
  transform: translateY(-2px); /* Slight lift effect */
}

/* Responsive Design */
@media (max-width: 600px) {
  .signup-page {
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
