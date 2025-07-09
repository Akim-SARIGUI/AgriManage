<template>
  <v-app>
    <!-- Section Hero (Accueil) -->
    <v-container fluid class="hero-section py-6" id="dashboard">
  <v-row align="center" justify="center">
    <v-col cols="12" md="6" class="text-center">
      <h1 class="title text-h3 pa-2" data-aos="fade-down">Bienvenue sur Gestion de Ferme Agricole</h1>
      <p class="subtitle text-h6 pb-2" data-aos="fade-up">
        Optimisez votre production agricole avec notre application.
      </p>
      <v-btn
        color="primary"
        class="explore-button"
        small
        @click="scrollToSection('features')"
        data-aos="zoom-in"
      >
        Explorer
      </v-btn>
    </v-col>
  </v-row>
</v-container>


    <!-- Section Présentation -->
    <v-container class="presentation-section" fluid>
      <v-row align="center">
        <v-col cols="12" md="6" data-aos="fade-right">
          <v-img src="/pexels-quang-nguyen-vinh-222549-2131784.jpg" class="presentation-image"></v-img>
        </v-col>
        <v-col cols="12" md="6" class="d-flex align-center" data-aos="fade-left">
          <div>
            <h2 class="presentation-title">À propos de l'application</h2>
            <p class="presentation-description">
              Notre plateforme vous aide à gérer efficacement vos parcelles, cultures et ressources
              tout en vous fournissant des outils de planification et d'analyse avancés.
            </p>
          </div>
        </v-col>
      </v-row>
    </v-container>

    <!-- Section Fonctionnalités -->
    <v-container class="features-section" id="features" fluid>
      <v-row>
        <v-col cols="12" class="text-center">
          <h2 class="section-title" data-aos="fade-down">Fonctionnalités Principales</h2>
          <p class="section-subtitle" data-aos="fade-up">
            Découvrez les outils qui vous aideront à gérer votre ferme efficacement.
          </p>
        </v-col>

        <!-- Carte Fonctionnalité 1 -->
        <v-col v-for="(feature, index) in features" :key="index" cols="12" md="4">
          <v-card
            class="feature-card pa-6"
            data-aos="fade-up"
            :data-aos-delay="index * 100"
            outlined
            hover
          >
            <v-icon size="64" :color="feature.iconColor" class="mb-4">{{ feature.icon }}</v-icon>
            <v-card-title class="text-center feature-title">{{ feature.title }}</v-card-title>
            <v-card-text class="text-center feature-description">
              {{ feature.description }}
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>

    <!-- Section Compétences Requises -->
    <v-container class="skills-section" fluid>
      <v-row>
        <v-col cols="12" class="text-center" data-aos="fade-down">
          <h2 class="section-title">Compétences Recommandées</h2>
        </v-col>
        <v-col v-for="(skill, index) in skills" :key="index" cols="12" md="4" data-aos="fade-up" :data-aos-delay="index * 100">
          <v-card class="skill-card pa-6" outlined>
            <v-icon large color="primary">{{ skill.icon }}</v-icon>
            <v-card-title class="text-center">{{ skill.title }}</v-card-title>
            <v-card-text class="text-center">{{ skill.description }}</v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>

    <!-- Section Call to Action -->
   <v-container class="cta-section py-4" fluid>
  <v-row align="center" justify="center">
    <v-col cols="12" md="6" class="text-center">
      <h2 class="cta-title text-h5" data-aos="fade-down">Transformez Votre Ferme</h2>
      <p class="cta-subtitle text-body-2 pb-4" data-aos="fade-up">
        Utilisez notre application pour une gestion agricole moderne et efficace.
      </p>
      <v-btn
        color="primary"
        class="cta-button"
        small
        @click="scrollToSection('dashboard')"
        data-aos="zoom-in"
      >
        Commencer
      </v-btn>
    </v-col>
  </v-row>
</v-container>

  </v-app>
</template>

<script setup>
import { ref, onMounted } from "vue";
import AOS from "aos";
import "aos/dist/aos.css";

// Données des fonctionnalités
const features = ref([
  {
    icon: "mdi-map-marker",
    iconColor: "green",
    title: "Gestion des Parcelles",
    description: "Visualisez et gérez vos parcelles agricoles en temps réel.",
  },
  {
    icon: "mdi-calendar-check",
    iconColor: "blue",
    title: "Planification des Tâches",
    description: "Organisez vos activités agricoles avec un calendrier intuitif.",
  },
  {
    icon: "mdi-weather-cloudy",
    iconColor: "orange",
    title: "Prévisions Météo",
    description: "Accédez à des prévisions météo précises pour mieux planifier vos travaux.",
  },
  {
    icon: "mdi-finance",
    iconColor: "purple",
    title: "Gestion Financière",
    description: "Suivez vos revenus, dépenses et bénéficiez d'analyses détaillées.",
  },
  {
    icon: "mdi-warehouse",
    iconColor: "red",
    title: "Gestion des Stocks",
    description: "Surveillez et gérez vos stocks d'intrants et de récoltes efficacement.",
  },
  {
    icon: "mdi-lightbulb",
    iconColor: "teal",
    title: "Recommandations Intelligentes",
    description: "Recevez des suggestions basées sur vos données pour améliorer votre rendement.",
  },
]);


