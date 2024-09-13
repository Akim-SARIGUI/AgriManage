<template>
  <v-row>
    <v-col cols="12">
      <v-card class="mt-4">
        <v-card-title>
          <h2 class="text-h5">Gestion des Cultures</h2>
        </v-card-title>
        <v-card-text>
          <template v-if="parcelles.length > 0">
            <v-data-table :items="parcelles" :headers="headers" item-key="id">
              <template v-slot:item.name="{ item }">
                <span>{{ item.name }}</span>
              </template>
              <template v-slot:item.cropname="{ item }">
                <span>{{ item.cropname }}</span>
              </template>
              <template v-slot:item.planting_date="{ item }">
                <span>{{ formatDate(item.planting_date) }}</span>
              </template>
              <template v-slot:item.actions="{ item }">
                <v-btn color="primary" @click="viewDetails(item)" class="mr-2">
                  <v-icon>mdi-eye</v-icon> Suivie
                </v-btn>
                <v-btn color="warning" @click="editCrop(item)" class="mr-2">
                  <v-icon>mdi-pencil</v-icon> Editer
                </v-btn>
                <v-btn color="error" @click="confirmDeleteCrop(item)">
                  <v-icon>mdi-delete</v-icon> Supprimer
                </v-btn>
              </template>
            </v-data-table>
          </template>
          <template v-else>
            <p class="text-center">Pas de culture</p>
          </template>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="openCreateDialog" color="primary" class="elevation-2">
            Ajouter une Culture
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-col>
  </v-row>

  <!-- Dialog pour Modifier une Culture -->
  <v-dialog v-model="editDialog" max-width="500px">
    <v-card>
      <v-card-title>
        Modifier Culture
      </v-card-title>
      <v-card-text>
        
    <v-autocomplete
    v-model="editCropData.name"
    :items="editCropData.cropname"
    item-text="name"
    item-value="name" 
    label="Sélectionner une Parcelle"
    return-object
    clearable
  ></v-autocomplete>
       
        
        <v-text-field v-model="editCropData.cropname" label="Nom de la Culture"></v-text-field>
        <v-text-field v-model="editCropData.plantingDate" label="Date de Semis" type="date"></v-text-field>
       
        
        <v-btn color="primary" class="mt-2" @click="saveCrop">Sauvegarder</v-btn>
      </v-card-text>
      <v-card-actions>
        <v-btn color="green darken-1" text @click="editDialog = false">Annuler</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Dialog pour Voir les Détails d'une Culture -->
  <v-dialog v-model="dialog" max-width="800px">
    <v-card>
      <v-card-title>
        Détails de la Culture
      </v-card-title>
      <v-card-text>
        <v-data-table
          :headers="growthHeaders"
          :items="selectedCrop.growthStages"
          item-key="stage"
          class="elevation-1"
        >
          <template v-slot:item.done="{ item }">
            <v-checkbox
              v-model="item.done"
              @change="toggleActivity(item)"
            ></v-checkbox>
          </template>
          <template v-slot:item.alert="{ item }">
            {{ checkAlert(item.date) }}
          </template>
          <template v-slot:item.actions="{ item }">
            <v-btn color="warning" @click="editActivity(item)">
              <v-icon>mdi-pencil</v-icon>
            </v-btn>
            <v-btn color="error" @click="removeActivity(item)">
              <v-icon>mdi-delete</v-icon>
            </v-btn>
          </template>
        </v-data-table>

        <v-data-table
          :headers="interventionHeaders"
          :items="selectedCrop.interventions"
          item-key="id"
          class="elevation-1 mt-4"
        >
          <template v-slot:item.actions="{ item }">
            <v-btn color="error" @click="revertIntervention(item)">
              <v-icon>mdi-arrow-left</v-icon> Annuler
            </v-btn>
          </template>
        </v-data-table>

        <v-btn color="primary" @click="showAddActivityDialog" class="mt-3">
          Ajouter une Activité
        </v-btn>
      </v-card-text>
      <v-card-actions>
        <v-btn color="green darken-1" text @click="dialog = false">Fermer</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Dialog pour Ajouter une Activité -->
  <v-dialog v-model="addActivityDialog" max-width="500px">
    <v-card>
      <v-card-title>
        Ajouter une Activité
      </v-card-title>
      <v-card-text>
        <v-text-field v-model="newActivity.stage" label="Stade de Croissance"></v-text-field>
        <v-text-field v-model="newActivity.date" label="Date" type="date"></v-text-field>
        <v-text-field v-model="newActivity.action" label="Action"></v-text-field>
        <v-btn color="primary" class="mt-2" @click="addActivity">Ajouter Activité</v-btn>
      </v-card-text>
      <v-card-actions>
        <v-btn color="green darken-1" text @click="addActivityDialog = false">Annuler</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {

      crops: [], // Data from API
      parcelles: [], // Data from API
      parcels: [], // For the select input in the edit dialog
      headers: [
        { text: 'Nom', value: 'name' },
        { text: 'Nom de la Culture', value: 'cropname' },
        { text: 'Date de Plantation', value: 'planting_date' },
        { text: 'Actions', value: 'actions', sortable: false },
      ],
      growthHeaders: [
        { text: 'Stade', value: 'stage' },
        { text: 'Date', value: 'date' },
        { text: 'Action', value: 'action' },
        { text: 'Actions', value: 'actions', sortable: false },
      ],
      interventionHeaders: [
        { text: 'ID', value: 'id' },
        { text: 'Actions', value: 'actions', sortable: false },
      ],
      selectedCrop: {},
      editDialog: false,
      addActivityDialog: false,
      dialog: false,
      editCropData: {},
      newActivity: {},
      selectedCrop: {},
      
    };
  },
  
  methods: {
 async fetchCrops() {
      try {
        const response = await axios.get('http://localhost:3001/api/parcelles');
        this.crops = response.data
      } catch (error) {
        console.error('Erreur lors de la récupération des parcelles :', error);
      }
    },
    async fetchParcelles() {
      try {
        const response = await axios.get('http://localhost:3001/api/crops');
        console.log(response)
        this.parcelles = response.data.map(p => ({
          ...p,
          planting_date: new Date(p.planting_date).toLocaleDateString('fr-FR'),
          harvest_date: new Date(p.harvest_date).toLocaleDateString('fr-FR')
        }));
      } catch (error) {
        console.error('Erreur lors de la récupération des parcelles :', error);
      }
    },
    formatDate(date) {
      return new Date(date).toLocaleDateString('fr-FR');
    },
    viewDetails(crop) {
      // Fetch details of the selected crop and show in dialog
      this.selectedCrop = crop; // Update selected crop
      this.dialog = true; // Open the details dialog
    },
    editCrop(crop) {
      // Fetch details of the crop to edit and open the edit dialog
     
      this.editCropData = { ...crop }; // Prepare data for editing
      this.editDialog = true; // Open the edit dialog
    },
    async saveCrop() {
      // Save the edited crop details
      try {
        await axios.put(`http://localhost:3001/api/crops/${this.editCropData.id}`, this.editCropData);
        this.fetchParcelles(); // Refresh the list
        this.editDialog = false; // Close the edit dialog
      } catch (error) {
        console.error('Erreur lors de la sauvegarde des modifications :', error);
      }
    },
    confirmDeleteCrop(crop) {
      // Logic to confirm deletion of the crop
      if (confirm('Êtes-vous sûr de vouloir supprimer cette culture ?')) {
        this.deleteCrop(crop);
      }
    },
async deleteCrop(crop) {
  // Delete the selected crop
  try {
    // Utiliser l'id pour supprimer la culture
    console.log(crop.id); // Assure-toi que crop.id est bien défini
    await axios.delete(`http://localhost:3001/api/crops/${crop.cropid}`);
    
    this.fetchParcelles(); // Rafraîchir la liste des cultures
  } catch (error) {
    console.error('Erreur lors de la suppression de la culture :', error);
  }
    },
    showAddActivityDialog() {
      // Open dialog to add a new activity
      this.addActivityDialog = true;
    },
    async addActivity() {
      // Add the new activity
      this.selectedCrop.growthStages.push(this.newActivity);
      // Optionally: Save to server
      this.addActivityDialog = false; // Close the dialog
    },
    toggleActivity(activity) {
      // Toggle the activity status
    },
    removeActivity(activity) {
      // Remove the activity from the list
    },
    revertIntervention(intervention) {
      // Revert the intervention
    },
    checkAlert(date) {
      // Check if an alert should be shown for the date
    }
  },
  created() {
    this.fetchParcelles();
    this.fetchCrops();// Fetch initial data
  }
};
</script>

<style scoped>
/* Add your styles here */
</style>
