<template>
  <v-container>
    <v-row justify="center">
      <!-- Carte pour la gestion des intrants agricoles -->
      <v-col cols="12" md="6">
        <v-card @click="showSection('intrants')" class="clickable-card">
          <v-card-title>Gestion des Intrants Agricoles</v-card-title>
          <v-card-subtitle>Gérez vos semences, fertilisants et pesticides.</v-card-subtitle>
          <v-card-actions>
            <v-btn @click.stop="showSection('intrants')">Accéder</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>

      <!-- Carte pour la gestion des produits récoltés -->
      <v-col cols="12" md="6">
        <v-card @click="showSection('Produits')" class="clickable-card">
          <v-card-title>Gestion des Produits Récoltés</v-card-title>
          <v-card-subtitle>Suivez les quantités récoltées, stockées et vendues.</v-card-subtitle>
          <v-card-actions>
            <v-btn @click.stop="showSection('Produits')">Accéder</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
      
    </v-row>
    <!-- Affichage conditionnel des sections -->
    <v-row v-if="currentSection === 'intrants'">
      <v-col cols="12">
        <Intrants />
      </v-col>
    </v-row>

    <v-row v-if="currentSection === 'Produits'">
      <v-col cols="12">
        <Produits />
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import Intrants from '@/components/Intrants.vue';
import Produits from '@/components/Produits.vue';

export default {
  components: 
    Intrants,
    Produits
  ,
  data() {
    return {
      currentSection: null
    };
  },
  methods: {
    showSection(section) {
      this.currentSection = section;
    }
  }
}
</script>

<style scoped>
.clickable-card {
  cursor: pointer;
  transition: transform 0.2s;
  text-align: center; /* Center text in card */
}
.clickable-card:hover {
  transform: scale(1.05);
}
</style>
