<template>
  <v-container class="login-container" fluid>
    <v-row justify="center" align="center" class="fill-height">
      <v-col cols="12" sm="8" md="4">
        <v-card>
          <v-card-title>
            <span class="headline">Connexion Admin</span>
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
                :rules="[rules.required]"
                type="password"
                required
              ></v-text-field>
              <v-alert v-if="errorMessage" type="error" dismissible>{{ errorMessage }}</v-alert>
            </v-form>
          </v-card-text>
          <v-card-actions>
            <v-btn color="primary" @click="login" :disabled="!valid">Se connecter</v-btn>
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
      valid: false,
      errorMessage: '',
      rules: {
        required: value => !!value || 'Ce champ est requis.',
        email: value => {
          const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
          return emailPattern.test(value) || 'Email invalide.';
        },
      },
    };
  },
  methods: {
    async login() {
      this.errorMessage = ''; // Réinitialiser le message d'erreur

      // Vérifier si le formulaire est valide
      if (!this.$refs.form.validate()) {
        this.errorMessage = 'Veuillez remplir tous les champs requis.';
        return;
      }

      try {
        const response = await axios.post('http://localhost:3001/api/auth/login', {
          email: this.email,
          password: this.password,
        });

        // Vérifier si l'utilisateur est admin
        if (response.data.user && response.data.user.role === 'admin') {
          console.log('Connexion réussie:', response.data);
          localStorage.setItem('token', response.data.token); // Stocker le token
          this.$router.push('/admin/dashbord'); // Rediriger vers le tableau de bord
        } else {
          this.errorMessage = 'Vous n\'êtes pas admin.'; // Message pour les non-admins
        }
      } catch (error) {
        // Gestion des erreurs
        if (error.response) {
          this.errorMessage = error.response.data.message || 'Erreur lors de la connexion.';
        } else if (error.request) {
          this.errorMessage = 'Aucune réponse reçue du serveur.';
        } else {
          this.errorMessage = 'Erreur de connexion. Veuillez réessayer plus tard.';
        }
      }
    },
  },
};
</script>

<style scoped>
.login-container {
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
