<template>
  <v-app>
    <!-- Icone de maison en haut à droite -->
     <v-btn
    icon
    class="home-btn animated-button"
    @click="navigateToHome"
    elevation="0"
    @mouseover="hover = true"
    @mouseleave="hover = false"
  >
    <v-icon color="blue darken-2">mdi-home</v-icon>
  </v-btn>
    <v-container class="d-flex justify-center align-center" fill-height>
      <v-row>
        <v-col class="text-center">
          <h1 class="animated-title">Bienvenue à la Gestion de Ferme Agricole</h1>
          <v-btn
            @click="navigateToAdmin"
            color="green darken-2"
            class="white--text animated-btn"
            elevation="10"
            v-ripple
            height="50"
          >
            Connexion Admin
          </v-btn>
          <v-btn
            @click="navigateToUser"
            color="blue darken-2"
            class="white--text animated-btn"
            elevation="10"
            v-ripple
            height="50"
          >
            Connexion Utilisateur
          </v-btn>
        </v-col>
      </v-row>
    </v-container>
  </v-app>
</template>

<script>
export default {
  methods: {
    navigateToAdmin() {
      this.$router.push("/admin/connexion");
    },
    navigateToUser() {
      this.$router.push("/users/connexion");
    },
    navigateToHome() {
      this.$router.push("/"); // Remplacez '/' par l'URL de la page d'accueil
    }
  }
};
</script>

<style scoped>
/* Centrage vertical et horizontal */
.v-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
}
h1 {
  font-size: 50px;
}

/* Animation d'apparition pour le titre */
.animated-title {
  animation: fadeIn 2s ease-in-out;
  margin-bottom: 20px;
}

/* Animation de survol pour les boutons */
.animated-btn {
  margin: 10px;
  animation: fadeInUp 2s ease-in-out;
  transition: transform 0.3s ease;
}

.animated-btn:hover {
  transform: scale(1.1);
}

/* Icône de maison en haut à droite */
.home-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  color: blue;
}

/* Animation d'apparition */
@keyframes fadeIn {
  0% {
    opacity: 0;
    transform: translateY(-20px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Animation pour les boutons */
@keyframes fadeInUp {
  0% {
    opacity: 0;
    transform: translateY(20px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

</style>
