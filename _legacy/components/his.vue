<template>
  <v-app>
    <v-container class="container">
      <v-row>
        <v-col cols="12">
          <v-data-table
            :headers="cropHeaders"
            :items="crops"
            item-key="id"
            class="elevation-1"
          >
            <template v-slot:item="{ item }">
              <tr>
                <td>{{ getParcelName(item.parcelId) }}</td>
                <td>{{ item.name }}</td>
                <td>{{ item.plantingDate }}</td>
                <td>
                  <v-btn color="primary" @click="viewDetails(item.id)" class="mr-2">
                    <v-icon>mdi-eye</v-icon> Suivi 
                  </v-btn>
                  <v-btn color="warning" @click="editCrop(item.id)" class="mr-2">
                    <v-icon>mdi-pencil</v-icon> Éditer
                  </v-btn>
                  <v-btn color="error" @click="deleteCrop(item.id)">
                    <v-icon>mdi-delete</v-icon> Supprimer
                  </v-btn>
                </td>
              </tr>
            </template>
          </v-data-table>
          <v-btn color="primary" @click="showAddCropDialog" class="mt-3">
            Ajouter une Culture
          </v-btn>
        </v-col>
      </v-row>

      <!-- Dialog pour Ajouter une Culture -->
      <v-dialog v-model="addCropDialog" max-width="500px">
        <v-card>
          <v-card-title>
            Ajouter une Culture
          </v-card-title>
          <v-card-text>
            <v-select
              v-model="newCrop.parcelId"
              :items="parcels"
              item-value="id"
              item-text="name"
              label="Sélectionner la Parcelle"
            ></v-select>
            <v-text-field v-model="newCrop.name" label="Nom de la Culture"></v-text-field>
            <v-text-field v-model="newCrop.plantingDate" label="Date de Semis" type="date"></v-text-field>
            <v-btn color="primary" class="mt-2" @click="saveNewCrop">Ajouter Culture</v-btn>
          </v-card-text>
          <v-card-actions>
            <v-btn color="green darken-1" text @click="addCropDialog = false">Annuler</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Dialog pour Modifier une Culture -->
      <v-dialog v-model="editDialog" max-width="500px">
        <v-card>
          <v-card-title>
            Modifier Culture
          </v-card-title>
          <v-card-text>
            <v-select
              v-model="editCropData.parcelId"
              :items="parcels"
              item-value="id"
              item-text="name"
              label="Sélectionner la Parcelle"
            ></v-select>
            <v-text-field v-model="editCropData.name" label="Nom de la Culture"></v-text-field>
            <v-text-field v-model="editCropData.plantingDate" label="Date de Semis" type="date"></v-text-field>
            <v-btn color="primary" class="mt-2" @click="updateCrop">Sauvegarder</v-btn>
          </v-card-text>
          <v-card-actions>
            <v-btn color="green darken-1" text @click="editDialog = false">Annuler</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Dialog pour Voir les suivis d'une Culture -->
      <v-dialog v-model="dialog" max-width="800px">
        <v-card>
          <v-card-title>
            Suivi de la Culture
          </v-card-title>
          <v-card-text>
            <v-data-table
              :headers="growthHeaders"
              :items="sortedGrowthStages"
              item-key="stage"
              class="elevation-1"
            >
              <template v-slot:item.done="{ item }">
                <v-checkbox
                  v-model="item.done"
                  @change="handleActivityChange(item)"
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
              :items="sortedInterventions"
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
    </v-container>
  </v-app>
</template>

<script setup>
import { ref, computed } from 'vue';

// Dialogs pour ajouter, éditer, et voir les détails
const dialog = ref(false);
const editDialog = ref(false);
const addCropDialog = ref(false);
const addActivityDialog = ref(false);


// Données de la culture sélectionnée
const selectedCrop = ref(null);

// Données de la culture à éditer
const editCropData = ref({
  id: null,
  name: '',
  parcelId: '',
  plantingDate: ''
});

// Nouvelle culture à ajouter
const newCrop = ref({
  name: '',
  parcelId: '',
  plantingDate: ''
});

// Nouvelle activité à ajouter
const newActivity = ref({
  stage: '',
  date: '',
  action: '',
  done: false
});

// Liste des cultures (exemple de données)
const crops = ref([
  {
    id: '47f12afc-caba-49bb-a4ad-dcc5ffeef2e2',
    name: 'Culture_1',
    plantingDate: '2024-09-05',
    parcelId: '186c5c1b-5f37-4d0b-a5aa-ec36c3cb5e93',
    growthStages: [],
    interventions: []
  }
]);

// Liste des parcelles (exemple de données)
const parcels = ref([
  {
    id: '186c5c1b-5f37-4d0b-a5aa-ec36c3cb5e93',
    name: 'Parcelle 1'
  }
]);

