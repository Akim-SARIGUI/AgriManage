<template>
  <v-app>
    <!-- Header -->
    <v-container fluid class="header full-height">
      <v-row align="center" justify="center" class="full-height">
        <v-col cols="12" md="8" class="text-center">
          <h1 class="title pa-4" data-aos="fade-down">Gestion de Ferme Agricole</h1>
          <p class="subtitle pb-8" data-aos="fade-up">Optimisez votre production végétale avec notre application.</p>
        <v-btn color="primary" class="pb-12  decouvrez"  large @click="scrollToSection('services')" data-aos="zoom-in">Découvrez nos services </v-btn> 
        </v-col>
      </v-row>
    </v-container>

    <!-- Side Menu for Authentication -->
     <v-container class="auth-menu ml-16" fluid>
    <v-row justify="center">
      <v-col cols="12" md="6" lg="4" class="auth-menu-col">
        <v-card class="auth-card" outlined data-aos="fade-right">
          <v-card-title class="text-center bien">Bienvenue</v-card-title>
          <v-card-text class="text-center">
            <p class="mt-4 mb-4">
              Pour accéder à toutes les fonctionnalités de notre application, veuillez vous connecter ou vous inscrire.
            </p>
            <v-btn @click="goToLogin" color="primary" class="my-2 incon" data-aos="fade-up">Se Connecter</v-btn>
            <v-btn @click="goToRegister" color="secondary" class="my-2 ml-4 incon" data-aos="fade-up">S'inscrire</v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>

    <!-- Services Section -->
    <v-container class="services-section" id="services" fluid>
      <v-row>
        <v-col cols="12" class="text-center">
          <h2 class="section-title" data-aos="fade-down">Nos Services</h2>
        </v-col>

        <v-col v-for="(service, index) in services" :key="index" cols="12" md="4">
  <v-card 
    class="service-card pa-16"
    data-aos="fade-up" 
    :data-aos-delay="index * 100" 
    outlined>
    <v-img :src="service.image" height="300px" class="mx-auto img-with-padding" contain></v-img> <!-- Classe pour image -->
    <v-card-title class="text-center servititle">{{ service.title }}</v-card-title>
    <v-card-text class="text-center para">{{ service.description }}</v-card-text>
  </v-card>
</v-col>


      </v-row>
    </v-container>

    <!-- Testimonials Section -->
    <v-container class="testimonials-section" fluid>
      <v-row class="pa-4">
        <v-col cols="12" class="text-center pa-0 mg-0">
          <h2 class="section-title" data-aos="fade-down">Témoignages</h2>
        </v-col>
       <v-carousel cycle :interval="5000" show-arrows class="pa-0">
  <v-carousel-item v-for="(testimonial, index) in testimonials" :key="index">
    <v-card class="testimonial-card rounded-lg pa-0 ml-15 mr-15" data-aos="fade-up" :data-aos-delay="index * 100">
      <v-card-text class="italic text-center">"{{ testimonial.text }}"</v-card-text>
      <v-card-subtitle class="text-center pa-0 ma-0">{{ testimonial.author }}</v-card-subtitle>
    </v-card>
  </v-carousel-item>
</v-carousel>



      </v-row>
    </v-container>

    <!-- Partners Section -->
    <v-container class="partners-section" fluid>
      <v-row>
        <v-col cols="12" class="text-center ">
          <h2 class="section-title" data-aos="fade-down">Nos Partenaires</h2>
        </v-col>
        <v-row class="d-flex justify-center">
  <v-col
    v-for="(partner, index) in partners"
    :key="index"
    cols="12"
    md="3"
    class="d-flex justify-center pa-10"
  >
    <v-img
      :src="partner.image"
      class="partner-logo"
      contain
      data-aos="fade-up"
      :data-aos-delay="index * 100"
    ></v-img>
  </v-col>
</v-row>

      </v-row>
    </v-container>

    <!-- Footer -->
    <v-footer class="footer">
      <v-container>
        <v-row>
          <v-col cols="12" md="3">
            <h3 class="footer-title">À propos</h3>
            <p>Nous sommes dédiés à l'optimisation de la production végétale pour un avenir durable.</p>
          </v-col>
          <v-col cols="12" md="3">
            <h3 class="footer-title">Liens Utiles</h3>
            <v-list dense>
              <v-list-item v-for="link in links" :key="link.text">
                <v-list-item-content>
                  <v-list-item-title><a :href="link.url">{{ link.text }}</a></v-list-item-title>
                </v-list-item-content>
              </v-list-item>
            </v-list>
          </v-col>
          <v-col cols="12" md="3">
            <h3 class="footer-title">Contact</h3>
            <p>Adresse : 123 Rue de l'Agriculture, Ville, Pays</p>
            <p>Téléphone : +123 456 789</p>
            <p>Email : info@fermeagricole.com</p>
          </v-col>
          <v-col cols="12" md="3">
            <h3 class="footer-title">Suivez-nous</h3>
            <v-row class="social-links">
              <v-col cols="3"><v-icon large>mdi-facebook</v-icon></v-col>
              <v-col cols="3"><v-icon large>mdi-twitter</v-icon></v-col>
              <v-col cols="3"><v-icon large>mdi-linkedin</v-icon></v-col>
              <v-col cols="3"><v-icon large>mdi-instagram</v-icon></v-col>
            </v-row>
          </v-col>
        </v-row>
        <v-row class="text-center mt-8">
          <v-col>
            <p>© 2024 Gestion de Ferme Agricole. Tous droits réservés.</p>
          </v-col>
        </v-row>
      </v-container>
    </v-footer>
  </v-app>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AOS from 'aos'
