<template>
  <v-app>
    <!-- Barre latérale de navigation -->
    <v-navigation-drawer app v-model="drawer" style="background-color: #1b5e20;" class="lat" dark>
      <v-list dense>
        <v-list-item>
          <v-list-item-content>
            <v-list-item-title class="text-h4">Admin Panel</v-list-item-title>
          </v-list-item-content>
        </v-list-item>

        <!-- Gestion des utilisateurs -->
        <v-list-item @click="showSection('users')">
          <v-list-item-content>
            <v-list-item-title>Gestion des Utilisateurs</v-list-item-title>
          </v-list-item-content>
        </v-list-item>

        <!-- Requêtes des utilisateurs -->
        <v-list-item @click="showSection('requests')">
          <v-list-item-content>
            <v-list-item-title>Requêtes des Utilisateurs</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <!-- Barre d'application -->
    <v-app-bar app style="background-color: #1b5e20;" class="lat" dark>
      <v-app-bar-nav-icon @click.stop="drawer = !drawer" class="hidden-md-and-up"></v-app-bar-nav-icon>
      <v-toolbar-title class="lat">Administration - Gestion de la Ferme</v-toolbar-title>
    </v-app-bar>

    <!-- Contenu principal -->
    <v-main>
      <v-container>
        <v-row>
          <v-col cols="12">
            <!-- Gestion des utilisateurs -->
            <users-management v-if="currentSection === 'users'" />

            <!-- Requêtes des utilisateurs -->
            <user-requests v-if="currentSection === 'requests'" />
          </v-col>
        </v-row>
      </v-container>
    </v-main>

    <!-- Pied de page -->
    <v-footer app style="background-color: #1b5e20;" dark>
      <span class="white--text lat">&copy; 2024 Gestion de Ferme Agricole</span>
    </v-footer>
  </v-app>
</template>

<script>
import UsersManagement from '@/components/UsersManagement.vue';
import UserRequests from '@/components/UserRequests.vue';

export default {
  components: {
    UsersManagement,
    UserRequests,
  },
  data() {
    return {
      drawer: true, // Pour contrôler l'affichage du drawer
      currentSection: 'users', // Définir la section actuelle ('users' par défaut)
    };
  },
  methods: {
    // Méthode pour changer la section
    showSection(section) {
      this.currentSection = section;
    },
  },
};
</script>

<style scoped>
/* Styles personnalisés pour l'interface admin */
.text-h4 {
  color: white;
}
.lat {
  color: white;
  font-size: 1.2rem;
}
la {
  font-size: 1em;
}

/* Ajustements pour les petits écrans */
@media (max-width: 960px) {
  .lat {
    font-size: 1rem;
  }
  .text-h4 {
    font-size: 1.5rem;
  }
}
</style>