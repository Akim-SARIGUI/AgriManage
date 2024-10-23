<template>
  <v-app>
    <v-container class="py-5">
      <!-- Section des Revenus -->
      <v-card class="mb-5 elevation-2">
        <v-card-title>
          <v-icon>mdi-cash</v-icon>
          <span class="title ml-2">Revenus</span>
        </v-card-title>
        <v-card-text class="mt-4" >
           <v-form ref="revenuForm" v-model="revenuFormValid">
    <v-row>
      <v-col cols="12" md="4">
        <v-text-field
          label="Montant"
          v-model="revenuMontant"
          type="number"
          :rules="[rules.required]"
          required
        ></v-text-field>
      </v-col>
      <v-col cols="12" md="4">
        <v-text-field
          label="Source"
          v-model="revenuSource"
          :rules="[rules.required]"
          required
        ></v-text-field>
      </v-col>
      <v-col cols="12" md="4">
        <v-text-field
          label="Date"
          v-model="revenuDate"
          type="date"
          :rules="[rules.required]"
          required
        ></v-text-field>
      </v-col>
    </v-row>
    <v-btn color="primary" @click="addRevenu">Ajouter Revenu</v-btn>
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

      <!-- Section des Dépenses -->
      <v-card class="mb-5 elevation-2">
        <v-card-title>
          <v-icon>mdi-cash-minus</v-icon>
          <span class="title ml-2">Dépenses</span>
        </v-card-title>
        <v-card-text  class="mt-4">
          <v-form ref="depenseForm" v-model="depenseFormValid">
            <v-row>
              <v-col cols="12" md="4">
                <v-text-field
                  label="Montant"
                  v-model="depenseMontant"
                 
                  type="number"
                  required
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field
                  label="Catégorie"
                  v-model="depenseCategorie"
                 
                  required
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field
                  label="Date"
                  v-model="depenseDate"
                  type="date"
                 
                  required
                ></v-text-field>
              </v-col>
            </v-row>
            <v-btn color="primary" @click="addDepense">Ajouter Dépense</v-btn>
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

     <!-- Section Résumé -->
  <v-card class="elevation-2">
    <v-card-title>
      <v-icon>mdi-chart-pie</v-icon>
      <span class="title ml-2">Résumé Financier</span>
    </v-card-title>
    <v-card-text>
      <v-row>
        <v-col cols="12" md="4">
          <v-card class="elevation-1 pa-3" flat>
            <v-card-title  class="mb-4">Total Revenus</v-card-title>
            <v-card-text  class="text-h5">{{ formatCurrency(totalRevenus) }} FCFA</v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" md="4">
          <v-card class="elevation-1 pa-3" flat>
            <v-card-title class="mb-4" >Total Dépenses</v-card-title>
            <v-card-text class="text-h5">{{ formatCurrency(totalDepenses) }} FCFA</v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" md="4">
          <v-card class="elevation-1 pa-3" flat>
            <v-card-title class="mb-4" >Bénéfice Net</v-card-title>
            <v-card-text class="text-h5" :class="{'text-success': netProfit >= 0, 'text-error': netProfit < 0}">
              {{ formatCurrency(netProfit) }} FCFA
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
      <!-- Confirmation Dialog -->
      <v-dialog v-model="dialog" max-width="490">
        <v-card>
          <v-card-title class="headline">Confirmation</v-card-title>
          <v-card-text>
            Êtes-vous sûr de vouloir supprimer cet élément ?
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn text @click="dialog = false">Annuler</v-btn>
            <v-btn text color="red" @click="deleteItemFunc">Supprimer</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-container>
  </v-app>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';
import { validate as validateUUID } from 'uuid'

const router = useRouter()
const userId = ref(null)


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
// Drapeau pour afficher les erreurs
const showErrors = ref(false);
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
const dialog = ref(false);
const deleteItem = ref(null);
const itemType = ref('');

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

// Définir les règles de validation
const rules = {
  required: value => !!value || 'Ce champ est requis.',
};

const formattedDepenses = computed(() => {
  return depenses.value.map(item => ({
    ...item,
    date: formatDate(item.date)
  }));
});

const fetchRevenus = async () => {
  try {
    const token = localStorage.getItem('authToken')

    if (!token) {
      router.push('/users/connexion')
      return
    }

    const response = await axios.get('http://localhost:3001/api/user-profile', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    const userIdFromServer = response.data.id

    // Vérification et conversion en UUID valide
    if (!validateUUID(userIdFromServer)) {
      console.error("ID utilisateur non valide pour UUID:", userIdFromServer)
      return
    }

    userId.value = userIdFromServer
      
    
    const Revenusresponse = await axios.get(`http://localhost:3001/revenus/${userId.value}`);
    revenus.value = Revenusresponse.data;
  } catch (error) {
    console.error('Error fetching revenues:', error);
  }
};

const fetchDepenses = async () => {
  try {
    const token = localStorage.getItem('authToken')

    if (!token) {
      router.push('/users/connexion')
      return
    }

    const response = await axios.get('http://localhost:3001/api/user-profile', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    const userIdFromServer = response.data.id

    // Vérification et conversion en UUID valide
    if (!validateUUID(userIdFromServer)) {
      console.error("ID utilisateur non valide pour UUID:", userIdFromServer)
      return
    }

    userId.value = userIdFromServer
    const Depenseresponse = await axios.get(`http://localhost:3001/depenses/${userId.value}`);
    depenses.value = Depenseresponse.data;
  } catch (error) {
    console.error('Error fetching expenses:', error);
  }
};

const addRevenu = async () => {
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
    console.error('Error adding/updating revenue:', error);
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
  dialog.value = true;
};

const confirmDeleteDepense = (id) => {
  itemType.value = 'depense';
  deleteItem.value = id;
  dialog.value = true;
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
    dialog.value = false;
  } catch (error) {
    console.error('Error deleting item:', error);
  }
};

const addDepense = async () => {
   showErrors.value = true;
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
    console.error('Error adding/updating expense:', error);
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
.v-card {
  background: #f9f9f9;
}

.v-card-title {
  background: #00796b;
  color: white;
}

.v-data-table th,
.v-data-table td {
  text-align: center;
}

.v-btn {
  margin-top: 10px;
}

.text-success {
  color: green;
}

.text-error {
  color: red;
}

.pa-3 {
  padding: 16px !important;
}
</style>
