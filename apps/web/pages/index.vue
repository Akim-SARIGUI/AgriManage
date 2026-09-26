<template>
  <div class="landing-page">
    <!-- Header / Hero -->
    <v-container fluid class="header full-height" id="accueils">
      <v-row align="center" justify="center" class="full-height">
        <v-col cols="12" md="8" class="text-center">
          <h1 class="hero-title pa-4" data-aos="fade-down">Gestion de Ferme Agricole</h1>
          <p class="hero-subtitle pb-8" data-aos="fade-up">
            Optimisez votre production végétale avec notre application.
          </p>
          <v-btn
            color="primary"
            class="pb-12 decouvrez"
            size="large"
            data-aos="zoom-in"
            @click="scrollToSection('services')"
          >
            Découvrez nos services
          </v-btn>
        </v-col>
      </v-row>
    </v-container>

    <!-- Auth menu -->
    <v-container class="auth-menu" fluid>
      <v-row justify="center">
        <v-col cols="12" md="6" lg="4" class="auth-menu-col">
          <v-card class="auth-card" variant="outlined" data-aos="fade-right">
            <v-card-title class="text-center bien">Bienvenue</v-card-title>
            <v-card-text class="text-center">
              <p class="mt-6 mb-6 auth-text">
                Pour accéder à toutes les fonctionnalités de notre application, veuillez vous
                connecter ou vous inscrire.
              </p>
              <v-btn color="primary" class="my-2 incon" data-aos="fade-up" @click="goToLogin">
                Se Connecter
              </v-btn>
              <v-btn
                color="secondary"
                class="my-2 ml-4 incon"
                data-aos="fade-up"
                @click="goToRegister"
              >
                S'inscrire
              </v-btn>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>

    <!-- Services -->
    <v-container class="services-section" id="services" fluid>
      <v-row>
        <v-col cols="12" class="text-center">
          <h2 class="section-title" data-aos="fade-down">Nos Services</h2>
        </v-col>

        <v-col v-for="(service, index) in services" :key="service.title" cols="12" md="4">
          <v-card
            class="service-card pa-8"
            variant="outlined"
            data-aos="fade-up"
            :data-aos-delay="index * 100"
          >
            <v-img
              :src="service.image"
              height="300"
              class="mx-auto"
              cover
            />
            <v-card-title class="text-center servititle">{{ service.title }}</v-card-title>
            <v-card-text class="text-center para">{{ service.description }}</v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>

    <!-- Testimonials -->
    <v-container class="testimonials-section" id="temoignages" fluid>
      <v-row class="pa-4">
        <v-col cols="12" class="text-center">
          <h2 class="section-title text-white" data-aos="fade-down">Témoignages</h2>
        </v-col>
        <v-carousel cycle :interval="5000" show-arrows hide-delimiters height="220">
          <v-carousel-item v-for="(testimonial, index) in testimonials" :key="index">
            <v-card
              class="testimonial-card rounded-lg mx-auto"
              max-width="900"
              data-aos="fade-up"
              :data-aos-delay="index * 100"
            >
              <v-card-text class="text-center italic">
                "{{ testimonial.text }}"
              </v-card-text>
              <v-card-subtitle class="text-center pb-4">
                {{ testimonial.author }}
              </v-card-subtitle>
            </v-card>
          </v-carousel-item>
        </v-carousel>
      </v-row>
    </v-container>

    <!-- Partners -->
    <v-container class="partners-section py-12" id="partenaires" fluid>
      <v-row>
        <v-col cols="12" class="text-center">
          <h2 class="section-title mb-6" data-aos="fade-down">Nos Partenaires</h2>
        </v-col>
      </v-row>
      <v-row class="d-flex justify-center">
        <v-col
          v-for="(partner, index) in partners"
          :key="partner.name"
          cols="12"
          sm="6"
          md="4"
          lg="3"
          class="d-flex justify-center pa-6"
        >
          <v-img
            :src="partner.image"
            :alt="partner.name"
            class="partner-logo elevation-2"
            max-height="160"
            contain
            data-aos="fade-up"
            :data-aos-delay="index * 100"
          />
        </v-col>
      </v-row>
    </v-container>

    <!-- Footer -->
    <v-footer class="footer" id="contacts">
      <v-container>
        <v-row>
          <v-col cols="12" md="3">
            <h3 class="footer-title">À propos</h3>
            <p>
              Nous sommes dédiés à l'optimisation de la production végétale pour un avenir durable.
            </p>
          </v-col>
          <v-col cols="12" md="3">
            <h3 class="footer-title">Liens Utiles</h3>
            <v-list density="compact" bg-color="transparent" class="footer-links">
              <v-list-item v-for="link in links" :key="link.text" :href="link.url">
                <v-list-item-title>{{ link.text }}</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-col>
          <v-col cols="12" md="3">
            <h3 class="footer-title">Contact</h3>
            <p>Adresse : 123 Rue de l'Agriculture, Abomey-Calavi, Bénin</p>
            <p>Téléphone : +229 0194751954</p>
            <p>Email : info@fermeagricole.com</p>
          </v-col>
          <v-col cols="12" md="3">
            <h3 class="footer-title">Suivez-nous</h3>
            <div class="social-links d-flex ga-4">
              <v-icon size="large">mdi-facebook</v-icon>
              <v-icon size="large">mdi-twitter</v-icon>
              <v-icon size="large">mdi-linkedin</v-icon>
              <v-icon size="large">mdi-instagram</v-icon>
            </div>
          </v-col>
        </v-row>
        <v-row class="text-center mt-8">
          <v-col>
            <p>© 2024 Gestion de Ferme Agricole. Tous droits réservés.</p>
          </v-col>
        </v-row>
      </v-container>
    </v-footer>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'landing',
});