// En-têtes du tableau
const cropHeaders = [
  { text: 'Parcelle', value: 'parcel' },
  { text: 'Nom de la Culture', value: 'name' },
  { text: 'Date de Semis', value: 'plantingDate' },
  { text: 'Actions', value: 'actions', sortable: false }
];

const growthHeaders = [
  { text: 'Stade', value: 'stage' },
  { text: 'Date', value: 'date' },
  { text: 'Action', value: 'action' },
  { text: 'Complété', value: 'done' },
  { text: 'Alertes', value: 'alert' },
  { text: 'Actions', value: 'actions', sortable: false }
];

const interventionHeaders = [
  { text: 'Intervention', value: 'intervention' },
  { text: 'Date', value: 'date' },
  { text: 'Actions', value: 'actions', sortable: false }
];

// Fonction pour obtenir le nom de la parcelle
const getParcelName = (parcelId) => {
  const parcel = parcels.value.find(parcel => parcel.id === parcelId);
  return parcel ? parcel.name : '';
};

// Fonction pour voir les détails d'une culture
const viewDetails = (id) => {
  selectedCrop.value = crops.value.find(crop => crop.id === id);
  dialog.value = true;
};

// Fonction pour éditer une culture
const editCrop = (id) => {
  editCropData.value = { ...crops.value.find(crop => crop.id === id) };
  editDialog.value = true;
};

// Fonction pour supprimer une culture
const deleteCrop = (id) => {
  crops.value = crops.value.filter(crop => crop.id !== id);
};

// Fonction pour ajouter une nouvelle culture
const saveNewCrop = () => {
  crops.value.push({
    ...newCrop.value,
    id: generateId(),
    growthStages: [],
    interventions: []
  });
  addCropDialog.value = false;
};

// Fonction pour sauvegarder les modifications d'une culture
const updateCrop = () => {
  const index = crops.value.findIndex(crop => crop.id === editCropData.value.id);
  if (index !== -1) {
    crops.value[index] = { ...editCropData.value };
  }
  editDialog.value = false;
};

// Fonction pour ajouter une nouvelle activité
const addActivity = () => {
  if (selectedCrop.value) {
    selectedCrop.value.growthStages.push({ ...newActivity.value, done: false });
    newActivity.value = { stage: '', date: '', action: '', done: false };
    addActivityDialog.value = false;
  }
};

// Fonction pour éditer une activité
const editActivity = (activity) => {
  editActivityIndex.value = selectedCrop.value.growthStages.indexOf(activity);
  newActivity.value = { ...activity };
  addActivityDialog.value = true;
};

// Fonction pour supprimer une activité
const removeActivity = (activity) => {
  if (selectedCrop.value) {
    selectedCrop.value.growthStages = selectedCrop.value.growthStages.filter(
      stage => stage !== activity
    );
  }
};

// Fonction pour déplacer une activité vers les interventions
const moveToInterventions = (activity) => {
  if (selectedCrop.value) {
    selectedCrop.value.growthStages = selectedCrop.value.growthStages.filter(
      stage => stage !== activity
    );
    selectedCrop.value.interventions.push(activity);
  }
};

// Fonction pour annuler une intervention
const revertIntervention = (intervention) => {
  if (selectedCrop.value) {
    selectedCrop.value.interventions = selectedCrop.value.interventions.filter(
      inter => inter !== intervention
    );
    selectedCrop.value.growthStages.push({
      ...intervention,
      done: false
    });
  }
};

// Fonction pour gérer les changements d'activité (cochée ou non)
const handleActivityChange = (activity) => {
  if (activity.done) {
    moveToInterventions(activity);
  } else {
    revertIntervention(activity);
  }
};

// Fonction pour vérifier les alertes
const checkAlert = (date) => {
  const today = new Date();
  const activityDate = new Date(date);
  if (activityDate - today < 7 * 24 * 60 * 60 * 1000) {
    return 'Attention';
  }
  return '';
};

// Fonction pour générer un ID unique (exemple)
const generateId = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Trier les stades de croissance par date
const sortedGrowthStages = computed(() => {
  return selectedCrop.value ? selectedCrop.value.growthStages.slice().sort((a, b) => new Date(a.date) - new Date(b.date)) : [];
});

// Trier les interventions par date
const sortedInterventions = computed(() => {
  return selectedCrop.value ? selectedCrop.value.interventions.slice().sort((a, b) => new Date(a.date) - new Date(b.date)) : [];
});

// Afficher le dialogue pour ajouter une culture
const showAddCropDialog = () => {
  newCrop.value = { name: '', parcelId: '', plantingDate: '' };
  addCropDialog.value = true;
};

// Afficher le dialogue pour ajouter une activité
const showAddActivityDialog = () => {
  newActivity.value = { stage: '', date: '', action: '', done: false };
  addActivityDialog.value = true;
};


</script>

<style>
/* Styles pour les boutons et les dialogues */
.v-btn {
  margin: 5px;
}
.v-data-table {
  margin-bottom: 20px;
}
</style>