import 'aos/dist/aos.css'

const router = useRouter()

// Données des services
const services = ref([
  { image: 'pexels-nc-farm-bureau-mark-2252618.jpg', title: 'Gestion des Parcelles', description: 'Optimisez l’utilisation de chaque parcelle de terrain.' },
  { image: 'pexels-rattasat-1453152-2804327.jpg', title: 'Gestion des Cultures', description: 'Suivez les cultures de la plantation à la récolte avec simplicité.' },
  { image: 'pexels-cenali-2733918.jpg', title: 'Gestion des Stocks', description: 'Surveillez et gérez les stocks de produits agricoles.' },
  // Ajoutez plus de services ici
  { image: 'pexels-nc-farm-bureau-mark-2252618.jpg', title: 'Comptabilité financière', description: 'Ayez un vu gloabl de vos différentes tansactions financières' },
  { image: 'pexels-rattasat-1453152-2804327.jpg', title: 'Prévisions météorologiques', description: 'Planifiez vos activités en tenant compte de la méteo' },
  { image: 'pexels-cenali-2733918.jpg', title: 'Recommandation', description: 'Surveillez les recommandations pour améliorer la productivité' },
  // Ajoutez plus de services ici
])

// Données des témoignages
const testimonials = ref([
  { text: 'Une application incroyable qui a transformé notre gestion de ferme.', author: 'Jean Dupont' },
  { text: 'Facile à utiliser et très efficace pour suivre nos cultures.', author: 'Marie Curie' },
  { text: 'Un outil indispensable pour une gestion agricole moderne.', author: 'Pierre Martin' },
  // Ajoutez plus de témoignages ici
])

// Données des partenaires
const partners = ref([
  { image: 'pexels-fauxels-3184301.jpg', name: 'Partenaire 1' },
  { image: 'pexels-rethaferguson-3811082.jpg', name: 'Partenaire 2' },
  { image: 'pexels-fauxels-3184294.jpg', name: 'Partenaire 3' },
  // Ajoutez plus de partenaires ici
])

// Liens du footer
const links = ref([
  { text: 'Accueil', url: '#' },
  { text: 'Services', url: '#' },
  { text: 'Témoignages', url: '#' },
  { text: 'Partenaires', url: '#' },
  { text: 'Contact', url: '#' },
])

// Redirection vers les pages de connexion et d'inscription
function goToLogin() {
  router.push('connection')
}

function goToRegister() {
  router.push('users/inscription')
}

// Initialiser AOS
onMounted(() => {
  AOS.init({ duration: 1000 });
})



const scrollToSection = (sectionId) => {
  const element = document.getElementById(sectionId);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};
</script>

<style scoped>
/* General Styles */
.header {
  background: url('pexels-fabien-burgue-1052232-2100002.jpg') no-repeat center center;
  background-size: cover;
  color: white;
  padding: 0; /* Suppression de la marge pour utiliser la hauteur complète */
}

.full-height {
  height: 100vh; /* Hauteur de la fenêtre d'affichage */
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Section Title */
.title {
  font-size: 4em;
  font-weight: bold;
  margin-bottom: 20px;
}

.subtitle {
  font-size: 2em;
  margin-bottom: 20px;
}
.decouvrez {
  padding: auto;
  font-size: 1.5em;
}
/* Auth Menu Styles */
.auth-menu {
  padding: 20px;
  display: flex;
  justify-content: center;
  
}

.auth-menu-col {
  padding: 20px;
}

.auth-card {
  max-width: 100%;
  max-height: 100%;
  padding: 0;
}
.text-center {
  font-size: 1.5em;
  padding-top: 5px;
  
}
.bien {
  font-size: 2.5em;
  margin: 0;
  padding: 0;
}
.incon {
  font-size: 1em;
}
/* Services Section */
.services-section {
  background-color: #e8f5e9; /* Vert très clair pour contraste avec le header */
  padding: 50px 0;
}
.services-card {
  justify-content: center;
  
}
.section-title {
  font-size: 2.5em;
  font-weight: bold;
  margin-bottom: 30px;
}
.servititle {
  padding: auto;
  font-size: 2em;
} 
/* Testimonials Section */
.testimonials-section {
  background-color: #1b5e20; /* Vert clair */
  padding:  0;
  
}

.testimonial-card {
  padding: 20px 20px;
  font-style: italic;
}

/* Partners Section */
.partners-section {
  background-color:#e8f5e9; /* Vert moyen */
  padding: 50px 0;
}

.partner-logo {
  max-width: 100%;
  height: auto;
  margin: auto;
  
}

/* Footer */
.footer {
  background-color: #1b5e20; /* Vert foncé */
  color: white;
  padding: 50px 0;
}

.footer-title {
  font-size: 2em;
  margin-bottom: 20px;
}

.footer a {
  color: rgb(3, 0, 0);
  text-decoration: none;
  text-shadow: #15ee1d;
}

.footer a:hover {
  text-decoration: underline;
  color: #15ee1d;
}

.social-links v-icon {
  color: white;
  justify-content: space-between;
}

/* Animations */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.5s;
}
.fade-enter, .fade-leave-to /* .fade-leave-active in <2.1.8 */ {
  opacity: 0;
}

.zoom-in {
  transform: scale(1);
  transition: transform 0.5s;
}
.zoom-in:hover {
  transform: scale(1.1);
}

.full-height {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Responsive Design */
@media (max-width: 600px) {
  .title {
    font-size: 2.5em;
  }
  .subtitle {
    font-size: 1.2em;
  }
 
}
</style>
