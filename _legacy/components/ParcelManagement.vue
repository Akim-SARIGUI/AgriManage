<template>
  <div class="parcelle-management">
    <!-- Section pour afficher les parcelles -->
    <v-row justify="center">
      <v-col cols="12" md="10" lg="10">
        <v-card class="mt-4 elevation-10 parcelle-card">
          <v-card-title class="headline primary white--text">
            Gestion des Parcelles
          </v-card-title>
          <v-card-text>
            <template v-if="parcelles.length > 0">
              <v-data-table :items="parcelles" :headers="headers" item-key="id" class="elevation-1 par">
                <template v-slot:item.size="{ item }">
                  <span>{{ item.size }} ha</span>
                </template>
                <template v-slot:item.actions="{ item }">
                  <v-btn small @click="editParcelle(item)" class="mr-2" fab dark color="secondary">
                    <v-icon>mdi-pencil</v-icon>
                  </v-btn>
                  <v-btn small color="error" @click="confirmDeleteParcelle(item)" class="mr-2" fab dark>
                    <v-icon>mdi-delete</v-icon>
                  </v-btn>
                  <v-btn small @click="viewHistory(item)" fab dark color="info">
                    <v-icon>mdi-history</v-icon>
                  </v-btn>
                </template>
              </v-data-table>
            </template>
            <template v-else>
              <p class="text-center grey--text nopar">Pas de parcelle</p>
            </template>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn @click="openCreateDialog" color="primary" class="elevation-2">
              <v-icon left>mdi-plus</v-icon>
              Ajouter une Parcelle
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- Dialogue pour créer/modifier une parcelle -->
    <v-dialog v-model="dialogPost" persistent max-width="600px">
      <v-card>
        <v-card-title class="headline primary white--text">
          {{ isEditMode ? 'Modifier Parcelle' : 'Créer Parcelle' }}
        </v-card-title>
        <v-card-text>
          <v-form ref="formRef" class="px-3">
            <v-text-field v-model="formData.name" label="Nom de la Parcelle" required outlined></v-text-field>
            <v-text-field v-model="formData.size" label="Taille (en hectares)" required outlined></v-text-field>
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="formattedDate"
                  label="Sélectionner une date"
                  prepend-icon="mdi-calendar"
                  readonly
                  outlined
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
          <v-btn color="primary" text @click="saveParcelle">Enregistrer</v-btn>
          <v-btn color="error" text @click="cancelParcelle">Annuler</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialogue pour confirmer la suppression d'une parcelle -->
    <v-dialog v-model="confirmDeleteDialog" max-width="500px">
      <v-card>
        <v-card-title class="headline error white--text">
          Confirmer la Suppression
        </v-card-title>
        <v-card-text>
          <p>Êtes-vous sûr de vouloir supprimer cette parcelle ?</p>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" text @click="deleteParcelle">Confirmer</v-btn>
          <v-btn color="error" text @click="cancelDelete">Annuler</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialogue pour afficher l'historique des cultures -->
    <v-dialog v-model="dialogHistory" max-width="800px">
      <v-card>
        <v-card-title class="headline primary white--text">
          Historique des Cultures
        </v-card-title>
        <v-card-text>
          <template v-if="cultures.length > 0">
            <v-data-table :items="cultures" :headers="historyHeaders" item-key="id" class="elevation-1">
              <template v-slot:item.planting_date="{ item }">
                <span>{{ formatDate(item.planting_date) }}</span>
              </template>
              <template v-slot:item.harvest_date="{ item }">
                <span>{{ formatDate(item.harvest_date) }}</span>
              </template>
            </v-data-table>
          </template>
          <template v-else>
            <p class="text-center grey--text">Pas de culture</p>
          </template>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="error" text @click="closeHistory">Fermer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialogue pour afficher les erreurs de validation -->
    <v-dialog v-model="errorDialog" max-width="500px">
      <v-card>
        <v-card-title class="headline error white--text">
          Erreur de Validation
        </v-card-title>
        <v-card-text>
          <p>{{ errorMessage }}</p>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" text @click="errorDialog = false">Fermer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialogue pour confirmer l'ajout d'une parcelle -->
    <v-dialog v-model="successAddDialog" max-width="500px">
      <v-card>
        <v-card-title class="headline success white--text">
          Succès
        </v-card-title>
        <v-card-text>
          <p>La parcelle a été ajoutée avec succès !</p>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" text @click="successAddDialog = false">Fermer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialogue pour confirmer la modification d'une parcelle -->
    <v-dialog v-model="successEditDialog" max-width="500px">
      <v-card>
        <v-card-title class="headline success white--text">
          Succès
        </v-card-title>
        <v-card-text>
          <p>La parcelle a été modifiée avec succès !</p>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" text @click="successEditDialog = false">Fermer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialogue pour confirmer la suppression d'une parcelle -->
    <v-dialog v-model="successDeleteDialog" max-width="500px">
      <v-card>
        <v-card-title class="headline success white--text">
          Succès
        </v-card-title>
        <v-card-text>
          <p>La parcelle a été supprimée avec succès !</p>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" text @click="successDeleteDialog = false">Fermer</v-btn>
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
const isEditMode = ref(false);
const dialogHistory = ref(false);
const errorDialog = ref(false);
const errorMessage = ref('');
const successAddDialog = ref(false); // Dialogue pour l'ajout réussi
const successEditDialog = ref(false); // Dialogue pour la modification réussie
const successDeleteDialog = ref(false); // Dialogue pour la suppression réussie

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
const cultures = ref([]);
const selectedParcelleId = ref(null);

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
  // Validation des champs
  if (!formData.value.name || !formData.value.size || !formData.value.date) {
    errorMessage.value = "Veuillez remplir tous les champs obligatoires.";
    errorDialog.value = true;
    return;
  }

  // Validation de la taille (doit être un nombre positif)
  if (isNaN(formData.value.size)) {
    errorMessage.value = "La taille doit être un nombre valide.";
    errorDialog.value = true;
    return;
  }

  if (parseFloat(formData.value.size) <= 0) {
    errorMessage.value = "La taille doit être supérieure à 0.";
    errorDialog.value = true;
    return;
  }

  // Si tout est valide, procéder à la sauvegarde
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
      successEditDialog.value = true; // Afficher le dialogue de modification réussie
    } else {
      // Créer une nouvelle parcelle
      response = await axios.post(`http://localhost:3001/parcelles/${user.value.id}`, lastSavedParcelle.value);
      parcelles.value.push(response.data);
      successAddDialog.value = true; // Afficher le dialogue d'ajout réussi
    }

    dialogPost.value = false;
    fetchParcelles(user.value.id); // Rafraîchir la liste des parcelles
  } catch (error) {
    console.error("Erreur lors de la sauvegarde de la parcelle :", error);
    errorMessage.value = "Une erreur s'est produite lors de la sauvegarde de la parcelle.";
    errorDialog.value = true;
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
    successDeleteDialog.value = true; // Afficher le dialogue de suppression réussie
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
.parcelle-management {
  background-color: #f5f5f5;
  padding: 20px;
}

.parcelle-card {
  border-radius: 15px;
  background-color: #ffffff;
}

.headline {
  padding: 20px;
  border-radius: 15px 15px 0 0;
  background-color: #1b5e20;
  color: #ffffff;
  font-size: 1.7em;
}

.v-card__actions {
  padding: 16px;
  background-color: #f5f5f5;
}

.v-btn.primary {
  background-color: #388e3c !important;
  color: #ffffff !important;
}

.v-btn.secondary {
  background-color: #4caf50 !important;
  color: #ffffff !important;
}

.v-btn.error {
  background-color: #d32f2f !important;
  color: #ffffff !important;
}
.par {
  font-size: 1.2em;
} 
.nopar {
  font-size: 2em;
}
.v-text-field {
  margin-bottom: 15px;
}

.v-dialog {
  border-radius: 15px;
}

.v-menu {
  z-index: 1000;
}

.grey--text {
  color: #9E9E9E;
}

/* Effets de survol */
.v-btn.primary:hover {
  background-color: #2e7d32 !important;
}

.v-btn.secondary:hover {
  background-color: #4caf50 !important;
}

.v-btn.error:hover {
  background-color: #b71c1c !important;
}
</style>