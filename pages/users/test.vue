<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <!-- Expansion panel pour chaque parcelle -->
        <v-expansion-panels multiple>
          <v-expansion-panel
            v-for="parcel in parcelles"
            :key="parcel.id"
          >
            <v-expansion-panel-header
              @click="toggleCrops(parcel.id)"
              class="custom-panel-header"
            >
              {{ parcel.name }} - Créé le {{ formatDate(parcel.created_at) }}
              <v-spacer></v-spacer>
            </v-expansion-panel-header>

            <v-expansion-panel-content v-if="showCrops[parcel.id]">
              <!-- Bouton pour ajouter une culture -->
              <v-row>
                <v-col cols="12" class="text-center">
                  <v-btn @click="showAddCropDialog(parcel.id)" color="primary">
                    Ajouter une culture
                  </v-btn>
                </v-col>
              </v-row>

              <!-- Tableau d'activités (cultures) déjà disponibles -->
              <v-row v-if="parcel.crops && parcel.crops.length">
                <v-col cols="12">
                  <v-data-table
                    :headers="activityHeaders"
                    :items="parcel.crops"
                    class="elevation-1"
                  >
                    <!-- Actions pour chaque culture (Suivre, Modifier, Supprimer) -->
                    <template v-slot:item.actions="{ item }">
                      <v-btn @click="showFollowCropDialog(item)" color="green">Suivre</v-btn>
                      <v-btn @click="showEditCropDialog(item)" color="blue">Modifier</v-btn>
                      <v-btn @click="confirmDeleteCrop(item.id)" color="red">Supprimer</v-btn>
                    </template>
                  </v-data-table>
                </v-col>
              </v-row>

              <!-- Message si aucune culture n'est disponible -->
              <v-row v-else>
                <v-col cols="12">
                  <v-alert type="info" class="text-center">
                    Aucune culture disponible pour cette parcelle.
                  </v-alert>
                </v-col>
              </v-row>
            </v-expansion-panel-content>
          </v-expansion-panel>
        </v-expansion-panels>
      </v-col>
    </v-row>

    <!-- Dialogues pour ajouter, modifier, suivre, et supprimer les cultures ici -->

  </v-container>
</template>

<script>
import axios from "axios";
import { ref, onMounted } from "vue";

export default {
  setup() {
    const parcelles = ref([]);
    const showCrops = ref({}); // Suivi de l'état d'affichage des cultures
    const activityHeaders = ref([
      { text: 'Nom de la culture', value: 'name' },
      { text: 'Date de plantation', value: 'planting_date' },
      { text: 'Date de récolte', value: 'harvest_date' },
      { text: 'Actions', value: 'actions', sortable: false },
    ]);

    // Fonction pour charger les parcelles et leurs cultures associées
    const fetchParcelles = async () => {
      try {
        // Assure-toi que cette API retourne les parcelles avec leurs cultures associées
        const response = await axios.get('http://localhost:3001/parcelles'); 
        parcelles.value = response.data;
        
        // Initialisation de l'état d'affichage des cultures
        parcelles.value.forEach(parcel => {
          showCrops.value[parcel.id] = false; // Par défaut, cacher les cultures
        });
      } catch (err) {
        console.error('Erreur lors du chargement des parcelles :', err);
      }
    };

    // Fonction pour formater les dates
    const formatDate = (dateString) => {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    };

    // Toggle l'affichage des cultures pour une parcelle spécifique
    const toggleCrops = (parcelId) => {
      showCrops.value[parcelId] = !showCrops.value[parcelId];
    };

    // Fonction pour afficher le dialogue d'ajout de culture (en cours de développement)
    const showAddCropDialog = (parcelId) => {
      console.log(`Ajouter une culture à la parcelle ID: ${parcelId}`);
    };

    // Fonction pour suivre une culture (en cours de développement)
    const showFollowCropDialog = (crop) => {
      console.log(`Suivre la culture : ${crop.name}`);
    };

    // Fonction pour modifier une culture (en cours de développement)
    const showEditCropDialog = (crop) => {
      console.log(`Modifier la culture : ${crop.name}`);
    };

    // Fonction pour confirmer la suppression d'une culture (en cours de développement)
    const confirmDeleteCrop = (cropId) => {
      console.log(`Supprimer la culture ID: ${cropId}`);
    };

    // Charger les parcelles à l'initialisation du composant
    onMounted(() => {
      fetchParcelles();
    });

    return {
      parcelles,
      showCrops,
      formatDate,
      toggleCrops,
      showAddCropDialog,
      showFollowCropDialog,
      showEditCropDialog,
      confirmDeleteCrop,
      activityHeaders,
    };
  },
};
</script>
