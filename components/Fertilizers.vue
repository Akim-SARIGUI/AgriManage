<template>
  <v-card class="rounded-lg shadow-md pa-6 mb-6">
    <v-card-title class="text-h5 font-weight-bold text-success">
      Gestion des Fertilisants
    </v-card-title>

    <!-- Recherche de fertilisants -->
    <v-text-field
      v-model="search"
      label="Rechercher un fertilisant"
      append-icon="mdi-magnify"
      class="mb-4"
    ></v-text-field>

    <!-- Tableau des fertilisants -->
    <v-data-table
      :headers="headers"
      :items="filteredFertilizers"
      item-key="id"
      class="mb-4"
    >
      <template v-slot:item.actions="{ item }">
        <v-btn class="ml-4" color="primary" @click="selectFertilizer(item)">
          <v-icon>mdi-pencil</v-icon>Modifier
        </v-btn>
        <v-btn class="ml-4" color="error" @click="confirmDelete(item.id)">
          <v-icon>mdi-delete</v-icon>Supprimer
        </v-btn>
        <v-btn class="ml-4" color="success" :title="'Ajouter ' + item.name" @click="handleEntry(item)">
          <v-icon>mdi-plus</v-icon> Entrer
        </v-btn>
        <v-btn class="ml-4" color="blue" :title="'Retirer ' + item.name" @click="handleExit(item)">
          <v-icon>mdi-minus</v-icon>Sortie
        </v-btn>
      </template>
      <template v-slot:no-data>
        <v-alert type="info" :value="true">
          Aucun fertilisant en stock
        </v-alert>
      </template>
    </v-data-table>

    <!-- Formulaire pour ajouter ou modifier un fertilisant -->
    <v-form @submit.prevent="saveFertilizer">
      <v-text-field
        v-model="newFertilizer.name"
        label="Nom du Fertilisant"
        outlined
        required
      ></v-text-field>
      <v-text-field
        v-model.number="newFertilizer.quantity"
        label="Quantité"
        type="number"
        min="0"
        outlined
        required
      ></v-text-field>
      <v-text-field
        v-model="newFertilizer.unit"
        label="Unité de Mesure"
        outlined
        required
      ></v-text-field>
      <div class="d-flex justify-space-between">
        <v-btn type="submit" color="success">{{ selectedFertilizerId ? 'Modifier' : 'Ajouter' }}</v-btn>
        <v-btn @click="clearForm" color="error">Annuler</v-btn>
      </div>
    </v-form>

    <!-- Alertes -->
    <v-alert v-if="alerts.fertilizerExists" type="error" outlined class="mt-4">
      Ce fertilisant existe déjà !
    </v-alert>
    <v-alert v-if="alerts.invalidName" type="error" outlined class="mt-4">
      Nom de fertilisant invalide ! Veuillez entrer un nom valide.
    </v-alert>
    <v-alert v-if="alerts.invalidQuantity" type="error" outlined class="mt-4">
      Quantité invalide ! Veuillez entrer une quantité supérieure à zéro.
    </v-alert>
    <v-alert v-if="alerts.successMessage" type="success" outlined class="mt-4">
      Fertilisant sauvegardé avec succès !
    </v-alert>
  </v-card>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';
import { validate as validateUUID } from 'uuid'

// État local pour gérer les fertilisants
const search = ref('');
const newFertilizer = ref({ name: '', quantity: 0, unit: '' });
const selectedFertilizerId = ref(null);
const alerts = ref({
  fertilizerExists: false,
  invalidName: false,
  invalidQuantity: false,
  successMessage: false,
});

// Charger les fertilisants avec Axios
const fertilizers = ref([]);
const router = useRouter()
const userId = ref(null)

const loadFertilizers = async () => {
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
    console.log("User ID:", userId.value)
    const Fetilizerresponse = await axios.get(`http://localhost:3001/api/fertilizers/${userId.value}`);
    fertilizers.value = Fetilizerresponse.data;
  } catch (error) {
    console.error('Erreur lors du chargement des fertilisants:', error);
  }
};

// Filtrer les fertilisants en fonction de la recherche
const filteredFertilizers = computed(() =>
  fertilizers.value.filter(fertilizer =>
    fertilizer.name.toLowerCase().includes(search.value.toLowerCase())
  )
);

// En-têtes du tableau
const headers = [
  { text: 'Nom', value: 'name' },
  { text: 'Quantité', value: 'quantity' },
  { text: 'Unité', value: 'unit' },
  { text: 'État', value: 'status' },
  { text: 'Actions', value: 'actions', sortable: false }
];

