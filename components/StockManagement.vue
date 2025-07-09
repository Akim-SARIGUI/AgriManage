<template>
  <v-container class="background-container">
    <v-row justify="center">
      <!-- Carte pour la gestion des intrants agricoles -->
      <v-col cols="12" md="6">
        <v-card @click="showSection('intrants')" class="clickable-card">
          <v-card-title class="card-title">Gestion des Intrants Agricoles</v-card-title>
          <v-card-subtitle class="card-subtitle">Gérez vos semences, fertilisants et pesticides.</v-card-subtitle>
          <v-card-actions>
            <v-btn @click.stop="showSection('intrants')" class="access-btn">Accéder</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>

      <!-- Carte pour la gestion des produits récoltés -->
      <v-col cols="12" md="6">
        <v-card @click="showSection('Produits')" class="clickable-card">
          <v-card-title class="card-title">Gestion des Produits Récoltés</v-card-title>
          <v-card-subtitle class="card-subtitle">Suivez les quantités récoltées, stockées et vendues.</v-card-subtitle>
          <v-card-actions>
            <v-btn @click.stop="showSection('Produits')" class="access-btn">Accéder</v-btn>
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
  components: {
    Intrants,
    Produits
  },
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
.background-container {
  background: linear-gradient(135deg, #f0f4f8, #e0e7ed);
  min-height: 100vh;
  padding: 24px;
}

.clickable-card {
  cursor: pointer;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  border-radius: 12px;
  background: linear-gradient(145deg, #ffffff, #f0f0f0);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  text-align: center;
  margin-bottom: 16px;
}

.clickable-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
}

.card-title {
  font-family: 'Poppins', sans-serif;
  font-size: 2rem;
  font-weight: 600;
  color: #2c3e50;
  padding: 16px;
}

.card-subtitle {
  font-family: 'Roboto', sans-serif;
  font-size: 1.5rem;
  color: #666;
  padding: 0 16px 16px 16px;
}

.access-btn {
  background: linear-gradient(145deg, #1976d2, #1565c0);
  color: white;
  font-family: 'Roboto', sans-serif;
  font-weight: 500;
  text-transform: none;
  border-radius: 8px;
  padding: 10px 20px;
  transition: background 0.3s ease;
}

.access-btn:hover {
  background: linear-gradient(145deg, #1565c0, #1976d2);
}

.v-card-actions {
  justify-content: center;
  padding: 16px;
}
</style>