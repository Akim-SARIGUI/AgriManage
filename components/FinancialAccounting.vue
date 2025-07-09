<template>
  <v-app>
    <v-container class="py-5">
      <!-- Section Revenus -->
      <v-card class="mb-5 elevation-2">
        <v-card-title>
          <v-icon>mdi-cash</v-icon>
          <span class="title ml-2">Revenus</span>
        </v-card-title>
        <v-card-text>
          <v-form ref="revenuForm" v-model="revenuFormValid">
            <v-row>
              <v-col cols="12" md="4">
                <v-text-field
                  label="Montant"
                  v-model="revenuMontant"
                  type="number"
                  :rules="[rules.required]"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field
                  label="Source"
                  v-model="revenuSource"
                  :rules="[rules.required]"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field
                  label="Date"
                  v-model="revenuDate"
                  type="date"
                  :rules="[rules.required]"
                ></v-text-field>
              </v-col>
            </v-row>
            <v-btn color="primary" class="mt-3" @click="addRevenu">Ajouter Revenu</v-btn>
          </v-form>
        </v-card-text>
        <v-data-table
          :headers="revenuHeaders"
          :items="formattedRevenus"
          item-key="id"
          class="elevation-1 mt-4"
        >
          <template v-slot:item.actions="{ item }">
            <v-icon small @click="editRevenu(item)">mdi-pencil</v-icon>
            <v-icon small @click="confirmDeleteRevenu(item.id)">mdi-delete</v-icon>
          </template>
        </v-data-table>
      </v-card>

      <!-- Section Dépenses -->
      <v-card class="mb-5 elevation-2">
        <v-card-title>
          <v-icon>mdi-cash-minus</v-icon>
          <span class="title ml-2">Dépenses</span>
        </v-card-title>
        <v-card-text>
          <v-form ref="depenseForm" v-model="depenseFormValid">
            <v-row>
              <v-col cols="12" md="4">
                <v-text-field
                  label="Montant"
                  v-model="depenseMontant"
                  type="number"
                  :rules="[rules.required]"
                  required
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field
                  label="Catégorie"
                  v-model="depenseCategorie"
                  :rules="[rules.required]"
                  required
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field
                  label="Date"
                  v-model="depenseDate"
                  type="date"
                  :rules="[rules.required]"
                  required
                ></v-text-field>
              </v-col>
            </v-row>
            <v-btn color="primary" class="mt-3" @click="addDepense">Ajouter Dépense</v-btn>
          </v-form>
        </v-card-text>
        <v-data-table
          :headers="depenseHeaders"
          :items="formattedDepenses"
          item-key="id"
          class="elevation-1 mt-4"
        >
          <template v-slot:item.actions="{ item }">
            <v-icon small @click="editDepense(item)">mdi-pencil</v-icon>
            <v-icon small @click="confirmDeleteDepense(item.id)">mdi-delete</v-icon>
          </template>
        </v-data-table>
      </v-card>

      <!-- Résumé Financier -->
      <v-card class="elevation-2">
        <v-card-title>
          <v-icon>mdi-chart-pie</v-icon>
          <span class="title ml-2">Résumé Financier</span>
        </v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="12" md="4">
              <v-card class="elevation-1 pa-3" flat>
                <v-card-title>Total Revenus</v-card-title>
                <v-card-text class="text-h5">{{ formatCurrency(totalRevenus) }} FCFA</v-card-text>
              </v-card>
            </v-col>
            <v-col cols="12" md="4">
              <v-card class="elevation-1 pa-3" flat>
                <v-card-title>Total Dépenses</v-card-title>
                <v-card-text class="text-h5">{{ formatCurrency(totalDepenses) }} FCFA</v-card-text>
              </v-card>
            </v-col>
            <v-col cols="12" md="4">
              <v-card class="elevation-1 pa-3" flat>
                <v-card-title>Bénéfice Net</v-card-title>
                <v-card-text
                  class="text-h5"
                  :class="{'text-success': netProfit >= 0, 'text-error': netProfit < 0}"
                >
                  {{ formatCurrency(netProfit) }} FCFA
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </v-container>

    <!-- Dialog pour afficher les messages d'erreur -->
    <v-dialog v-model="errorDialog" max-width="500">
      <v-card>
        <v-card-title class="text-h5">Erreur</v-card-title>
        <v-card-text>{{ errorMessage }}</v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" @click="errorDialog = false">Fermer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog pour confirmer la suppression -->
    <v-dialog v-model="deleteDialog" max-width="500">
      <v-card>
        <v-card-title class="text-h5">Confirmer la suppression</v-card-title>
        <v-card-text>Êtes-vous sûr de vouloir supprimer cet élément ?</v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" @click="deleteDialog = false">Annuler</v-btn>
          <v-btn color="error" @click="deleteItemFunc">Supprimer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-app>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';
