<template>
  <v-container>
    <v-row>
      <v-col cols="12">
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
              <v-row>
                <v-col cols="12" class="text-center">
                  <v-btn @click="showAddCropDialog(parcel.id)" color="primary">
                    Ajouter une culture
                  </v-btn>
                </v-col>
              </v-row>
              <v-row v-if="parcel.crops && parcel.crops.length">
                <v-col
                  v-for="crop in parcel.crops"
                  :key="crop.id"
                  cols="12"
                  md="6"
                  lg="4"
                >
                  <v-card class="pa-4">
                    <v-card-title>{{ crop.name }}</v-card-title>
                    <v-card-subtitle>Date de plantation : {{ formatDate(crop.planting_date) }}</v-card-subtitle>
                    <v-card-subtitle>Date de récolte : {{ crop.harvest_date ? formatDate(crop.harvest_date) : 'Non défini' }}</v-card-subtitle>
                    <v-card-actions>
                      <v-btn @click="showEditCropDialog(crop)" color="blue">
                        Modifier
                      </v-btn>
                      <v-btn @click="confirmDeleteCrop(crop.id)" color="red">
                        Supprimer
                      </v-btn>
                      <v-btn @click="showFollowCropDialog(crop)" color="green">
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
          </v-expansion-panel>
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
            <v-col
              v-for="activity in selectedCrop.activities"
              :key="activity.id"
              cols="12"
            >
              <v-card class="pa-4">
                <v-card-title>{{ activity.name }}</v-card-title>
                <v-card-subtitle>Date : {{ formatDate(activity.date) }}</v-card-subtitle>
                <v-card-actions>
                  <v-checkbox v-model="activity.selected" @change="updateIntervention(activity)" label="Intervention" />
                  <v-btn @click="showEditActivityDialog(activity)" color="blue">Modifier</v-btn>
                  <v-btn @click="confirmDeleteActivity(activity.id)" color="red">Supprimer</v-btn>
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

<style>
.custom-panel-header {
  height: 100px;
  width: 100%;
  font-size: 1.1rem;
  padding: 0 16px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
}
</style>
