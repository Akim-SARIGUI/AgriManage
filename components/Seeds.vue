<template>
  <v-card class="rounded-lg shadow-md pa-6 mb-6">
    <v-card-title class="text-h5 font-weight-bold text-success">
      Gestion des Semences
    </v-card-title>
    <v-text-field v-model="search" label="Rechercher une semence" append-icon="mdi-magnify" class="mb-4"></v-text-field>
    <v-list dense>
      <v-list-item-group v-for="seed in filteredSeeds" :key="seed.id">
        <v-list-item>
          <v-list-item-content>
            <v-list-item-title>{{ seed.name }}</v-list-item-title>
            <v-list-item-subtitle :class="{'text-error': seed.quantity <= 0, 'text-success': seed.quantity > 0}">
              Quantité: {{ seed.quantity }} {{ seed.unit }} ({{ seed.quantity <= 0 ? 'Stock épuisé' : 'Suffisant' }})
            </v-list-item-subtitle>
          </v-list-item-content>
          <v-list-item-action>
            <v-btn @click="selectSeed(seed)" icon>
              <v-icon>mdi-pencil</v-icon>
            </v-btn>
            <v-btn @click="confirmDelete(seed.id, 'seeds')" icon>
              <v-icon>mdi-delete</v-icon>
            </v-btn>
          </v-list-item-action>
        </v-list-item>
      </v-list-item-group>
      <v-list-item v-if="filteredSeeds.length === 0">
        <v-list-item-content>
          <v-list-item-title>Aucune semence en stock</v-list-item-title>
        </v-list-item-content>
      </v-list-item>
    </v-list>

    <!-- Formulaire pour ajouter ou modifier une semence -->
    <v-form @submit.prevent="saveSeed">
      <v-text-field v-model="newSeed.name" label="Nom de la Semence" outlined required></v-text-field>
      <v-text-field v-model.number="newSeed.quantity" label="Quantité" type="number" min="0" outlined required></v-text-field>
      <v-text-field v-model="newSeed.unit" label="Unité de Mesure" outlined required></v-text-field>
      <v-btn type="submit" color="success">{{ selectedSeedId ? 'Modifier' : 'Ajouter' }}</v-btn>
      <v-btn @click="clearForm" color="error">Annuler</v-btn>
      <v-btn @click="clearForm('entry')" class="ml-10" color="primary">Entrée</v-btn>
      <v-btn @click="clearForm('exit')" color="blue">Sortie</v-btn>
    </v-form>
    <v-alert v-if="alerts.seedExists" type="error" outlined class="mt-4">
      Cette semence existe déjà !
    </v-alert>
    <v-alert v-if="alerts.invalidName" type="error" outlined class="mt-4">
      Nom de semence invalide ! Veuillez entrer un nom valide.
    </v-alert>
    <v-alert v-if="alerts.invalidQuantity" type="error" outlined class="mt-4">
      Quantité invalide ! Veuillez entrer une quantité supérieure à zéro.
    </v-alert>
    <v-alert v-if="alerts.successMessage" type="success" outlined class="mt-4">
      Semence sauvegardée avec succès !
    </v-alert>
  </v-card>
</template>

<script>
export default {
  data() {
    return {
      search: '',
      newSeed: { name: '', quantity: 0, unit: '' },
      selectedSeedId: null,
      seeds: [],
      alerts: {
        seedExists: false,
        invalidName: false,
        invalidQuantity: false,
        successMessage: false,
      },
    };
  },
  computed: {
    filteredSeeds() {
      return this.seeds.filter(seed => seed.name.toLowerCase().includes(this.search.toLowerCase()));
    },
  },
  methods: {
    selectSeed(seed) {
      this.newSeed = { ...seed };
      this.selectedSeedId = seed.id;
    },
    confirmDelete(id, type) {
      if (confirm('Êtes-vous sûr de vouloir supprimer cet élément ?')) {
        this.$emit('delete-item', { id, type });
      }
    },
    saveSeed() {
      if (this.selectedSeedId) {
        this.$emit('update-item', { id: this.selectedSeedId, data: this.newSeed, type: 'seeds' });
      } else {
        this.$emit('create-item', { data: this.newSeed, type: 'seeds' });
      }
    },
    clearForm(type) {
      this.newSeed = { name: '', quantity: 0, unit: '' };
      this.selectedSeedId = null;
      this.alerts = {
        seedExists: false,
        invalidName: false,
        invalidQuantity: false,
        successMessage: false,
      };
      this.$emit('clear-form', type);
    },
  },
  created() {
    this.$emit('load-data', 'seeds');
  },
};
</script>