import { validate as validateUUID } from 'uuid';
import { useRouter } from 'vue-router';

const router = useRouter();
const userId = ref(null);

// Variables pour le dialogue d'erreur
const errorDialog = ref(false);
const errorMessage = ref('');

// Variables pour le dialogue de suppression
const deleteDialog = ref(false);
const deleteItem = ref(null);
const itemType = ref('');

// Fonction de formatage de la date
function formatDate(dateString) {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

const revenus = ref([]);
const revenuMontant = ref(0);
const revenuSource = ref('');
const revenuDate = ref('');
const revenuFormValid = ref(false);
const revenuHeaders = [
  { text: 'Source', value: 'source' },
  { text: 'Montant (FCFA)', value: 'montant' },
  { text: 'Date', value: 'date' },
  { text: 'Actions', value: 'actions', sortable: false },
];

const depenses = ref([]);
const depenseMontant = ref(0);
const depenseCategorie = ref('');
const depenseDate = ref('');
const depenseFormValid = ref(false);
const depenseHeaders = [
  { text: 'Catégorie', value: 'categorie' },
  { text: 'Montant (FCFA)', value: 'montant' },
  { text: 'Date', value: 'date' },
  { text: 'Actions', value: 'actions', sortable: false },
];

// Fonction pour formater les nombres en tant que devise avec deux décimales
const formatCurrency = (value) => {
  return value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const editMode = ref(false);
const editIndex = ref(-1);

// Calculer le total des revenus
const totalRevenus = computed(() => 
  revenus.value.reduce((total, item) => total + parseFloat(item.montant), 0)
);

const totalDepenses = computed(() => 
  depenses.value.reduce((total, item) => total + parseFloat(item.montant), 0)
);

const netProfit = computed(() => totalRevenus.value - totalDepenses.value);

const formattedRevenus = computed(() => {
  return revenus.value.map(item => ({
    ...item,
    date: formatDate(item.date)
  }));
});

const formattedDepenses = computed(() => {
  return depenses.value.map(item => ({
    ...item,
    date: formatDate(item.date)
  }));
});

// Définir les règles de validation
const rules = {
  required: value => !!value || 'Ce champ est requis.',
};

const fetchRevenus = async () => {
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

    const userIdFromServer = response.data.id;

    // Vérification et conversion en UUID valide
    if (!validateUUID(userIdFromServer)) {
      console.error("ID utilisateur non valide pour UUID:", userIdFromServer);
      return;
    }

    userId.value = userIdFromServer;
      
    const Revenusresponse = await axios.get(`http://localhost:3001/revenus/${userId.value}`);
    revenus.value = Revenusresponse.data;
  } catch (error) {
    errorMessage.value = 'Erreur lors de la récupération des revenus: ' + error.message;
    errorDialog.value = true;
  }
};

const fetchDepenses = async () => {
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

    const userIdFromServer = response.data.id;

    // Vérification et conversion en UUID valide
    if (!validateUUID(userIdFromServer)) {
      console.error("ID utilisateur non valide pour UUID:", userIdFromServer);
      return;
    }

    userId.value = userIdFromServer;
    const Depenseresponse = await axios.get(`http://localhost:3001/depenses/${userId.value}`);
    depenses.value = Depenseresponse.data;
  } catch (error) {
    errorMessage.value = 'Erreur lors de la récupération des dépenses: ' + error.message;
    errorDialog.value = true;
  }
};

const addRevenu = async () => {
  if (!revenuFormValid.value) {
    errorMessage.value = 'Veuillez remplir tous les champs requis pour le revenu.';
    errorDialog.value = true;
    return;
  }

  const revenu = {
    source: revenuSource.value,
    montant: parseFloat(revenuMontant.value),
    date: revenuDate.value
  };

  try {
    if (editMode.value) {
      await axios.put(`http://localhost:3001/revenus/${revenus.value[editIndex.value].id}`, revenu);
    } else {
      await axios.post(`http://localhost:3001/revenus/${userId.value}`, revenu);
    }
    resetForm();
    await fetchRevenus();
  } catch (error) {
    errorMessage.value = 'Erreur lors de l\'ajout/mise à jour du revenu: ' + error.message;
    errorDialog.value = true;
  }
};

const editRevenu = (item) => {
  editMode.value = true;
  editIndex.value = revenus.value.findIndex((r) => r.id === item.id);
  revenuMontant.value = item.montant;
  revenuSource.value = item.source;
  revenuDate.value = item.date;
};

const confirmDeleteRevenu = (id) => {
  itemType.value = 'revenu';
  deleteItem.value = id;
  deleteDialog.value = true;
};

