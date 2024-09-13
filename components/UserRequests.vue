<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <h1>Requêtes des Utilisateurs</h1>
        <v-data-table :headers="headers" :items="requests" class="elevation-1">
          <template v-slot:item.actions="{ item }">
            <v-btn color="primary" @click="viewRequest(item)">Voir</v-btn>
            <v-btn class="ml-5" color="success" @click="respondRequest(item)">Répondre</v-btn>
          </template>
        </v-data-table>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
export default {
  data() {
    return {
      requests: [
        { user: 'Jean Dupont', message: 'Problème avec les cultures', status: 'En attente' },
        { user: 'Marie Durant', message: 'Besoin d\'aide pour le suivi des récoltes', status: 'Répondu' },
      ],
      headers: [
        { text: 'Utilisateur', value: 'user' },
        { text: 'Message', value: 'message' },
        { text: 'Statut', value: 'status' },
        { text: 'Actions', value: 'actions', sortable: false },
      ],
    };
  },
  methods: {
    viewRequest(request) {
      // Logique pour afficher les détails de la requête
    },
    respondRequest(request) {
      // Logique pour répondre à la requête
    },
  },
};
</script>

<style scoped>
/* Styles pour les requêtes des utilisateurs */
</style>
