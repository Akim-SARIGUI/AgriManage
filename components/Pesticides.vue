<template>
  <v-card class="rounded-lg shadow-md pa-6 mb-6">
    <v-card-title class="text-h5 font-weight-bold text-warning">
      Gestion des Pesticides
    </v-card-title>

    <!-- Recherche de pesticides -->
    <v-text-field
      v-model="search"
      label="Rechercher un pesticide"
      append-icon="mdi-magnify"
      class="mb-4"
    ></v-text-field>

    <!-- Tableau des pesticides -->
    <v-data-table
      :headers="headers"
      :items="filteredPesticides"
      item-key="id"
      class="elevation-1"
    >
      <template v-slot:item.actions="{ item }">
        <v-btn 
          @click="selectPesticide(item)" 
          class="mr-2" 
          :title="'Modifier ' + item.name"
          color="primary"
        >
          <v-icon>mdi-pencil</v-icon>Modifier
        </v-btn>

        <v-btn 
          @click="confirmDelete(item.id)" 
          color="error"  
          class="mr-2" 
          :title="'Supprimer ' + item.name"
        >
          <v-icon>mdi-delete</v-icon>Supprimer
        </v-btn>

        <v-btn 
          @click="handleEntry(item)" 
          color="green"
          class="mr-2" 
          :title="'Ajouter ' + item.name"
        >
          <v-icon>mdi-plus</v-icon> Entrer
        </v-btn>

        <v-btn 
          @click="handleExit(item)" 
          color="blue"
          class="mr-2" 
          :title="'Retirer ' + item.name"
        >
          <v-icon>mdi-minus</v-icon> Sortie
        </v-btn>
      </template>

      <template v-slot:no-data>
        <v-alert type="info" class="mt-4">
          Aucun pesticide en stock
        </v-alert>
      </template>
    </v-data-table>

    <!-- Formulaire pour ajouter ou modifier un pesticide -->
    <v-form @submit.prevent="savePesticide">
      <v-text-field
        v-model="newPesticide.name"
        label="Nom du Pesticide"
        outlined
        required
      ></v-text-field>

      <v-text-field
        v-model.number="newPesticide.quantity"
        label="Quantité"
        type="number"
        min="0"
        outlined
        required
      ></v-text-field>
      
      <v-text-field
        v-model="newPesticide.unit"
        label="Unité de Mesure"
        outlined
        required
      ></v-text-field>
      <div class="d-flex justify-space-between">
      <v-btn type="submit" color="green">{{ selectedPesticideId ? 'Modifier' : 'Ajouter' }}</v-btn>
      <v-btn @click="clearForm" color="error">Annuler</v-btn></div>
    </v-form>

    <!-- Alertes -->
    <v-alert v-if="alerts.pesticideExists" type="error" outlined class="mt-4">
      Ce pesticide existe déjà !
    </v-alert>
    <v-alert v-if="alerts.invalidName" type="error" outlined class="mt-4">
      Nom de pesticide invalide ! Veuillez entrer un nom valide.
    </v-alert>
    <v-alert v-if="alerts.invalidQuantity" type="error" outlined class="mt-4">
      Quantité invalide ! Veuillez entrer une quantité supérieure à zéro.
    </v-alert>
    <v-alert v-if="alerts.successMessage" type="success" outlined class="mt-4">
      Pesticide sauvegardé avec succès !
    </v-alert>
  </v-card>
</template>

<script setup>
import { ref, computed } from 'vue';
import axios from 'axios';
import { validate as validateUUID } from 'uuid'

const router = useRouter()
const userId = ref(null)
// Données réactives
const search = ref('');
const newPesticide = ref({ name: '', quantity: 0, unit: '' });
const selectedPesticideId = ref(null);
const pesticides = ref([]);
const alerts = ref({
  pesticideExists: false,
  invalidName: false,
  invalidQuantity: false,
  successMessage: false,
});

// Entêtes du tableau
const headers = [
  { text: 'Nom', value: 'name' },
  { text: 'Quantité', value: 'quantity' },
  { text: 'Unité', value: 'unit' },
  { text: 'Actions', value: 'actions', sortable: false }
];

// Méthodes
const selectPesticide = (pesticide) => {
  newPesticide.value = { ...pesticide };
  selectedPesticideId.value = pesticide.id;
};

const confirmDelete = (id) => {
  if (confirm('Êtes-vous sûr de vouloir supprimer cet élément ?')) {
    deletePesticide(id);
  }
};

