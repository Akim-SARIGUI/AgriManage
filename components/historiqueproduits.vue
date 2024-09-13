<template>
  <div>
    <!-- Tableau pour le niveau "Ajouter" -->
    <v-card class="rounded-lg shadow-md pa-6 mb-6">
      <v-card-title class="text-h5 font-weight-bold text-success">
        Historique des Stocks - Ajouter
      </v-card-title>
      <v-data-table
        :headers="headers"
        :items="historiqueAjouter"
        item-key="id"
        class="elevation-1"
      >
        <template v-slot:item.niveau="{ item }">
          <span :class="getNiveauClass(item.niveau)">
            {{ item.niveau }}
          </span>
        </template>
         <template v-slot:item.name="{ item }">
          <span :class="getNiveauClass(item.name)">
            {{ item.name }}
          </span>
        </template>
        <template v-slot:item.date="{ item }">
          <v-text>{{ new Date(item.date).toLocaleDateString() }}</v-text>
        </template>
        <template v-slot:item.updated_at="{ item }">
          <v-text>{{ new Date(item.updated_at).toLocaleDateString() }}</v-text>
        </template>
      </v-data-table>
    </v-card>

    <!-- Tableau pour le niveau "Entrer" -->
    <v-card class="rounded-lg shadow-md pa-6 mb-6">
      <v-card-title class="text-h5 font-weight-bold text-primary">
        Historique des Stocks - Entrer
      </v-card-title>
      <v-data-table
        :headers="headers"
        :items="historiqueEntrer"
        item-key="id"
        class="elevation-1"
      >
        <template v-slot:item.niveau="{ item }">
          <span :class="getNiveauClass(item.niveau)">
            {{ item.niveau }}
          </span>
        </template>
        <template v-slot:item.date="{ item }">
          <v-text>{{ new Date(item.date).toLocaleDateString() }}</v-text>
        </template>
        <template v-slot:item.updated_at="{ item }">
          <v-text>{{ new Date(item.updated_at).toLocaleDateString() }}</v-text>
        </template>
      </v-data-table>
    </v-card>

    <!-- Tableau pour le niveau "Sortie" -->
    <v-card class="rounded-lg shadow-md pa-6 mb-6">
      <v-card-title class="text-h5 font-weight-bold text-danger">
        Historique des Stocks - Sortie
      </v-card-title>
      <v-data-table
        :headers="headers"
        :items="historiqueSortie"
        item-key="id"
        class="elevation-1"
      >
        <template v-slot:item.niveau="{ item }">
          <span :class="getNiveauClass(item.niveau)">
            {{ item.niveau }}
          </span>
        </template>
        <template v-slot:item.date="{ item }">
          <v-text>{{ new Date(item.date).toLocaleDateString() }}</v-text>
        </template>
        <template v-slot:item.updated_at="{ item }">
          <v-text>{{ new Date(item.updated_at).toLocaleDateString() }}</v-text>
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useFetch } from '#app';
import { validate as validateUUID } from 'uuid'
import axios from 'axios'

const router = useRouter()
const userId = ref(null)

// En-têtes du tableau
const headers = [
  
 
  { text: 'Name', value: 'name' },
  { text: 'Quantité', value: 'quantity' },
  { text: 'Unité', value: 'unit' },
  { text: 'Date', value: 'date' },
  { text: 'Dernière Mise à Jour', value: 'updated_at' }
];

// Données de l'historique
const historique = ref([]);
const historiqueAjouter = ref([]);
const historiqueEntrer = ref([]);
const historiqueSortie = ref([]);

// Fonction pour récupérer les données de l'historique
const fetchHistorique = async () => {
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

    const { data } = await useFetch(`http://localhost:3001/api/historique/produits/${userId.value}`);
    historique.value = data.value;
    filterHistorique(); // Filtrer les données après la récupération
  } catch (error) {
    console.error('Erreur lors de la récupération des données :', error);
  }
};

// Fonction pour filtrer les données de l'historique
const filterHistorique = () => {
  historiqueAjouter.value = historique.value.filter(item => item.niveau === 'ajouter');
  historiqueEntrer.value = historique.value.filter(item => item.niveau === 'entrer');
  historiqueSortie.value = historique.value.filter(item => item.niveau === 'sortie');
};

// Fonction pour obtenir la classe CSS basée sur le niveau
const getNiveauClass = (niveau) => {
  switch (niveau) {
    case 'ajouter':
      return 'niveau-ajouter';
    case 'entrer':
      return 'niveau-entrer';
    case 'sortie':
      return 'niveau-sortie';
    default:
      return '';
  }
};

// Charger les données au montage du composant
onMounted(() => {
  fetchHistorique();
});
</script>

<style scoped>
/* Styles pour les différentes valeurs du niveau */
.niveau-ajouter {
  color: green; /* Couleur pour 'ajouter' */
}

.niveau-entrer {
  color: blue; /* Couleur pour 'entrer' */
}

.niveau-sortie {
  color: red; /* Couleur pour 'sortie' */
}
</style>
