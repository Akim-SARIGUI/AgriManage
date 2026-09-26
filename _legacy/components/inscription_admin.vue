<template>
  <v-container class="registration-container" fluid>
    <v-row justify="center" align="center" class="fill-height">
      <v-col cols="12" sm="8" md="4">
        <v-card>
          <v-card-title>
            <span class="headline">Inscription Admin</span>
          </v-card-title>
          <v-card-text>
            <v-form ref="form" v-model="valid" lazy-validation>
              <v-text-field
                v-model="email"
                label="Email"
                :rules="[rules.required, rules.email]"
                required
              ></v-text-field>
              <v-text-field
                v-model="password"
                label="Mot de passe"
                :rules="[rules.required, rules.minLength]"
                type="password"
                required
              ></v-text-field>
              <v-text-field
                v-model="confirmPassword"
                label="Confirmer le mot de passe"
                :rules="[rules.required, validatePassword]"
                type="password"
                required
              ></v-text-field>
              <v-alert v-if="errorMessage" type="error" dismissible>{{ errorMessage }}</v-alert>
              <v-alert v-if="successMessage" type="success" dismissible>{{ successMessage }}</v-alert>
            </v-form>
          </v-card-text>
          <v-card-actions>
            <v-btn color="primary" @click="register" :disabled="!valid">S'inscrire</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import axios from 'axios'; // Assurez-vous d'installer axios

export default {
  data() {
    return {
      email: '',
      password: '',
      confirmPassword: '',
      valid: false,
      errorMessage: '',
      successMessage: '',
      rules: {
        required: value => !!value || 'Ce champ est requis.',
        email: value => {
          const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
          return emailPattern.test(value) || 'Email invalide.';
        },
        minLength: value => (value && value.length >= 6) || 'Le mot de passe doit contenir au moins 6 caractères.',
      },
    };
  },
  methods: {
    validatePassword(value) {
      return value === this.password || 'Les mots de passe ne correspondent pas.';
    },
    async register() {
      this.errorMessage = ''; // Réinitialiser le message d'erreur
      this.successMessage = ''; // Réinitialiser le message de succès

      try {
        const response = await axios.post('http://localhost:3000/api/auth/register', {
          email: this.email,
          password: this.password,
        });

        // Gérer la réponse de succès
        console.log('Inscription réussie:', response.data);
        this.successMessage = 'Inscription réussie! Vous pouvez maintenant vous connecter.';

        // Réinitialiser les champs après une inscription réussie
        this.email = '';
        this.password = '';
        this.confirmPassword = '';

      } catch (error) {
        if (error.response) {
          this.errorMessage = error.response.data.message || 'Erreur lors de l\'inscription.';
        } else {
          this.errorMessage = 'Erreur de connexion. Veuillez réessayer plus tard.';
        }
      }
    },
  },
};
</script>

<style scoped>
.registration-container {
  background-color: #f0f8f0; /* Couleur de fond douce */
  height: 100vh; /* Remplir la hauteur de la fenêtre */
}

.v-card {
  border-radius: 10px; /* Coins arrondis pour le card */
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1); /* Ombre douce */
}

.headline {
  font-weight: bold;
  text-align: center;
  width: 100%;
}
</style>