const deletePesticide = async (id) => {
  try {
    await axios.delete(`http://localhost:3001/api/pesticides/${id}`);
    loadPesticides(); // Recharge les données après suppression
  } catch (error) {
    console.error('Erreur lors de la suppression du pesticide:', error);
  }
};

function formatDate(dateString) {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

const savePesticide = async () => {
  if (newPesticide.value.name === '') {
    alerts.value.invalidName = true;
    return;
  } else if (newPesticide.value.quantity <= 0) {
    alerts.value.invalidQuantity = true;
    return;
  }

  try {
     newPesticide.value.user_id = userId.value
    if (selectedPesticideId.value) {
      // Mise à jour du pesticide existant
      await axios.put(`http://localhost:3001/api/pesticides/${selectedPesticideId.value}`, newPesticide.value);
     
    } else {
      // Création d'un nouveau pesticide
      await axios.post('http://localhost:3001/api/pesticides', newPesticide.value);
      await axios.post('http://localhost:3001/historique', {
        user_id: userId.value,
        type: 'pesticides',
        name: newPesticide.value.name,
        quantity: newPesticide.value.quantity,
        unit: newPesticide.value.unit,
        niveau: 'ajouter',
        date: formatDate(new Date()), // Format de la date modifié
      });
    }

    alerts.value.successMessage = true;
    clearForm();
    loadPesticides(); // Recharge les données après sauvegarde
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du pesticide:', error);
  }
};

const handleEntry = async (pesticide) => {
  // Get quantity from user input and parse it as an integer
  const quantity = parseInt(prompt('Entrer la quantité à ajouter :', 0), 10);

  // Check if the entered quantity is valid
  if (quantity > 0) {
    // Ensure pesticide.quantity is treated as a number
    const currentQuantity = parseInt(pesticide.quantity, 10);

    // Update the quantity of the pesticide
    pesticide.quantity = currentQuantity + quantity;

    try {
      // Update the pesticide data on the server
      await axios.put(`http://localhost:3001/api/pesticides/${pesticide.id}`, pesticide);

      // Log the entry in the historique
      await axios.post('http://localhost:3001/historique', {
        type: 'pesticides',
        name: pesticide.name,
        quantity,
        unit: pesticide.unit,
        niveau: 'entrer',
        date: formatDate(new Date()) // Ensure formatDate function formats the date correctly
      });

      // Reload the pesticide data
      loadPesticides();
    } catch (error) {
      // Log any errors that occur
      console.error("Erreur lors de l'entrée du pesticide:", error);
    }
  } else {
    // Notify the user if the quantity is invalid
    alert('Quantité invalide !');
  }
};



const handleExit = async (pesticide) => {
  const quantity = parseInt(prompt('Entrer la quantité à retirer :', 0));
  if (quantity > 0 && quantity <= pesticide.quantity) {
    pesticide.quantity -= quantity;
    try {
      await axios.put(`http://localhost:3001/api/pesticides/${pesticide.id}`, pesticide);
      await axios.post('http://localhost:3001/historique', {
        type: 'pesticides',
        name: pesticide.name,
        quantity,
        unit: pesticide.unit,
        niveau: 'sortie',
        date: new Date()
      });
      loadPesticides(); // Recharge les données après mise à jour
    } catch (error) {
      console.error("Erreur lors de la sortie du pesticide:", error);
    }
  } else {
    alert('Quantité invalide ou insuffisante !');
  }
};


const clearForm = () => {
  newPesticide.value = { name: '', quantity: 0, unit: '' };
  selectedPesticideId.value = null;
  alerts.value = {
    pesticideExists: false,
    invalidName: false,
    invalidQuantity: false,
    successMessage: false
  };
};

// Chargement des pesticides depuis l'API
const loadPesticides = async () => {
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
    const Pesticideresponse = await axios.get(`http://localhost:3001/api/pesticides/${userId.value}`);
    pesticides.value = Pesticideresponse.data;
  } catch (error) {
    console.error('Erreur lors du chargement des pesticides:', error);
  }
};

// Trie les pesticides par date de dernière modification (les plus récents en premier)
const filteredPesticides = computed(() => {
  return pesticides.value
    .filter(p => p.name.toLowerCase().includes(search.value.toLowerCase()))
    .sort((a, b) => new Date(b.lastModifiedDate) - new Date(a.lastModifiedDate));
});

// Charge les pesticides au montage du composant
loadPesticides();
</script>

<style scoped>
.v-data-table {
  max-height: 500px; /* Ajustez la hauteur selon vos besoins */
  overflow-y: auto;
}
</style>
