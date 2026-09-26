<template>
  <v-container>
    <!-- Liste des Parcelles -->
    <v-row>
      <v-col cols="12">
        <v-card class="mt-4">
          <v-card-title>
            <h2 class="text-h5">Gestion des Parcelles</h2>
          </v-card-title>
          <v-card-text>
            <template v-if="parcelles.length > 0">
              <v-data-table :items="parcelles" :headers="headers">
                <template v-slot:item.actions="{ item }">
                  <v-btn small @click="editParcelle(item)" class="mr-2" fab dark>
                    <v-icon>mdi-pencil</v-icon>
                  </v-btn>
                  <v-btn small color="red" @click="deleteParcelle(item)" class="mr-2" fab dark>
                    <v-icon>mdi-delete</v-icon>
                  </v-btn>
                  <v-btn small @click="viewHistory(item)" fab dark>
                    <v-icon>mdi-history</v-icon>
                  </v-btn>
                  <v-btn small @click="viewLocation(item)" color="green" fab dark>
                    <v-icon>mdi-map-marker"></v-icon>
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

    <!-- Dialog for Creating/Editing Parcelle -->
    <v-dialog v-model="dialog" persistent max-width="600px">
      <v-card>
        <v-card-title>
          <span class="text-h5">{{ isEditMode ? 'Modifier Parcelle' : 'Ajouter une Parcelle' }}</span>
        </v-card-title>
        <v-card-text>
          <v-text-field v-model="formData.name" label="Nom"></v-text-field>
          <v-text-field v-model="formData.dimension" label="Dimension"></v-text-field>
          <v-text-field v-model="formData.location" label="Localisation"></v-text-field>
          <v-text-field v-model="newActivity.date" label="Date" type="date"></v-text-field>
          <v-menu ref="menu" v-model="datePickerMenu" :close-on-content-click="false" transition="scale-transition" offset-y>
            <template v-slot:activator="{ on, attrs }">
              <v-text-field v-model="formData.date" label="Date" prepend-icon="mdi-calendar" readonly v-bind="attrs" v-on="on"></v-text-field>
            </template>
           <v-text-field v-model="newActivity.date" label="Date" type="date"></v-text-field>
          </v-menu>
          <!-- Leaflet Map for Setting Location -->
          <div id="map" style="height: 300px;"></div>
          <v-btn @click="saveLocation" color="blue" class="mt-2">Enregistrer ma Localisation</v-btn>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue darken-1" text @click="cancelParcelle">Annuler</v-btn>
          <v-btn color="blue darken-1" text @click="saveParcelle">Enregistrer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog for Viewing Location -->
    <v-dialog v-model="locationDialog" persistent max-width="1000px">
      <v-card>
        <v-card-title>
          <span class="text-h5">Localisation - {{ selectedParcelle.name }}</span>
        </v-card-title>
        <v-card-text>
          <div id="viewMap" style="height: 400px;"></div>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue darken-1" text @click="locationDialog = false">Fermer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog for Viewing History -->
    <v-dialog v-model="historyDialog" persistent max-width="1000px">
      <v-card>
        <v-card-title>
          <span class="text-h5">Historique des Cultures - {{ selectedParcelle.name }}</span>
        </v-card-title>
        <v-card-text>
          <v-card class="mt-4">
            <v-card-title>
              <span class="text-h5">Historique des Cultures</span>
            </v-card-title>
            <v-card-text>
              <template v-if="history.length > 0">
                <v-data-table :items="history" :headers="historyHeaders">
                  <template v-slot:item.actions="{ item }">
                    <v-btn small @click="viewCultureDetails(item)" class="mr-2" fab dark>
                      <v-icon>mdi-eye</v-icon>
                    </v-btn>
                    <v-btn small color="red" @click="deleteCulture(item)" class="mr-2" fab dark>
                      <v-icon>mdi-delete</v-icon>
                    </v-btn>
                  </template>
                </v-data-table>
              </template>
              <template v-else>
                <p class="text-center">Pas d'historique</p>
              </template>
            </v-card-text>
          </v-card>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue darken-1" text @click="historyDialog = false">Fermer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar for Notifications and Undo -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color">
      {{ snackbar.message }}
      <v-btn text @click="undoDelete">Annuler</v-btn>
      <v-btn text @click="snackbar.show = false">Fermer</v-btn>
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'

