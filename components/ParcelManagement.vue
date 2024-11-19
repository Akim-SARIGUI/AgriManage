<template>
  <div >
    <!-- Section pour afficher les parcelles -->
    <v-row>
      <v-col cols="12">
        <v-card class="mt-4 ma-15 par elevation-10">
          <v-card-title>
            <h2 class="text-h5">Gestion des Parcelles</h2>
          </v-card-title>
          <v-card-text>
            <template v-if="parcelles.length > 0">
              <v-data-table :items="parcelles" :headers="headers" item-key="id">
                <template v-slot:item.size="{ item }">
                  <span>{{ item.size }} ha</span>
                </template>
                <template v-slot:item.actions="{ item }">
                  <v-btn small @click="editParcelle(item)" class="mr-2" fab dark>
                    <v-icon>mdi-pencil</v-icon>
                  </v-btn>
                  <v-btn small color="red" @click="confirmDeleteParcelle(item)" class="mr-2" fab dark>
                    <v-icon>mdi-delete</v-icon>
                  </v-btn>
                  <v-btn small @click="viewHistory(item)" fab dark>
                    <v-icon>mdi-history</v-icon>
                  </v-btn>
                </template>
              </v-data-table>
            </template>
            <template v-else>
              <p class="text-center">Pas de parcelle</p>
            </template>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn @click="openCreateDialog" color="primary" class="elevation-2">
              Ajouter une Parcelle
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- Dialogue pour créer/modifier une parcelle -->
    <v-dialog v-model="dialogPost" persistent max-width="600px">
      <v-card>
        <v-card-title>
          <span class="text-h5">{{ isEditMode ? 'Modifier Parcelle' : 'Créer Parcelle' }}</span>
        </v-card-title>
        <v-card-text>
          <v-form ref="formRef">
            <v-text-field v-model="formData.name" label="Nom de la Parcelle" required></v-text-field>
            <v-text-field v-model="formData.size" label="Taille (en hectares)" required></v-text-field>
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="formattedDate"
                  label="Sélectionner une date"
                  prepend-icon="mdi-calendar"
                  readonly
                  @click="menu = true"
                ></v-text-field>
                <v-menu
                  v-model="menu"
                  :close-on-content-click="false"
                  transition="scale-transition"
                  offset-y
                >
                  <v-date-picker v-model="formData.date" @input="updateDate" @close="menu = false"></v-date-picker>
                </v-menu>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="green darken-1" text @click="saveParcelle">Enregistrer</v-btn>
          <v-btn color="red darken-1" text @click="cancelParcelle">Annuler</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialogue pour confirmer la suppression d'une parcelle -->
    <v-dialog v-model="confirmDeleteDialog" max-width="500px">
      <v-card>
        <v-card-title>
          <span class="text-h5">Confirmer la Suppression</span>
        </v-card-title>
        <v-card-text>
          <p>Êtes-vous sûr de vouloir supprimer cette parcelle ?</p>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="green darken-1" text @click="deleteParcelle">Confirmer</v-btn>
          <v-btn color="red darken-1" text @click="cancelDelete">Annuler</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialogue pour afficher l'historique des cultures -->
    <v-dialog v-model="dialogHistory" max-width="800px">
      <v-card>
        <v-card-title>
          <span class="text-h5">Historique des Cultures</span>
        </v-card-title>
        <v-card-text>
          <template v-if="cultures.length > 0">
            <v-data-table :items="cultures" :headers="historyHeaders" item-key="id">
              <template v-slot:item.planting_date="{ item }">
                <span>{{ formatDate(item.planting_date) }}</span>
              </template>
              <template v-slot:item.harvest_date="{ item }">
                <span>{{ formatDate(item.harvest_date) }}</span>
              </template>
            </v-data-table>
          </template>
          <template v-else>
            <p class="text-center">Pas de culture</p>
          </template>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="red darken-1" text @click="closeHistory">Fermer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';

const dialogPost = ref(false);
const confirmDeleteDialog = ref(false);
const successDialog = ref(false);
const isEditMode = ref(false);
const dialogHistory = ref(false);
const formData = ref({
  id: null,
  name: '',
  size: '',
  date: null,
});

const menu = ref(false);
const formattedDate = ref('');
const lastSavedParcelle = ref({});
const parcelles = ref([]);
const cultures = ref([]); // Liste des cultures
const selectedParcelleId = ref(null); // ID de la parcelle sélectionnée

const headers = [
  { text: 'Nom', value: 'name' },
  { text: 'Dimension', value: 'size' },
  { text: 'Date', value: 'date' },
  { text: 'Actions', value: 'actions', sortable: false }
];

