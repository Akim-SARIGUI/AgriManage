<template>
  <v-card>
    <v-card-title>Gestion des Fertilisants</v-card-title>

    <!-- Champ de Recherche -->
    <v-text-field v-model="search" label="Rechercher un fertilisant" />

    <!-- Tableau des Fertilisants -->
    <v-data-table
      :items="sortedFertilizers"
      :headers="headers"
      item-key="id"
      class="elevation-1"
    >
      <template v-slot:item.actions="{ item }">
        <v-btn small @click="handleEntry(item)">Ajouter Quantité</v-btn>
        <v-btn small @click="handleExit(item)">Retirer Quantité</v-btn>
      </template>
    </v-data-table>

    <!-- Formulaire d'Ajout/Modification de Fertilisant -->
    <v-form @submit.prevent="saveFertilizer">
      <v-text-field v-model="newFertilizer.name" label="Nom du fertilisant" required />
      <v-text-field v-model="newFertilizer.quantity" label="Quantité" type="number" min="1" required />
      <v-text-field v-model="newFertilizer.unit" label="Unité" required />

      <v-alert v-if="alerts.duplicate" type="error">Ce fertilisant existe déjà. Utilisez 'Ajouter Quantité' ou 'Retirer Quantité'.</v-alert>
      <v-alert v-if="alerts.success" type="success">Fertilisation ajoutée/modifiée avec succès.</v-alert>

      <v-btn type="submit">Sauvegarder</v-btn>
      <v-btn type="button" @click="clearForm">Annuler</v-btn>
    </v-form>
  </v-card>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';

export default {
  setup() {
    const search = ref('');
    const newFertilizer = ref({ name: '', quantity: 0, unit: '' });
    const selectedFertilizerId = ref(null);
    const alerts = ref({ duplicate: false, success: false });
    const fertilizers = ref([]);

    // Charger les fertilisants
    const loadFertilizers = async () => {
      try {
        const response = await axios.get('/api/fertilizers');
        fertilizers.value = response.data;
      } catch (error) {
        console.error("Erreur lors du chargement des fertilisants", error);
      }
    };

    onMounted(loadFertilizers);

    // Filtrage et tri alphabétique des fertilisants
    const sortedFertilizers = computed(() => {
      return fertilizers.value
        .filter(fertilizer => fertilizer.name.toLowerCase().includes(search.value.toLowerCase()))
        .sort((a, b) => a.name.localeCompare(b.name)); // Tri alphabétique par nom
    });

    const headers = [
      { text: 'Nom', value: 'name' },
      { text: 'Quantité', value: 'quantity' },
      { text: 'Unité', value: 'unit' },
      { text: 'Actions', value: 'actions', sortable: false }
    ];

    // Enregistrer un fertilisant
    const saveFertilizer = () => {
      alerts.value.duplicate = false;
      alerts.value.success = false;

      // Vérifier l'existence du fertilisant
      const existingFertilizer = fertilizers.value.find(
        fertilizer => fertilizer.name.toLowerCase() === newFertilizer.value.name.toLowerCase()
      );

      if (existingFertilizer) {
        alerts.value.duplicate = true; // Afficher l'alerte de duplication
      } else {
        if (selectedFertilizerId.value) {
          // Modification
          const fertilizerIndex = fertilizers.value.findIndex(f => f.id === selectedFertilizerId.value);
          if (fertilizerIndex !== -1) {
            fertilizers.value[fertilizerIndex] = { ...newFertilizer.value, id: selectedFertilizerId.value };
            axios.put(`/api/fertilizers/${selectedFertilizerId.value}`, newFertilizer.value);
          }
        } else {
          // Ajout
          const newFertilizerData = { ...newFertilizer.value };
          axios.post('/api/fertilizers', newFertilizerData).then(response => {
            fertilizers.value.push(response.data);
            alerts.value.success = true;
          });
        }
        clearForm();
      }
    };

    const clearForm = () => {
      newFertilizer.value = { name: '', quantity: 0, unit: '' };
      selectedFertilizerId.value = null;
      alerts.value.duplicate = false;
      alerts.value.success = false;
    };

    const handleEntry = async (fertilizer) => {
      const quantityToAdd = prompt("Entrez la quantité à ajouter :");
      if (quantityToAdd && !isNaN(quantityToAdd) && quantityToAdd > 0) {
        fertilizer.quantity += parseFloat(quantityToAdd);
        await axios.put(`/api/fertilizers/${fertilizer.id}`, fertilizer);
      }
    };

    const handleExit = async (fertilizer) => {
      const quantityToRemove = prompt("Entrez la quantité à retirer :");
      if (quantityToRemove && !isNaN(quantityToRemove) && quantityToRemove > 0) {
        fertilizer.quantity -= parseFloat(quantityToRemove);
        if (fertilizer.quantity < 0) fertilizer.quantity = 0; // Empêcher les quantités négatives
        await axios.put(`/api/fertilizers/${fertilizer.id}`, fertilizer);
      }
    };

    return {
      search,
      newFertilizer,
      selectedFertilizerId,
      alerts,
      fertilizers,
      loadFertilizers,
      sortedFertilizers,
      headers,
      saveFertilizer,
      clearForm,
      handleEntry,
      handleExit
    };
  }
};
</script>

<style scoped>
.v-alert {
  margin-top: 10px;
}
</style>
