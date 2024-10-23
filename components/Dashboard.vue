<template>
  <v-container fluid>
    <!-- En-tête du tableau de bord -->
    <v-row class="ma-5" no-gutters>
      <v-col cols="12" class="d-flex justify-center">
        <v-img
          src="https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0" 
          height="200px"
          class="dashboard-banner"
        ></v-img>
      </v-col>
    </v-row>

    <!-- Message central avec plus de texte -->
    <v-row class="text-center ma-5 elevation-10">
      <v-col cols="12">
        <h1 class="headline"><strong>Gérez vos fermes avec facilité</strong></h1>
        <p class="subheading">
          <strong>Accédez à vos parcelles, vos cultures, suivez la météo, et obtenez des</strong>
          rapports financiers détaillés en temps réel. Restez informé des
          meilleures pratiques agricoles avec des recommandations adaptées à
          votre ferme. Planifiez vos récoltes et optimisez vos ressources à
          tout moment et n'importe où.
        </p>
        <p class="additional-info">
          Notre solution vous permet de surveiller chaque étape de votre
          production agricole, tout en garantissant la traçabilité complète
          et la gestion optimisée de vos stocks.
        </p>
      </v-col>
    </v-row>

    <!-- Icônes animées avec du texte supplémentaire -->
    <v-row class="justify-center mt-5 txt">
      <v-col cols="12" md="3" class="d-flex flex-column align-center">
        <v-icon large class="animated-icon">mdi-farm</v-icon>
        <p>Gérez vos parcelles de manière efficace.</p>
      </v-col>
      <v-col cols="12" md="3" class="d-flex flex-column align-center">
        <v-icon large class="animated-icon">mdi-leaf</v-icon>
        <p>Surveillez et optimisez vos cultures.</p>
      </v-col>
      <v-col cols="12" md="3" class="d-flex flex-column align-center">
        <v-icon large class="animated-icon">mdi-weather-sunny</v-icon>
        <p>Prévisions météorologiques pour une meilleure planification.</p>
      </v-col>
      <v-col cols="12" md="3" class="d-flex flex-column align-center">
        <v-icon large class="animated-icon">mdi-file-chart</v-icon>
        <p>Rapports financiers détaillés et en temps réel.</p>
      </v-col>
    </v-row>

    <!-- Section V-Cards animées avec images de la ferme -->
    <v-row class="mt-5 ma-10">
      <v-col cols="12" md="4">
        <v-card class="v-card-animated">
          <v-img src="https://images.unsplash.com/photo-1588355841395-8c2a4e8b6b7f" height="150px" class="v-card-img"></v-img> <!-- Image of a wheat field -->
          <v-card-title><strong>Suivi des Parcelles</strong></v-card-title>
          <v-card-text>
            Visualisez et gérez chaque parcelle de votre ferme avec des
            fonctionnalités avancées de localisation et de suivi.
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card class="v-card-animated">
          <v-img src="https://images.unsplash.com/photo-1519337265831-281ec6cc8514" height="150px" class="v-card-img"></v-img> <!-- Image of crops -->
          <v-card-title><strong>Suivi des Cultures</strong></v-card-title>
          <v-card-text>
            Restez à jour sur la croissance de vos cultures, leur santé, et
            les meilleures pratiques pour augmenter les rendements.
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card class="v-card-animated">
          <v-img src="https://images.unsplash.com/photo-1560807708-3e215c1b8e0c" height="150px" class="v-card-img"></v-img> <!-- Image of a tractor in a field -->
          <v-card-title><strong>Prévisions Météo</strong></v-card-title>
          <v-card-text>
            Recevez des prévisions météorologiques actualisées pour planifier
            vos activités agricoles et anticiper les aléas climatiques.
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Animation auto d'affichage des mises à jour (Exemple: Nouvelles) -->
    <v-row class="auto-updating-section mt-5">
      <v-col cols="12" class="text-center">
        <v-card class="auto-update-card">
          <v-card-title><strong>Nouvelles mises à jour</strong></v-card-title>
          <v-card-text>
            <span>{{ newsUpdate }}</span>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue';

// Simulating dynamic updates from an API
const newsUpdate = ref('Chargement des dernières nouvelles...');

onMounted(() => {
  // Simulating dynamic data fetching (replace with actual API call)
  setTimeout(() => {
    newsUpdate.value =
      'Le traitement des cultures est prévu cette semaine pour la parcelle A3.';
  }, 3000);

  // Simulating continuous updates
  setInterval(() => {
    const updates = [
      'Les prévisions indiquent un risque de sécheresse la semaine prochaine.',
      'Nouveau rapport financier disponible pour le mois d’août.',
      'Vos cultures de maïs sont prêtes pour la récolte.',
      'Mise à jour de la météo: Températures élevées attendues demain.',
    ];
    const randomUpdate = updates[Math.floor(Math.random() * updates.length)];
    newsUpdate.value = randomUpdate;
  }, 7000);
});
</script>

<style scoped>
.dashboard-banner {
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  width: 100%;   /* L'image occupe toute la largeur */
  height: 100vh; /* L'image occupe toute la hauteur de la fenêtre */
  object-fit: cover; /* Permet de s'assurer que l'image couvre toute la zone */
}
  
.headline {
  font-size: 2.5rem;
  font-weight: bold;
  margin-bottom: 10px;
}

.subheading {
  font-size: 1.25rem;
}

.additional-info {
  margin-top: 10px;
  font-size: 1.15rem;
  color: gray;
}

.animated-icon {
  transition: transform 0.3s;
  cursor: pointer;
}

.animated-icon:hover {
  transform: scale(1.2);
}

.v-card-animated {
  transition: transform 0.3s, box-shadow 0.3s;
  cursor: pointer;
   box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2);
}

.v-card-animated:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2);
}

.v-card-img {
  border-radius: 8px 8px 0 0;
}

.auto-updating-section {
  margin-top: 50px;
}
.txt {
  font-size: 1.2em;
}
.auto-update-card {
  background-color: #e8f5e9;
  padding: 20px;
  border-radius: 8px;
}
</style>