// Data and Methods for Parcelles
const parcelles = ref([
  { id: 1, name: 'Parcelle 1', dimension: '5 ha', location: 'Nord', date: '2024-08-01', coordinates: [51.505, -0.09], history: [] },
  { id: 2, date: '2024-08-15', type: 'Récolte', description: 'Récolte du maïs', works: [] }
])
const headers = [
  { text: 'Nom', value: 'name' },
  { text: 'Dimension', value: 'dimension' },
  { text: 'Localisation', value: 'location' },
  { text: 'Date', value: 'date' },
  { text: 'Actions', value: 'actions', sortable: false }
]
const historyHeaders = [
  { text: 'Date', value: 'date' },
  { text: 'Type', value: 'type' },
  { text: 'Description', value: 'description' },
  { text: 'Actions', value: 'actions', sortable: false }
]
const dialog = ref(false)
const historyDialog = ref(false)
const locationDialog = ref(false)
const datePickerMenu = ref(false)
const isEditMode = ref(false)
const formData = ref({ name: '', dimension: '', location: '', date: '', coordinates: [51.505, -0.09] })
const selectedParcelle = ref(null)
const snackbar = ref({ show: false, message: '', color: 'success' })
let deletedItem = null
let deletedItemIndex = null
const dateFormat = (date) => {
  return new Date(date).toLocaleDateString('fr-FR', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

const openCreateDialog = () => {
  isEditMode.value = false
  formData.value = { name: '', dimension: '', location: '', date: '', coordinates: [51.505, -0.09] }
  dialog.value = true
}

const saveParcelle = () => {
  if (isEditMode.value) {
    const index = parcelles.value.findIndex((parcelle) => parcelle.id === selectedParcelle.value.id)
    if (index !== -1) parcelles.value[index] = { ...formData.value, id: selectedParcelle.value.id }
  } else {
    parcelles.value.push({ ...formData.value, id: parcelles.value.length + 1 })
  }
  snackbar.value = { show: true, message: 'Parcelle enregistrée', color: 'success' }
  dialog.value = false
}

const editParcelle = (parcelle) => {
  selectedParcelle.value = parcelle
  formData.value = { ...parcelle }
  isEditMode.value = true
  dialog.value = true
}

const deleteParcelle = (parcelle) => {
  deletedItem = parcelle
  deletedItemIndex = parcelles.value.indexOf(parcelle)
  parcelles.value.splice(deletedItemIndex, 1)
  snackbar.value = { show: true, message: 'Parcelle supprimée', color: 'error' }
}

const undoDelete = () => {
  if (deletedItem) {
    parcelles.value.splice(deletedItemIndex, 0, deletedItem)
    deletedItem = null
    snackbar.value = { show: false, message: '', color: '' }
  }
}

const viewLocation = (parcelle) => {
  selectedParcelle.value = parcelle
  locationDialog.value = true
  if (process.client) {
    import('leaflet').then((L) => {
      const map = L.map('viewMap').setView(parcelle.coordinates, 13)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map)
      L.marker(parcelle.coordinates).addTo(map).bindPopup(parcelle.name).openPopup()
    })
  }
}

const viewHistory = (parcelle) => {
  selectedParcelle.value = parcelle
  historyDialog.value = true
  // Load history data if needed
}

const saveLocation = () => {
  // Logic to save location
  snackbar.value = { show: true, message: 'Localisation enregistrée', color: 'success' }
}

const cancelParcelle = () => {
  dialog.value = false
}

onMounted(() => {
  if (process.client) {
    import('leaflet').then((L) => {
      const map = L.map('map').setView([51.505, -0.09], 13)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map)
    })
  }
})
</script>

<style scoped>
#map, #viewMap {
  height: 300px;
  width: 100%;
}
</style>
