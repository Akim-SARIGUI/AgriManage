<template>
  <v-container class="background-container">
    <v-row>
      <v-col cols="12">
        <v-expansion-panels multiple>
          <!-- Condition pour vérifier si aucune parcelle n'est créée -->
          <v-row v-if="parcelles.length === 0">
            <v-col cols="12" class="text-center">
              <v-alert type="info" class="text-center">
                Aucune parcelle créée. Créez des parcelles pour suivre vos cultures.
              </v-alert>
            </v-col>
          </v-row>

          <!-- Affichage des parcelles lorsque la liste n'est pas vide -->
          <v-row v-else>
            <v-col v-for="parcel in parcelles" :key="parcel.id" cols="12" md="6" lg="4">
              <v-card class="parcel-card" @click="toggleCrops(parcel.id)">
                <v-card-title class="parcel-title">
                  {{ parcel.name }}
                </v-card-title>
                <v-card-subtitle class="parcel-subtitle">
                  Créé le {{ formatDate(parcel.created_at) }}
                </v-card-subtitle>
                <v-expansion-panel-content v-if="showCrops[parcel.id]">
                  <v-row>
                    <v-col cols="12" class="text-center">
                      <v-btn @click.stop="showAddCropDialog(parcel.id)" color="primary" class="add-crop-btn">
                        <v-icon left>mdi-plus</v-icon>
                        Ajouter une culture
                      </v-btn>
                    </v-col>
                  </v-row>
                  <v-row v-if="parcel.crops && parcel.crops.length">
                    <v-col v-for="crop in parcel.crops" :key="crop.id" cols="12">
                      <v-card class="crop-card">
                        <v-card-title>{{ crop.name }}</v-card-title>
                        <v-card-subtitle>Date de plantation : {{ formatDate(crop.planting_date) }}</v-card-subtitle>
                        <v-card-actions>
                          <v-btn @click.stop="showEditCropDialog(crop)" color="blue" class="action-btn">
                            <v-icon left>mdi-pencil</v-icon>
                            Modifier
                          </v-btn>
                          <v-btn @click.stop="confirmDeleteCrop(crop.id)" color="red" class="action-btn">
                            <v-icon left>mdi-delete</v-icon>
                            Supprimer
                          </v-btn>
                          <v-btn @click.stop="showFollowCropDialog(crop)" color="green" class="action-btn">
                            <v-icon left>mdi-eye</v-icon>
                            Suivre
                          </v-btn>
                        </v-card-actions>
                      </v-card>
                    </v-col>
                  </v-row>
                  <v-row v-else>
                    <v-col cols="12">
                      <v-alert type="info" class="text-center">Aucune culture disponible pour cette parcelle.</v-alert>
                    </v-col>
                  </v-row>
                </v-expansion-panel-content>
              </v-card>
            </v-col>
          </v-row>
        </v-expansion-panels>
      </v-col>
    </v-row>

    <!-- Dialogs -->
    <v-dialog v-model="showDialogAddCrop" max-width="600px">
      <v-card>
        <v-card-title class="headline">Ajouter une culture</v-card-title>
        <v-card-text>
          <v-form ref="formAddCrop">
            <v-text-field v-model="newCrop.name" label="Nom de la culture" required />
            <v-text-field v-model="newCrop.planting_date" label="Date de plantation" type="date" required />
            <v-text-field v-model="newCrop.harvest_date" label="Date de récolte" type="date" />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-btn @click="addCrop" color="primary">Ajouter</v-btn>
          <v-btn @click="showDialogAddCrop = false" color="grey">Annuler</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="showDialogEditCrop" max-width="600px">
      <v-card>
        <v-card-title class="headline">Modifier une culture</v-card-title>
        <v-card-text>
          <v-form ref="formEditCrop">
            <v-text-field v-model="editCrop.name" label="Nom de la culture" required />
            <v-text-field v-model="editCrop.planting_date" label="Date de plantation" type="date" required />
            <v-text-field v-model="editCrop.harvest_date" label="Date de récolte" type="date" />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-btn @click="updateCrop" color="primary">Modifier</v-btn>
          <v-btn @click="showDialogEditCrop = false" color="grey">Annuler</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="showDialogFollowCrop" max-width="600px">
      <v-card>
        <v-card-title class="headline">Activités pour {{ selectedCrop.name }}</v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="12">
              <v-btn @click="showAddActivityDialog(selectedCrop.id)" color="primary">
                Ajouter une activité
              </v-btn>
            </v-col>
          </v-row>
          <v-row v-if="selectedCrop.activities && selectedCrop.activities.length">
            <v-col v-for="activity in selectedCrop.activities" :key="activity.id" cols="12">
              <v-card class="pa-4 activity-card">
                <v-card-title>{{ activity.name }}</v-card-title>
                <v-card-subtitle>Date : {{ formatDate(activity.date) }}</v-card-subtitle>
                <v-card-actions>
                  <v-row align="center" justify="space-between">
                    <v-col cols="4">
                      <v-checkbox v-model="activity.selected" @change="updateIntervention(activity)" label="Intervention" />
                    </v-col>
                    <v-col cols="4" class="text-right">
                      <v-btn @click="showEditActivityDialog(activity)" color="blue">Modifier</v-btn>
                    </v-col>
                    <v-col cols="4" class="text-right">
                      <v-btn @click="confirmDeleteActivity(activity.id)" color="red">Supprimer</v-btn>
                    </v-col>
                  </v-row>
                </v-card-actions>
              </v-card>
            </v-col>
          </v-row>
          <v-row v-else>
            <v-col cols="12">
              <v-alert type="info" class="text-center">Aucune activité disponible pour cette culture.</v-alert>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </v-dialog>

    <v-dialog v-model="showDialogAddActivity" max-width="600px">
      <v-card>
        <v-card-title class="headline">Ajouter une activité</v-card-title>
        <v-card-text>
          <v-form ref="formAddActivity">
            <v-text-field v-model="newActivity.name" label="Nom de l'activité" required />
            <v-text-field v-model="newActivity.date" label="Date de l'activité" type="date" required />
            <v-textarea v-model="newActivity.details" label="Détails de l'activité" />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-btn @click="addActivity" color="primary">Ajouter</v-btn>
          <v-btn @click="showDialogAddActivity = false" color="grey">Annuler</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="showDialogEditActivity" max-width="600px">
      <v-card>
        <v-card-title class="headline">Modifier une activité</v-card-title>
        <v-card-text>
          <v-form ref="formEditActivity">
            <v-text-field v-model="editActivity.name" label="Nom de l'activité" required />
            <v-text-field v-model="editActivity.date" label="Date de l'activité" type="date" required />
            <v-textarea v-model="editActivity.details" label="Détails de l'activité" />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-btn @click="updateActivity" color="primary">Modifier</v-btn>
          <v-btn @click="showDialogEditActivity = false" color="grey">Annuler</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import axios from "axios";
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";

