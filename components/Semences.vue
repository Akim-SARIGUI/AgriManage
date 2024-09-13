<template>
  <v-card class="rounded-lg shadow-md pa-6 mb-6 elevation-2">
    <v-card-title class="text-h5 font-weight-bold text-success mb-4">
      Gestion des Semences
    </v-card-title>
    
    <v-text-field 
      v-model="search" 
      label="Rechercher une semence" 
      append-icon="mdi-magnify" 
      outlined 
      dense 
      class="mb-4 rounded elevation-1"
    ></v-text-field>
    
    <!-- Tableau des semences -->
    <v-data-table
      :headers="headers"
      :items="filteredSeeds"
      item-value="name"
      class="elevation-1"
      :search="search"
    >
      <template v-slot:item.actions="{ item }">
        <v-btn class="ml-4" color="primary" @click="selectSeed(item)">
          <v-icon>mdi-pencil</v-icon>Modifier
        </v-btn>
        <v-btn class="ml-4" color="error" @click="confirmDelete(item.id)">
          <v-icon>mdi-delete</v-icon>Supprimer
        </v-btn>
        <v-btn class="ml-4" :title="'Ajouter ' + item.name" color="success" @click="handleEntry(item)">
          <v-icon>mdi-plus</v-icon>Entrer
        </v-btn>
        <v-btn class="ml-4" color="blue" :title="'Retirer ' + item.name" @click="handleExit(item)">
          <v-icon>mdi-minus</v-icon>Sortie
        </v-btn>
      </template>
    </v-data-table>
    
    <v-divider class="my-4"></v-divider>
    
    <!-- Formulaire pour ajouter ou modifier une semence -->
    <v-form @submit.prevent="saveSeed" class="elevation-1 rounded-lg pa-4 mb-4">
      <v-text-field 
        v-model="newSeed.name" 
        label="Nom de la Semence" 
        outlined 
        dense 
        class="mb-3 rounded elevation-1"
        required
      ></v-text-field>
      
      <v-text-field 
        v-model.number="newSeed.quantity" 
        label="Quantité" 
        type="number" 
        min="0" 
        outlined 
        dense 
        class="mb-3 rounded elevation-1"
        required
      ></v-text-field>
      
      <v-text-field 
        v-model="newSeed.unit" 
        label="Unité de Mesure" 
        outlined 
        dense 
        class="mb-3 rounded elevation-1"
        required
      ></v-text-field>
      
      <div class="d-flex justify-space-between">
        <v-btn type="submit" color="success" class="rounded elevation-1">
          {{ selectedSeedId ? 'Modifier' : 'Ajouter' }}
        </v-btn>
        
        <v-btn @click="clearForm" color="error" class="rounded elevation-1">
          Annuler
        </v-btn>
      </div>
    </v-form>

    <!-- Affichage des alertes -->
    <v-alert 
      v-if="alerts.successMessage" 
      type="success" 
      outlined 
      class="mt-4 rounded elevation-1"
    >
      Semence sauvegardée avec succès !
    </v-alert>
  </v-card>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import { validate as validateUUID } from 'uuid'

const search = ref('')
const newSeed = ref({ name: '', quantity: 0, unit: '' })
const selectedSeedId = ref(null)
const seeds = ref([])
const alerts = ref({
  successMessage: false
})

const router = useRouter()
const userId = ref(null)

// Fetching seeds from the server
const loadData = async () => {
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

    const seedsResponse = await axios.get(`http://localhost:3001/api/stocks/seeds/${userId.value}`)
    seeds.value = seedsResponse.data
  } catch (error) {
    console.error("Erreur lors du chargement des semences:", error)
  }
}
onMounted(loadData)

const headers = [
  { text: 'Nom de la Semence', value: 'name' },
  { text: 'Quantité', value: 'quantity' },
  { text: 'Unité', value: 'unit' },
  { text: 'Actions', value: 'actions', sortable: false }
]

const filteredSeeds = computed(() => {
  return seeds.value.filter(seed => seed.name.toLowerCase().includes(search.value.toLowerCase()))
})

const selectSeed = (seed) => {
  newSeed.value = { ...seed }
  selectedSeedId.value = seed.id
}

const confirmDelete = async (id) => {
  if (confirm('Êtes-vous sûr de vouloir supprimer cet élément ?')) {
    try {
      await axios.delete(`http://localhost:3001/api/stocks/seeds/${id}`)
      loadData()
    } catch (error) {
      console.error("Erreur lors de la suppression de la semence:", error)
    }
  }
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

const saveSeed = async () => {
  try {
    newSeed.value.user_id = userId.value // Assign user_id to newSeed

    if (selectedSeedId.value) {
      await axios.put(`http://localhost:3001/api/stocks/seeds/${selectedSeedId.value}`, newSeed.value)
    } else {
      await axios.post('http://localhost:3001/api/stocks/seeds', newSeed.value)
    }
    
    await axios.post('http://localhost:3001/historique', {
      user_id: userId.value,
      type: 'semences',
      name: newSeed.value.name,
      quantity: newSeed.value.quantity,
      unit: newSeed.value.unit,
      niveau: 'ajouter',
      date: formatDate(new Date()),
    });
    
    clearForm()
    alerts.value.successMessage = true
    loadData()
  } catch (error) {
    console.error("Erreur lors de la sauvegarde de la semence:", error)
  }
}

const clearForm = () => {
  newSeed.value = { name: '', quantity: 0, unit: '' }
  selectedSeedId.value = null
  alerts.value.successMessage = false
}

const handleEntry = async (seed) => {
  const quantity = parseInt(prompt('Entrer la quantité à ajouter :', 0), 10)
  if (quantity > 0) {
    const currentQuantity = parseInt(seed.quantity, 10)
    seed.quantity = currentQuantity + quantity

    try {
      await axios.put(`http://localhost:3001/api/stocks/seeds/${seed.id}`, seed)
      await axios.post('http://localhost:3001/historique', {
        type: 'semences',
        name: seed.name,
        quantity,
        unit: seed.unit,
        niveau: 'entrer',
        date: new Date()
      })
      loadData()
    } catch (error) {
      console.error("Erreur lors de l'entrée de la semence:", error)
    }
  }
}

const handleExit = async (seed) => {
  const quantity = parseInt(prompt('Entrer la quantité à retirer :', 0))
  if (quantity > 0 && quantity <= seed.quantity) {
    seed.quantity -= quantity
    try {
      await axios.put(`http://localhost:3001/api/stocks/seeds/${seed.id}`, seed)
      await axios.post('http://localhost:3001/historique', {
        type: 'semences',
        name: seed.name,
        quantity,
        unit: seed.unit,
        niveau: 'sortie',
        date: new Date()
      })
      loadData()
    } catch (error) {
      console.error("Erreur lors de la sortie de la semence:", error)
    }
  } else {
    alert('Quantité invalide !')
  }
}
</script>

<style scoped>
/* Ajouter des styles personnalisés pour améliorer l'esthétique */
.rounded-lg {
  border-radius: 12px;
}

.shadow-md {
  box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
}

.pa-6 {
  padding: 24px;
}

.elevation-2 {
  box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.1);
}

.v-card-title {
  color: #4caf50;
}
</style>