// Sélectionner un fertilisant pour modification
const selectFertilizer = (fertilizer) => {
  newFertilizer.value = { ...fertilizer };
  selectedFertilizerId.value = fertilizer.id;
};

// Confirmer la suppression d'un fertilisant
const confirmDelete = async (id) => {
  if (confirm('Êtes-vous sûr de vouloir supprimer cet élément ?')) {
    try {
      await axios.delete(`http://localhost:3001/api/fertilizers/${id}`);
      loadFertilizers(); // Recharge les données après suppression
    } catch (error) {
      console.error('Erreur lors de la suppression du fertilisant:', error);
    }
  }
};

// Formatage de la date
function formatDate(dateString) {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

// Sauvegarder le fertilisant (ajouter ou modifier)
const saveFertilizer = async () => {
  if (newFertilizer.value.name === '') {
    alerts.value.invalidName = true;
    return;
  } else if (newFertilizer.value.quantity <= 0) {
    alerts.value.invalidQuantity = true;
    return;
  }

  try {
     newFertilizer.value.user_id = userId.value
    if (selectedFertilizerId.value) {
      // Mise à jour du fertilisant existant
      await axios.put(`http://localhost:3001/api/fertilizers/${selectedFertilizerId.value}`, newFertilizer.value);
      const index = fertilizers.value.findIndex(f => f.id === selectedFertilizerId.value);
      if (index !== -1) {
        fertilizers.value[index] = newFertilizer.value; // Mise à jour à l'index
      }
    } else {
      // Création d'un nouveau fertilisant
      const response = await axios.post('http://localhost:3001/api/fertilizers', newFertilizer.value);
      fertilizers.value.unshift(response.data); // Ajout au début du tableau
    }
    await axios.post('http://localhost:3001/historique', {
      user_id: userId.value,
      type: 'fertilisants',
      name: newFertilizer.value.name,
      quantity: newFertilizer.value.quantity,
      unit: newFertilizer.value.unit,
      niveau: selectedFertilizerId.value ? 'modifier' : 'ajouter',
      date: formatDate(new Date())
    });
    clearForm();
    alerts.value.successMessage = true;
    loadFertilizers(); // Recharge les données après sauvegarde
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du fertilisant:', error);
  }
};

// Réinitialiser le formulaire
const clearForm = () => {
  newFertilizer.value = { name: '', quantity: 0, unit: '' };
  selectedFertilizerId.value = null;
  alerts.value = {
    fertilizerExists: false,
    invalidName: false,
    invalidQuantity: false,
    successMessage: false,
  };
};

// Charger les fertilisants au montage du composant
onMounted(() => {
  loadFertilizers();
});

// Gérer l'entrée de fertilisants
const handleEntry = async (fertilizer) => {
  const quantity = parseInt(prompt('Entrer la quantité à ajouter :', 0), 10);
  if (quantity > 0) {
    fertilizer.quantity += quantity; // Mise à jour de la quantité
    await updateFertilizer(fertilizer); // Mise à jour dans le tableau
    await axios.post('http://localhost:3001/historique', {
      type: 'fertilisants',
      name: fertilizer.name,
      quantity,
      unit: fertilizer.unit,
      niveau: 'entrer',
      date: new Date()
    });
  } else {
    alert('Quantité invalide !');
  }
};

// Gérer la sortie de fertilisants
const handleExit = async (fertilizer) => {
  const quantity = parseInt(prompt('Entrer la quantité à retirer :', 0), 10);
  if (quantity > 0 && quantity <= fertilizer.quantity) {
    fertilizer.quantity -= quantity; // Mise à jour de la quantité
    await updateFertilizer(fertilizer); // Mise à jour dans le tableau
    await axios.post('http://localhost:3001/historique', {
      type: 'fertilisants',
      name: fertilizer.name,
      quantity,
      unit: fertilizer.unit,
      niveau: 'sortie',
      date: new Date()
    });
  } else {
    alert('Quantité invalide ou insuffisante !');
  }
};

// Mise à jour d'un fertilisant
const updateFertilizer = async (updatedFertilizer) => {
  try {
    await axios.put(`http://localhost:3001/api/fertilizers/${updatedFertilizer.id}`, updatedFertilizer);
  } catch (error) {
    console.error('Erreur lors de la mise à jour du fertilisant:', error);
  }
};
</script>

<style scoped>
/* Styles pour le tableau et les alertes */
.v-data-table {
  margin-top: 1rem;
}

.v-alert {
  margin-top: 1rem;
}

.v-btn {
  margin-left: 1rem;
}
</style>
