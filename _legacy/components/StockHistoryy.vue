<template>
  <div>
    <p v-if="loading">Chargement des données...</p>
    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>

    <!-- Tableau pour le niveau "Entrer" -->
    <v-card class="rounded-lg shadow-md pa-6 mb-6">
      <v-card-title class="text-h5 font-weight-bold text-primary">
        Historique des Stocks - Entrer
      </v-card-title>
      <v-data-table :headers="headers" :items="historiqueEntrer" item-key="id" class="elevation-1">
        <template v-slot:item.niveau="{ item }">
          <span :class="getNiveauClass(item.niveau)">{{ item.niveau }}</span>
        </template>
        <template v-slot:item.date="{ item }">
          <span>{{ formatDate(item.date) }}</span>
        </template>
        <template v-slot:item.updated_at="{ item }">
          <span>{{ formatDate(item.updated_at) }}</span>
        </template>
      </v-data-table>
    </v-card>

    <!-- Tableau pour le niveau "Sortie" -->
    <v-card class="rounded-lg shadow-md pa-6 mb-6">
      <v-card-title class="text-h5 font-weight-bold text-danger">
        Historique des Stocks - Sortie
      </v-card-title>
      <v-data-table :headers="headers" :items="historiqueSortie" item-key="id" class="elevation-1">
        <template v-slot:item.niveau="{ item }">
          <span :class="getNiveauClass(item.niveau)">{{ item.niveau }}</span>
        </template>
        <template v-slot:item.date="{ item }">
          <span>{{ formatDate(item.date) }}</span>
        </template>
        <template v-slot:item.updated_at="{ item }">
          <span>{{ formatDate(item.updated_at) }}</span>
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { validate as validateUUID } from 'uuid';

const router = useRouter();
const userId = ref(null);
const loading = ref(false);
const errorMessage = ref(null);

// En-têtes du tableau
const headers = [
  { text: 'Type', value: 'type' },
  { text: 'Nom', value: 'name' },
  { text: 'Quantité', value: 'quantity' },
  { text: 'Unité', value: 'unit' },
  { text: 'Date', value: 'date' },
  { text: 'Niveau', value: 'niveau' },
];

// Données de l'historique
const historique = ref([]);
const historiqueEntrer = ref([]);
const historiqueSortie = ref([]);

// Fonction pour récupérer les données de l'historique
const fetchHistorique = async () => {
  loading.value = true;
  errorMessage.value = null;

  try {
    const token = localStorage.getItem('authToken');

    if (!token) {
      router.push('/users/connexion');
      return;
    }

    // Récupération de l'ID utilisateur
    const userResponse = await axios.get('http://localhost:3001/api/user-profile', {
      headers: { Authorization: `Bearer ${token}` }
    });

    const userIdFromServer = userResponse.data.id;

    if (!validateUUID(userIdFromServer)) {
      throw new Error("ID utilisateur invalide");
    }

    userId.value = userIdFromServer;

    // Récupération des données de l'historique
    const response = await axios.get(`http://localhost:3001/api/historique/${userId.value}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    // Vérifier que la réponse est un objet avec les propriétés attendues
    if (!response.data || !response.data.historiqueEntrerAjouter || !response.data.historiqueSortie) {
      throw new Error("La structure des données de l'historique est invalide.");
    }

    // Assigner les données à historique.value
    historique.value = response.data;

    // Filtrer les entrées et sorties
    filterHistorique();
  } catch (error) {
    console.error("Erreur :", error);
    errorMessage.value = error.message || "Une erreur est survenue";
  } finally {
    loading.value = false;
  }
};

// Fonction pour filtrer les données de l'historique
const filterHistorique = () => {
  historiqueEntrer.value = historique.value.historiqueEntrerAjouter.filter(item => {
    const typeValide = item.type === 'semences' || item.type === 'fertilisants' || item.type === 'pesticides';
    const niveauNormalise = item.niveau.trim().toLowerCase(); // Normalisation
    const niveauValide = niveauNormalise === 'ajouter' || niveauNormalise === 'modifier' || niveauNormalise === 'entrer';
    return typeValide && niveauValide;
  });

  historiqueSortie.value = historique.value.historiqueSortie.filter(item =>
    item.type === 'semences' || item.type === 'fertilisants' || item.type === 'pesticides'
  );

  // Debug : Afficher les données filtrées
  console.log("Historique Entrer :", historiqueEntrer.value);
  console.log("Historique Sortie :", historiqueSortie.value);
};

// Fonction pour obtenir la classe CSS basée sur le niveau
const getNiveauClass = (niveau) => {
  switch (niveau.trim().toLowerCase()) {
    case 'ajouter':
    case 'entrer':
    case 'modifier':
      return 'niveau-entrer';
    case 'sortie':
      return 'niveau-sortie';
    default:
      return '';
  }
};

// Fonction pour formater la date
const formatDate = (date) => {
  return date ? new Date(date).toLocaleDateString() : 'N/A';
};

// Charger les données au montage du composant
onMounted(() => {
  fetchHistorique();
});
</script>

<style scoped>
.niveau-entrer {
  color: blue;
  font-weight: bold;
}

.niveau-sortie {
  color: red;
  font-weight: bold;
}

.error {
  color: red;
  font-weight: bold;
}
</style>