export default {
  setup() {
    const router = useRouter();
    const user = ref(null);
    const error = ref(null);
    const parcelles = ref([]);
    const showDialogAddCrop = ref(false);
    const newCrop = ref({ name: '', planting_date: '', harvest_date: '' });
    const showCrops = ref({});
    const showDialogEditCrop = ref(false);
    const editCrop = ref({});
    const showDialogFollowCrop = ref(false);
    const selectedCrop = ref({});
    const showDialogAddActivity = ref(false);
    const newActivity = ref({ name: '', date: '', details: '' });
    const showDialogEditActivity = ref(false);
    const editActivity = ref({});
    const interventions = ref([]); // Liste des interventions

    // Chargement des interventions depuis le localStorage
    const loadInterventions = () => {
      const storedInterventions = localStorage.getItem('interventions');
      if (storedInterventions) {
        interventions.value = JSON.parse(storedInterventions);
      }
    };

    // Sauvegarde des interventions dans le localStorage
    const saveInterventions = () => {
      localStorage.setItem('interventions', JSON.stringify(interventions.value));
    };

    const formatDate = (dateString) => {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    };

    const toggleCrops = (parcelId) => {
      showCrops.value[parcelId] = !showCrops.value[parcelId];
    };

    const showAddCropDialog = (parcelId) => {
      newCrop.value.parcel_id = parcelId;
      showDialogAddCrop.value = true;
    };

    const addCrop = async () => {
      try {
        await axios.post('http://localhost:3001/crops', newCrop.value);
        await fetchParcelles(user.value.id);
        showDialogAddCrop.value = false;
        newCrop.value = { name: '', planting_date: '', harvest_date: '' };
      } catch (err) {
        console.error('Erreur lors de l\'ajout de la culture :', err);
      }
    };

    const showEditCropDialog = (crop) => {
      editCrop.value = { ...crop }; // Clone the crop object to edit
      showDialogEditCrop.value = true;
    };

    const updateCrop = async () => {
      try {
        await axios.put(`http://localhost:3001/crops/${editCrop.value.id}`, editCrop.value);
        await fetchParcelles(user.value.id);
        showDialogEditCrop.value = false;
      } catch (err) {
        console.error('Erreur lors de la modification de la culture :', err);
      }
    };

    const confirmDeleteCrop = (cropId) => {
      const confirmation = confirm("Êtes-vous sûr de vouloir supprimer cette culture ?");
      if (confirmation) {
        deleteCrop(cropId);
      }
    };

    const deleteCrop = async (cropId) => {
      try {
        await axios.delete(`http://localhost:3001/api/crops/${cropId}`);
        await fetchParcelles(user.value.id);
      } catch (err) {
        console.error('Erreur lors de la suppression de la culture :', err);
      }
    };

    const showFollowCropDialog = async (crop) => {
      selectedCrop.value = crop;
      await fetchActivities(crop.id);
      showDialogFollowCrop.value = true;
    };

    const fetchActivities = async (cropId) => {
      try {
        const response = await axios.get(`http://localhost:3001/activities/${cropId}`);
        selectedCrop.value.activities = response.data;

        // Charger l'état des interventions
        loadInterventions();
        selectedCrop.value.activities.forEach(activity => {
          activity.selected = interventions.value.some(intervention => intervention.id === activity.id);
        });
      } catch (err) {
        console.error('Erreur lors de la récupération des activités :', err);
        selectedCrop.value.activities = [];
      }
    };

    const showAddActivityDialog = (cropId) => {
      newActivity.value.crop_id = cropId;
      showDialogAddActivity.value = true;
    };

    const addActivity = async () => {
      try {
        await axios.post('http://localhost:3001/activities', newActivity.value);
        await fetchActivities(newActivity.value.crop_id);
        showDialogAddActivity.value = false;
        newActivity.value = { name: '', date: '', details: '' };
      } catch (err) {
        console.error('Erreur lors de l\'ajout de l\'activité :', err);
      }
    };

    const showEditActivityDialog = (activity) => {
      editActivity.value = { ...activity }; // Clone the activity object to edit
      showDialogEditActivity.value = true;
    };

    const updateActivity = async () => {
      try {
        await axios.put(`http://localhost:3001/activities/${editActivity.value.id}`, editActivity.value);
        await fetchActivities(selectedCrop.value.id);
        showDialogEditActivity.value = false;
      } catch (err) {
        console.error('Erreur lors de la modification de l\'activité :', err);
      }
    };

    const confirmDeleteActivity = (activityId) => {
      const confirmation = confirm("Êtes-vous sûr de vouloir supprimer cette activité ?");
      if (confirmation) {
        deleteActivity(activityId);
      }
    };

    const deleteActivity = async (activityId) => {
      try {
        await axios.delete(`http://localhost:3001/activities/${activityId}`);
        await fetchActivities(selectedCrop.value.id);
      } catch (err) {
        console.error('Erreur lors de la suppression de l\'activité :', err);
      }
    };

    const updateIntervention = async (activity) => {
      if (activity.selected) {
        try {
          await axios.post('http://localhost:3001/interventions', { activity_id: activity.id });
          interventions.value.push(activity); // Ajouter à la liste des interventions
        } catch (err) {
          console.error('Erreur lors de l\'ajout de l\'intervention :', err);
        }
      } else {
        try {
          await axios.delete(`http://localhost:3001/interventions/${activity.id}`);
          interventions.value = interventions.value.filter(intervention => intervention.id !== activity.id); // Retirer de la liste
        } catch (err) {
          console.error('Erreur lors de la suppression de l\'intervention :', err);
        }
      }
      // Sauvegarder les interventions dans le localStorage
      saveInterventions();
    };

    const fetchParcelles = async (userId) => {
      try {
        const response = await axios.get(`http://localhost:3001/parcelles/${userId}`);
        parcelles.value = await Promise.all(
          response.data.map(async (parcel) => {
            const crops = await fetchCrops(parcel.id);
            return {
              ...parcel,
              crops,
            };
          })
        );
      } catch (error) {
        console.error('Erreur lors de la récupération des parcelles :', error);
      }
    };

    const fetchCrops = async (parcelId) => {
      try {
        const response = await axios.get(`http://localhost:3001/api/crops/${parcelId}`);
        return response.data;
      } catch (err) {
        console.error('Erreur lors de la récupération des cultures :', err);
        return [];
      }
    };

    onMounted(async () => {
      try {
        const token = localStorage.getItem("authToken");

        if (!token) {
          router.push("/users/connexion");
          return;
        }

        const response = await axios.get("http://localhost:3001/api/user-profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        user.value = response.data;
        await fetchParcelles(user.value.id);
        loadInterventions(); // Charger les interventions lors du montage
      } catch (err) {
        console.error("Erreur lors de la récupération des informations de l'utilisateur:", err);
        error.value = "Erreur lors de la récupération des informations.";
        router.push("/users/connexion");
      }
    });

    return {
      user,
      parcelles,
      showDialogAddCrop,
      newCrop,
      addCrop,
      showAddCropDialog,
      showEditCropDialog,
      editCrop,
      updateCrop,
      confirmDeleteCrop,
      deleteCrop,
      showFollowCropDialog,
      selectedCrop,
      showDialogFollowCrop,
      showDialogAddActivity,
      newActivity,
      addActivity,
      showEditActivityDialog,
      editActivity,
      updateActivity,
      confirmDeleteActivity,
      deleteActivity,
      toggleCrops,
      showCrops,
      formatDate,
      showDialogEditCrop,
      showDialogEditActivity,
      showAddActivityDialog,
      interventions,
      updateIntervention
    };
  }
};
</script>

<style scoped>
.background-container {
  background: linear-gradient(135deg, #f0f4f8, #e0e7ed);
  min-height: 100vh;
  padding: 24px;
}

.parcel-card {
  background: linear-gradient(145deg, #ffffff, #f0f0f0);
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  margin-bottom: 16px;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.parcel-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
}

.parcel-title {
  font-family: 'Poppins', sans-serif;
  font-size: 2rem;
  font-weight: 600;
  color: #2c3e50;
  padding: 16px;
}

.parcel-subtitle {
  font-family: 'Roboto', sans-serif;
  font-size: 1.5rem;
  color: #666;
  padding: 0 16px 16px 16px;
}

.crop-card {
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  margin-bottom: 16px;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.crop-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
}

.add-crop-btn {
  background: linear-gradient(145deg, #1976d2, #1565c0);
  color: white;
  font-family: 'Roboto', sans-serif;
  font-weight: 500;
  text-transform: none;
  border-radius: 8px;
  padding: 10px 20px;
  transition: background 0.3s ease;
}

.add-crop-btn:hover {
  background: linear-gradient(145deg, #1565c0, #1976d2);
}

.action-btn {
  text-transform: none;
  font-weight: 500;
  letter-spacing: 0.5px;
  margin: 4px;
}

.v-btn--primary {
  background-color: #1976d2;
  color: white;
}

.v-btn--primary:hover {
  background-color: #1565c0;
}

.v-btn--red {
  background-color: #d32f2f;
  color: white;
}

.v-btn--red:hover {
  background-color: #c62828;
}

.v-btn--green {
  background-color: #388e3c;
  color: white;
}

.v-btn--green:hover {
  background-color: #2e7d32;
}

.v-dialog {
  border-radius: 12px;
}

.v-card {
  border-radius: 12px;
}

.v-card-title {
  background-color: #1b5e20;
  color: white;
  padding: 16px 24px;
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
  font-size: 1.5rem;
  font-weight: 600;
}

.v-card-text {
  padding: 24px;
}

.v-card-actions {
  padding: 16px 24px;
  background-color: #f5f5f5;
  border-top: 1px solid #e0e0e0;
  border-bottom-left-radius: 12px;
  border-bottom-right-radius: 12px;
}

.v-alert {
  border-radius: 12px;
  margin: 16px 0;
  padding: 16px;
}

.v-alert--info {
  background-color: #e3f2fd;
  color: #1976d2;
}

.v-text-field, .v-textarea {
  margin-bottom: 16px;
}

.v-text-field input, .v-textarea textarea {
  font-size: 1.1rem;
}

.v-text-field label, .v-textarea label {
  color: #616161;
}

.v-checkbox {
  margin: 0;
}

.v-checkbox label {
  color: #616161;
  font-size: 1.1rem;
}

.v-col {
  padding: 8px;
}
</style>