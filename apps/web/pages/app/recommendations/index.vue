<template>
  <div class="space-y-4">
    <AgriPageCard
      title="Guide Complet des Bonnes Pratiques Agricoles"
      icon="mdi-information-outline"
      subtitle="Optimisez vos pratiques pour de meilleurs rendements"
    >
      <p class="text-body-1 leading-relaxed">
        Ce guide fournit des recommandations détaillées pour optimiser vos pratiques agricoles.
        Lisez attentivement chaque section pour découvrir les meilleures techniques et conseils.
      </p>
    </AgriPageCard>

    <v-card
      v-for="section in sections"
      :key="section.title"
      class="agri-page-card pa-0 elevation-5"
      outlined
    >
      <v-card-title class="text-wrap py-4">
        <v-icon :color="section.color" class="mr-2">{{ section.icon }}</v-icon>
        <span class="text-subtitle-1 font-weight-bold">{{ section.title }}</span>
      </v-card-title>
      <v-card-text>
        <p
          v-for="(paragraph, index) in section.paragraphs"
          :key="index"
          class="mb-3 text-body-1 leading-relaxed"
        >
          {{ paragraph }}
        </p>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'app',
  middleware: ['auth'],
});

const sections = [
  {
    title: '1. Choix des Cultures Appropriées',
    icon: 'mdi-leaf',
    color: 'green',
    paragraphs: [
      'Le choix des cultures est crucial pour optimiser la production agricole. Choisissez des cultures adaptées à votre climat local, à la qualité du sol et aux conditions saisonnières. Envisagez d’utiliser des variétés résistantes aux maladies et aux conditions climatiques extrêmes.',
      'La rotation des cultures est essentielle pour maintenir la fertilité du sol. Évaluez aussi la demande du marché local pour améliorer la rentabilité.',
    ],
  },
  {
    title: '2. Techniques d’Irrigation Modernes',
    icon: 'mdi-water',
    color: 'blue',
    paragraphs: [
      'Les systèmes d’irrigation goutte-à-goutte offrent une distribution précise de l’eau aux racines, réduisent le gaspillage et améliorent l’efficacité. Les capteurs d’humidité aident à automatiser les apports.',
      'Surveillez régulièrement les systèmes et adaptez les horaires selon le climat et les besoins des cultures.',
    ],
  },
  {
    title: '3. Amélioration et Gestion des Sols',
    icon: 'mdi-terrain',
    color: 'brown',
    paragraphs: [
      'Réalisez des analyses de sol régulières. Compost et amendements organiques améliorent structure, rétention d’eau et croissance.',
      'Le paillage conserve l’humidité et limite les adventices. Pratiquez la rotation pour éviter l’épuisement des nutriments.',
    ],
  },
  {
    title: '4. Choix des Semences Certifiées',
    icon: 'mdi-seed',
    color: 'orange',
    paragraphs: [
      'Les semences certifiées assurent une bonne germination et une résistance accrue. Approvisionnez-vous chez des fournisseurs fiables adaptés à votre zone.',
      'Vérifiez les labels de certification et les recommandations variétales avant l’achat.',
    ],
  },
  {
    title: '5. Profondeur Optimale de Plantation',
    icon: 'mdi-sprout',
    color: 'green',
    paragraphs: [
      'Planter à la profondeur recommandée protège les graines et favorise une croissance uniforme.',
      'Trop superficiel expose aux aléas ; trop profond freine la levée.',
    ],
  },
  {
    title: '6. Application Raisonnée de Fertilisants',
    icon: 'mdi-bottle-tonic',
    color: 'red',
    paragraphs: [
      'Basez les doses sur l’analyse de sol pour éviter gaspillage et pollution.',
      'Préférez les fertilisants organiques qui améliorent la qualité du sol sur la durée.',
    ],
  },
  {
    title: '7. Utilisation d’Engrais à Libération Contrôlée',
    icon: 'mdi-molecule',
    color: 'purple',
    paragraphs: [
      'Ils fournissent les nutriments progressivement, réduisent les pertes et conviennent aux cultures longues.',
      'Choisissez des formules adaptées au sol et à la culture.',
    ],
  },
  {
    title: '8. Planification des Travaux',
    icon: 'mdi-calendar',
    color: 'grey',
    paragraphs: [
      'Planifiez plantation, irrigation, fertilisation et récolte avec un calendrier clair.',
      'Ajustez selon la météo et les stades culturaux pour optimiser les ressources.',
    ],
  },
  {
    title: '9. Suivi et Analyse des Performances',
    icon: 'mdi-chart-line',
    color: 'teal',
    paragraphs: [
      'Suivez croissance, rendements et conditions pour détecter tôt les problèmes.',
      'Analysez les tendances pour décider et améliorer la rentabilité.',
    ],
  },
  {
    title: '10. Maintenance des Équipements',
    icon: 'mdi-cogs',
    color: 'pink',
    paragraphs: [
      'Entretenez régulièrement machines et outils selon les recommandations constructeur.',
      'Une maintenance préventive évite les pannes en pleine saison.',
    ],
  },
];
</script>