const confirmDeleteDepense = (id) => {
  itemType.value = 'depense';
  deleteItem.value = id;
  deleteDialog.value = true;
};

const deleteItemFunc = async () => {
  try {
    if (itemType.value === 'revenu') {
      await axios.delete(`http://localhost:3001/revenus/${deleteItem.value}`);
      await fetchRevenus();
    } else if (itemType.value === 'depense') {
      await axios.delete(`http://localhost:3001/depenses/${deleteItem.value}`);
      await fetchDepenses();
    }
    deleteDialog.value = false; // Fermer le dialogue après la suppression
  } catch (error) {
    errorMessage.value = 'Erreur lors de la suppression: ' + error.message;
    errorDialog.value = true;
  }
};

const addDepense = async () => {
  if (!depenseFormValid.value) {
    errorMessage.value = 'Veuillez remplir tous les champs requis pour la dépense.';
    errorDialog.value = true;
    return;
  }

  const depense = {
    categorie: depenseCategorie.value,
    montant: parseFloat(depenseMontant.value),
    date: depenseDate.value
  };

  try {
    if (editMode.value) {
      await axios.put(`http://localhost:3001/depenses/${depenses.value[editIndex.value].id}`, depense);
    } else {
      await axios.post(`http://localhost:3001/depenses/${userId.value}`, depense);
    }
    resetForm();
    await fetchDepenses();
  } catch (error) {
    errorMessage.value = 'Erreur lors de l\'ajout/mise à jour de la dépense: ' + error.message;
    errorDialog.value = true;
  }
};

const editDepense = (item) => {
  editMode.value = true;
  editIndex.value = depenses.value.findIndex((d) => d.id === item.id);
  depenseMontant.value = item.montant;
  depenseCategorie.value = item.categorie;
  depenseDate.value = item.date;
};

const resetForm = () => {
  revenuMontant.value = '';
  revenuSource.value = '';
  revenuDate.value = '';
  depenseMontant.value = '';
  depenseCategorie.value = '';
  depenseDate.value = '';
  editMode.value = false;
  editIndex.value = -1;
};

onMounted(() => {
  fetchRevenus();
  fetchDepenses();
});
</script>

<style scoped>
/* Carte */
.v-card {
  background: #f4f4f4; /* Couleur de fond plus claire */
  border-radius: 8px; /* Bords arrondis */
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); /* Ombre douce */
  transition: box-shadow 0.3s ease;
}

.v-card:hover {
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2); /* Effet hover */
}

/* Titre de la carte */
.v-card-title {
  background: #1b5e20; /* Couleur de fond vert foncé */
  color: white;
  padding: 16px;
  font-size: 20px;
  font-weight: bold;
  border-radius: 8px 8px 0 0; /* Coins arrondis en haut */
}

/* Tableau */
.v-data-table th,
.v-data-table td {
  text-align: center;
  padding: 10px; /* Espacement pour les cellules */
  font-size: 16px;
}

.v-data-table th {
  background-color: #d1e7dd; /* Couleur de fond des en-têtes */
  font-weight: bold;
  border-bottom: 2px solid #c4e1c1; /* Bordure de séparation */
}

.v-data-table td {
  background-color: #ffffff;
  border-bottom: 1px solid #e0e0e0; /* Bordure entre les lignes */
}

/* Boutons */
.v-btn {
  background-color: #4caf50; /* Couleur verte */
  color: white;
  border-radius: 4px;
  padding: 10px 20px;
  font-size: 14px;
  text-transform: uppercase;
  font-weight: bold;
  transition: background-color 0.3s ease;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); /* Ombre douce sur les boutons */
}

.v-btn:hover {
  background-color: #388e3c; /* Couleur plus sombre au survol */
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15); /* Ombre plus marquée au survol */
}

.v-btn:active {
  background-color: #2c6d29; /* Couleur au clic */
  box-shadow: none;
}

/* Textes de succès et erreur */
.text-success {
  color: #388e3c; /* Vert foncé pour succès */
}

.text-error {
  color: #d32f2f; /* Rouge pour erreur */
}

/* Espacement global */
.pa-3 {
  padding: 24px !important; /* Espacement augmenté */
}

/* Adaptabilité (responsive) */
@media (max-width: 600px) {
  .v-card {
    padding: 12px; /* Réduire l'espacement des cartes sur petits écrans */
  }

  .v-card-title {
    font-size: 16px; /* Réduire la taille de la police pour les titres */
  }

  .v-btn {
    padding: 8px 16px; /* Réduire les dimensions des boutons */
    font-size: 12px;
  }

  .v-data-table td, .v-data-table th {
    font-size: 12px; /* Réduire la taille de la police pour les petites écrans */
  }
}
</style>