// Données des compétences
const skills = ref([
  { title: "Utilisation de l'application", description: "Savoir naviguer dans l'interface et utiliser les fonctionnalités principales.", icon: "mdi-laptop" },
  { title: "Notions en gestion agricole", description: "Comprendre les bases de la gestion des cultures et des parcelles.", icon: "mdi-leaf" },
  { title: "Analyse et planification", description: "Être capable d'interpréter les données pour optimiser la production.", icon: "mdi-chart-line" }
]);

// Initialiser AOS
onMounted(() => {
  AOS.init({ duration: 1000 });
});

// Fonction pour faire défiler vers une section
const scrollToSection = (sectionId) => {
  const element = document.getElementById(sectionId);
  if (element) {
    element.scrollIntoView({ behavior: "smooth", block: "start" });
  }
};
</script>

<style scoped>
/* Styles Généraux */
.full-height {
  height: 50vh; /* Réduire la hauteur de la section d'accueil */
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Section Hero */
.hero-section {
  background: linear-gradient(rgba(0, 0, 0, 0.5), url("https://via.placeholder.com/1920x1080") no-repeat center center);
  background-size: cover;
  color: rgb(11, 116, 64);
  padding: 20px 0; /* Ajouter un peu de padding */
}

.title {
  font-size: 3em; /* Réduire la taille du titre */
  font-weight: bold;
  margin-bottom: 10px; /* Réduire l'espace sous le titre */
}

.subtitle {
  font-size: 1.2em; /* Réduire la taille du sous-titre */
  margin-bottom: 20px;
}

.explore-button {
  font-size: 1em; /* Réduire la taille du bouton */
  margin-top: 10px; /* Ajouter un peu d'espace au-dessus du bouton */
}

/* Section Présentation */
.presentation-section {
  padding: 40px 0; /* Réduire le padding */
}

.presentation-image {
  width: 100%;
  max-height: 400px; /* Limiter la hauteur de l'image */
  object-fit: cover; /* Assurer que l'image couvre bien l'espace */
  border-radius: 10px;
}

.presentation-title {
  font-size: 4em; /* Réduire la taille du titre */
  font-weight: bold;
  margin-bottom: 15px; /* Réduire l'espace sous le titre */
}

.presentation-description {
  font-size: 2em; /* Réduire la taille de la description */
  color: #555;
  line-height: 1.6; /* Améliorer la lisibilité */
}

/* Section Fonctionnalités */
.features-section {
  background-color: #f5f5f5;
  padding: 40px 0; /* Réduire le padding */
}

.section-title {
  font-size: 2em; /* Réduire la taille du titre */
  font-weight: bold;
  margin-bottom: 15px; /* Réduire l'espace sous le titre */
}

.section-subtitle {
  font-size: 1.1em; /* Réduire la taille du sous-titre */
  margin-bottom: 30px; /* Réduire l'espace sous le sous-titre */
}

.feature-card {
  transition: transform 0.3s ease;
  padding: 20px; /* Réduire le padding */
}

.feature-card:hover {
  transform: scale(1.05);
}

.feature-title {
  font-size: 1.3em; /* Réduire la taille du titre */
  font-weight: bold;
}

.feature-description {
  font-size: 1em; /* Réduire la taille de la description */
}

/* Section Compétences */
.skills-section {
  background-color: #e8f5e9;
  padding: 40px 0; /* Réduire le padding */
}

.skill-card {
  text-align: center;
  border-radius: 10px;
  transition: transform 0.3s;
  padding: 20px; /* Réduire le padding */
}

.skill-card:hover {
  transform: scale(1.05);
}

/* Section Call to Action */
.cta-section {
  background-color: #1b5e20;
  color: white;
  padding: 40px 0; /* Réduire le padding */
}

.cta-title {
  font-size: 2em; /* Réduire la taille du titre */
  font-weight: bold;
  margin-bottom: 15px; /* Réduire l'espace sous le titre */
}

.cta-subtitle {
  font-size: 1.1em; /* Réduire la taille du sous-titre */
  margin-bottom: 20px; /* Réduire l'espace sous le sous-titre */
}

.cta-button {
  font-size: 1em; /* Réduire la taille du bouton */
}
</style>