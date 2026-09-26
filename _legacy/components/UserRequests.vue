<template>
  <div>
    <!-- Barre de recherche -->
    <v-row>
      <v-col cols="12" sm="8" md="6" lg="4">
        <v-text-field
          v-model="search"
          label="Rechercher une requête"
          outlined
          clearable
          class="mb-4"
        ></v-text-field>
      </v-col>
    </v-row>

    <!-- Gestion des états : chargement, erreur ou affichage des données -->
    <div>
      <div v-if="loading" class="text-center">Chargement des requêtes...</div>
      <v-alert v-else-if="error" type="error" class="mb-4">
        {{ error }}
      </v-alert>
      <v-data-table
        v-else
        :headers="headers"
        :items="filteredRequests"
        class="elevation-1"
        item-value="id"
        dense
      >
        <template #top>
          <v-toolbar flat>
            <v-toolbar-title>Liste des Requêtes</v-toolbar-title>
            <v-spacer></v-spacer>
          </v-toolbar>
        </template>

        <!-- Boutons pour chaque requête -->
        <template #item.actions="{ item }">
          <v-btn small color="blue" @click="viewRequest(item)" class="mb-2 mb-sm-0">Voir</v-btn>
          <v-btn small color="green" @click="openResponseDialog(item.id)" class="mb-2 mb-sm-0 ml-2">Répondre</v-btn>
        </template>
      </v-data-table>
    </div>

    <!-- Dialog pour répondre à une requête -->
    <v-dialog v-model="dialog" max-width="600px">
      <v-card>
        <v-card-title>Répondre à une requête</v-card-title>
        <v-card-text>
          <v-textarea
            v-model="responseMessage"
            label="Votre réponse"
            outlined
            rows="5"
          ></v-textarea>
        </v-card-text>
        <v-card-actions>
          <v-btn text @click="dialog = false">Annuler</v-btn>
          <v-btn color="green" @click="sendResponse">Envoyer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog pour voir le message d'une requête -->
    <v-dialog v-model="viewDialog" max-width="600px">
      <v-card>
        <v-card-title>Détails de la Requête</v-card-title>
        <v-card-text>{{ selectedRequestMessage }}</v-card-text>
        <v-card-actions>
          <v-btn text @click="viewDialog = false">Fermer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog pour le message de succès -->
    <v-dialog v-model="successDialog" max-width="600px">
      <v-card>
        <v-card-title>Succès</v-card-title>
        <v-card-text>{{ successMessage }}</v-card-text>
        <v-card-actions>
          <v-btn color="green darken-1" text @click="closeSuccessDialog">Fermer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog pour le message d'erreur -->
    <v-dialog v-model="errorDialog" max-width="600px">
      <v-card>
        <v-card-title>Erreur</v-card-title>
        <v-card-text>{{ errorMessage }}</v-card-text>
        <v-card-actions>
          <v-btn color="red darken-1" text @click="closeErrorDialog">Fermer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';

const search = ref('');
const loading = ref(false);
const error = ref('');
const requests = ref([]);
const dialog = ref(false);
const viewDialog = ref(false);
const selectedRequestId = ref(null);
const selectedRequestMessage = ref('');
const responseMessage = ref('');
const successDialog = ref(false);
const errorDialog = ref(false);
const successMessage = ref('');
const errorMessage = ref('');

const headers = [
  { text: 'ID', value: 'id' },
  { text: 'Utilisateur', value: 'user' },
  { text: 'Message', value: 'message' },
  { text: 'Statut', value: 'status' },
  { text: 'Actions', value: 'actions', sortable: false },
];

// Charger les données
const fetchRequests = async () => {
  loading.value = true;
  error.value = '';
  try {
    const response = await axios.get('http://localhost:3001/api/requests');
    requests.value = response.data;
  } catch (err) {
    error.value = "Erreur lors de la récupération des requêtes.";
    console.error(err);
  } finally {
    loading.value = false;
  }
};

// Requête filtrée par recherche
const filteredRequests = computed(() =>
  requests.value.filter((req) =>
    Object.values(req).some((val) =>
      String(val).toLowerCase().includes(search.value.toLowerCase())
    )
  )
);

// Voir une requête
const viewRequest = (request) => {
  selectedRequestMessage.value = request.message; // Stocker le message de la requête sélectionnée
  viewDialog.value = true; // Ouvrir le dialogue pour voir les détails de la requête
};

// Ouvrir le dialog pour répondre
const openResponseDialog = (id) => {
  selectedRequestId.value = id;
  dialog.value = true;
};

// Envoyer la réponse
const sendResponse = async () => {
  if (!selectedRequestId.value || !responseMessage.value.trim()) {
    errorMessage.value = 'Veuillez saisir une réponse valide.';
    errorDialog.value = true; // Ouvrir le dialogue d'erreur pour une entrée invalide
    return;
  }

  try {
    await axios.put(
      `http://localhost:3001/api/requests/${selectedRequestId.value}/respond`,
      { response: responseMessage.value }
    );
    
    successMessage.value = 'Réponse envoyée avec succès !';
    successDialog.value = true; // Ouvrir le dialogue de succès

    dialog.value = false; // Fermer le dialogue de réponse
    responseMessage.value = ''; // Réinitialiser le message de réponse
    fetchRequests(); // Recharger les données après l'envoi
  } catch (err) {
    console.error('Erreur lors de l\'envoi de la réponse :', err);
    errorMessage.value = "Erreur lors de l'envoi de la réponse.";
    errorDialog.value = true; // Ouvrir le dialogue d'erreur en cas d'échec d'envoi
  }
};

// Charger les requêtes au montage
onMounted(fetchRequests);

// Méthodes pour fermer les dialogues
const closeSuccessDialog = () => {
  successDialog.value = false;
};

const closeErrorDialog = () => {
  errorDialog.value = false;
};
</script>

<style scoped>
.text-center {
  text-align: center;
  font-size: 18px;
  margin-top: 20px;
}

/* Ajustements pour les petits écrans */
@media (max-width: 600px) {
  .v-btn {
    width: 100%;
    margin-bottom: 8px;
  }
  .v-btn.ml-2 {
    margin-left: 0 !important;
  }
}
</style>