const historyHeaders = [
  { text: 'Nom', value: 'name' },
  { text: 'Date de Plantation', value: 'planting_date' },
  { text: 'Date de Récolte', value: 'harvest_date' }
];

const router = useRouter();
const user = ref(null);
const error = ref(null);

onMounted(async () => {
  try {
    const token = localStorage.getItem('authToken');
    if (!token) {
      router.push('/users/connexion');
      return;
    }

    const response = await axios.get('http://localhost:3001/api/user-profile', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    user.value = response.data;
    fetchParcelles(user.value.id);
  } catch (err) {
    console.error("Erreur lors de la récupération des informations de l'utilisateur:", err);
    error.value = "Erreur lors de la récupération des informations.";
    router.push('/users/connexion');
  }
});

// Fonction pour récupérer les parcelles en fonction de l'ID utilisateur
const fetchParcelles = async (id) => {
  try {
    const response = await axios.get(`http://localhost:3001/parcelles/${id}`);
    parcelles.value = response.data.map(p => ({
      ...p,
      date: formatDate(p.created_at)
    }));
  } catch (error) {
    console.error("Erreur lors de la récupération des parcelles :", error);
  }
};

const openCreateDialog = () => {
  isEditMode.value = false;
  resetForm();
  dialogPost.value = true;
};

const editParcelle = (item) => {
  isEditMode.value = true;
  formData.value = { ...item, date: new Date(item.created_at) };
  formattedDate.value = formatDate(formData.value.date);
  dialogPost.value = true;
};

const updateDate = () => {
  formattedDate.value = formatDate(formData.value.date);
  menu.value = false;
};

const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

// Fonction pour sauvegarder une parcelle
const saveParcelle = async () => {
  if (formData.value.name && formData.value.size) {
    const formattedDate = formData.value.date ? formData.value.date.toISOString() : null;
    lastSavedParcelle.value = {
      ...formData.value,
      date: formattedDate,
    };

    try {
      let response;
      if (isEditMode.value) {
        // Mettre à jour une parcelle existante
        response = await axios.put(`http://localhost:3001/parcelles/${formData.value.id}`, lastSavedParcelle.value);
        const index = parcelles.value.findIndex(p => p.id === formData.value.id);
        if (index !== -1) {
          parcelles.value[index] = response.data;
        }
      } else {
        // Créer une nouvelle parcelle
        response = await axios.post(`http://localhost:3001/parcelles/${user.value.id}`, lastSavedParcelle.value);
        parcelles.value.push(response.data);
      }

      successDialog.value = true;
      dialogPost.value = false;
      fetchParcelles(user.value.id); // Rafraîchir la liste des parcelles
    } catch (error) {
      console.error("Erreur lors de la sauvegarde de la parcelle :", error);
    }
  } else {
    console.error("Nom et taille sont obligatoires.");
  }
};

// Fonction pour confirmer la suppression
const confirmDeleteParcelle = (item) => {
  formData.value = { ...item };
  confirmDeleteDialog.value = true;
};

// Supprimer une parcelle
const deleteParcelle = async () => {
  try {
    await axios.delete(`http://localhost:3001/parcelles/${formData.value.id}`);
    parcelles.value = parcelles.value.filter(p => p.id !== formData.value.id);
    confirmDeleteDialog.value = false;
    successDialog.value = true;
    fetchParcelles(user.value.id); // Rafraîchir la liste des parcelles
  } catch (error) {
    console.error("Erreur lors de la suppression de la parcelle :", error);
  }
};

// Annuler la suppression
const cancelDelete = () => {
  confirmDeleteDialog.value = false;
};

// Réinitialiser le formulaire
const resetForm = () => {
  formData.value = {
    id: null,
    name: '',
    size: '',
    date: null,
  };
  formattedDate.value = '';
};

// Annuler l'ajout ou la modification
const cancelParcelle = () => {
  dialogPost.value = false;
};

// Fonction pour afficher l'historique des cultures
const viewHistory = async (item) => {
  selectedParcelleId.value = item.id;
  try {
    const response = await axios.get(`http://localhost:3001/parcelles/${item.id}/cultures`);
    cultures.value = response.data;
  } catch (error) {
    console.error("Erreur lors de la récupération des cultures :", error);
    cultures.value = [];
  }
  dialogHistory.value = true;
};

// Fermer le dialogue de l'historique
const closeHistory = () => {
  dialogHistory.value = false;
};

</script>

<style scoped>
/* Ajoutez des styles personnalisés ici si nécessaire */
.par {
  
}
</style>