const services = [
  {
    image: '/pexels-nc-farm-bureau-mark-2252618.jpg',
    title: 'Gestion des Parcelles',
    description: 'Optimisez l’utilisation de chaque parcelle de terrain.',
  },
  {
    image: '/pexels-rattasat-1453152-2804327.jpg',
    title: 'Gestion des Cultures',
    description: 'Suivez les cultures de la plantation à la récolte avec simplicité.',
  },
  {
    image: '/pexels-cenali-2733918.jpg',
    title: 'Gestion des Stocks',
    description: 'Surveillez et gérez les stocks de produits agricoles.',
  },
  {
    image: '/calendar-header.jpg',
    title: 'Comptabilité financière',
    description: 'Ayez un vu gloabl de vos différentes tansactions financières',
  },
  {
    image: '/met.jpg',
    title: 'Prévisions météorologiques',
    description: 'Planifiez vos activités en tenant compte de la méteo',
  },
  {
    image: '/recom.jpeg',
    title: 'Recommandation',
    description: 'Surveillez les recommandations pour améliorer la productivité',
  },
];

const testimonials = [
  {
    text: 'Une application incroyable qui a transformé notre gestion de ferme.',
    author: 'Alassane Machoudou',
  },
  {
    text: 'Facile à utiliser et très efficace pour suivre nos cultures.',
    author: 'Attou Samuel',
  },
  {
    text: 'Un outil indispensable pour une gestion agricole moderne.',
    author: 'Dogo Jean',
  },
];

const partners = [
  { image: '/pexels-fauxels-3184301.jpg', name: 'Partenaire 1' },
  { image: '/pexels-rethaferguson-3811082.jpg', name: 'Partenaire 2' },
  { image: '/pexels-fauxels-3184294.jpg', name: 'Partenaire 3' },
];

const links = [
  { text: 'Accueil', url: '#accueils' },
  { text: 'Services', url: '#services' },
  { text: 'Témoignages', url: '#temoignages' },
  { text: 'Partenaires', url: '#partenaires' },
  { text: 'Contact', url: '#contacts' },
];

onMounted(async () => {
  const [{ default: AOS }] = await Promise.all([
    import('aos'),
    import('aos/dist/aos.css'),
  ]);
  AOS.init({ duration: 1000, once: true });
});

function goToLogin() {
  void navigateTo('/auth/login');
}

function goToRegister() {
  void navigateTo('/auth/register');
}

function scrollToSection(sectionId: string) {
  const element = document.getElementById(sectionId);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
</script>

<style scoped>
.landing-page {
  background: #fff;
}

.header {
  background: url('/pexels-fabien-burgue-1052232-2100002.jpg') no-repeat center center;
  background-size: cover;
  color: white;
  padding: 0;
  position: relative;
}

.header::before {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
}

.header > * {
  position: relative;
  z-index: 1;
}

.full-height {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hero-title {
  font-size: 4em;
  font-weight: bold;
  margin-bottom: 20px;
  text-shadow: 0 2px 12px rgba(0, 0, 0, 0.45);
}

.hero-subtitle {
  font-size: 2em;
  margin-bottom: 20px;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
}

.decouvrez {
  font-size: 1.25em;
}

.auth-menu {
  padding: 20px;
  display: flex;
  justify-content: center;
}

.auth-menu-col {
  padding: 20px;
}

.auth-text {
  font-size: 1.1rem;
  line-height: 1.5;
}

.bien {
  font-size: 2.5em;
}

.incon {
  font-size: 1em;
}

.services-section {
  background-color: #e8f5e9;
  padding: 50px 0;
}

.section-title {
  font-size: 2.5em;
  font-weight: bold;
  margin-bottom: 30px;
  color: #1a2e1c;
}

.servititle {
  font-size: 1.6em;
  white-space: normal;
}

.para {
  font-size: 1.05rem;
}

.testimonials-section {
  background-color: #1b5e20;
  padding: 40px 0;
}

.testimonial-card {
  padding: 20px;
  font-style: italic;
}

.partners-section {
  background-color: #e8f5e9;
  padding: 50px 0;
}

.partner-logo {
  max-width: 100%;
  width: 220px;
  border-radius: 8px;
  overflow: hidden;
}

.footer {
  background-color: #1b5e20;
  color: white;
  padding: 50px 0;
}

.footer-title {
  font-size: 1.6em;
  margin-bottom: 20px;
}

.footer-links :deep(.v-list-item-title) {
  color: #fff;
}

.footer-links :deep(.v-list-item:hover .v-list-item-title) {
  color: #15ee1d;
}

.social-links :deep(.v-icon) {
  color: white;
}

@media (max-width: 600px) {
  .hero-title {
    font-size: 2.5em;
  }

  .hero-subtitle {
    font-size: 1.2em;
  }
}
</style>
