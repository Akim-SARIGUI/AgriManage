<template>
  <v-app>
    <v-container fluid>
      <!-- Header Section -->
      <v-row class="my-6">
        <v-col cols="12">
          <v-card class="pa-6" outlined>
            <v-card-title>
              <v-icon left color="primary">mdi-information-outline</v-icon>
              <span class="headline">Guide Complet des Bonnes Pratiques Agricoles</span>
            </v-card-title>
            <v-card-text>
              <p>
                Ce guide fournit des recommandations détaillées pour optimiser vos pratiques agricoles. 
                Lisez attentivement chaque section pour découvrir les meilleures techniques et conseils pour améliorer vos rendements et garantir la santé de vos cultures.
              </p>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Detailed Recommendations Section -->
      <v-row class="my-6">
        <v-col cols="12">
          <v-card class="pa-6 animated-section" outlined>
            <v-card-title>
              <v-icon left color="green">mdi-leaf</v-icon>
              <span class="headline">1. Choix des Cultures Appropriées</span>
            </v-card-title>
            <v-card-text>
              <p>
                Le choix des cultures est crucial pour optimiser la production agricole. Choisissez des cultures adaptées à votre climat local, à la qualité du sol et aux conditions saisonnières. Envisagez d'utiliser des variétés résistantes aux maladies et aux conditions climatiques extrêmes pour garantir une croissance robuste et des rendements élevés. La rotation des cultures est également essentielle pour maintenir la fertilité du sol et prévenir l'accumulation de maladies spécifiques.
              </p>
              <p>
                En outre, la sélection de cultures compatibles avec les besoins du marché local peut améliorer la rentabilité. Assurez-vous d'évaluer les conditions locales telles que l'humidité, la température et les types de sol avant de faire vos choix.
              </p>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <v-row class="my-6">
        <v-col cols="12">
          <v-card class="pa-6 animated-section" outlined>
            <v-card-title>
              <v-icon left color="blue">mdi-water</v-icon>
              <span class="headline">2. Techniques d’Irrigation Modernes</span>
            </v-card-title>
            <v-card-text>
              <p>
                L'irrigation est un aspect clé de la gestion des cultures, surtout dans les zones sujettes à la sécheresse. Les systèmes d'irrigation goutte-à-goutte offrent une distribution précise et efficace de l'eau directement aux racines des plantes, ce qui réduit le gaspillage et améliore l'efficacité de l'eau. L'utilisation de capteurs d'humidité pour automatiser l'irrigation peut également optimiser les besoins en eau et économiser du temps.
              </p>
              <p>
                Il est conseillé de surveiller régulièrement les systèmes d'irrigation pour s'assurer qu'ils fonctionnent correctement et d'adapter les horaires d'irrigation en fonction des conditions climatiques et des besoins des cultures.
              </p>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <v-row class="my-6">
        <v-col cols="12">
          <v-card class="pa-6 animated-section" outlined>
            <v-card-title>
              <v-icon left color="brown">mdi-soil</v-icon>
              <span class="headline">3. Amélioration et Gestion des Sols</span>
            </v-card-title>
            <v-card-text>
              <p>
                La santé du sol est fondamentale pour une production agricole réussie. Réalisez des analyses de sol régulières pour identifier les carences en nutriments et ajuster les apports en conséquence. L'utilisation de compost et d'autres amendements organiques peut améliorer la structure du sol, augmenter sa capacité de rétention d'eau et favoriser une meilleure croissance des plantes.
              </p>
              <p>
                Le paillage est une autre pratique bénéfique qui aide à conserver l'humidité du sol, à réduire les mauvaises herbes et à améliorer la fertilité du sol. Assurez-vous également de pratiquer la rotation des cultures pour éviter l'épuisement des nutriments et la propagation des maladies.
              </p>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <v-row class="my-6">
        <v-col cols="12">
          <v-card class="pa-6 animated-section" outlined>
            <v-card-title>
              <v-icon left color="orange">mdi-seed</v-icon>
              <span class="headline">4. Choix des Semences Certifiées</span>
            </v-card-title>
            <v-card-text>
              <p>
                L'utilisation de semences certifiées est essentielle pour assurer une bonne germination et une résistance accrue aux maladies. Procurez-vous des semences auprès de fournisseurs fiables et assurez-vous qu'elles sont adaptées aux conditions climatiques locales et aux types de sol.
              </p>
              <p>
                Les semences certifiées offrent généralement une meilleure qualité et des rendements plus élevés. Vérifiez les labels de certification et les recommandations spécifiques pour chaque variété avant de les acheter.
              </p>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <v-row class="my-6">
        <v-col cols="12">
          <v-card class="pa-6 animated-section" outlined>
            <v-card-title>
              <v-icon left color="yellow">mdi-plant</v-icon>
              <span class="headline">5. Profondeur Optimale de Plantation</span>
            </v-card-title>
            <v-card-text>
              <p>
                La profondeur de plantation est cruciale pour assurer une germination optimale des semences. Planter les graines à la profondeur recommandée permet de protéger les graines des conditions climatiques extrêmes et d'assurer un bon contact avec le sol, favorisant ainsi une croissance uniforme.
              </p>
              <p>
                Suivez les recommandations spécifiques pour chaque culture concernant la profondeur de plantation. Une plantation trop superficielle peut exposer les graines aux conditions climatiques, tandis qu'une plantation trop profonde peut entraver la croissance des plantules.
              </p>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <v-row class="my-6">
        <v-col cols="12">
          <v-card class="pa-6 animated-section" outlined>
            <v-card-title>
              <v-icon left color="red">mdi-fertilizer</v-icon>
              <span class="headline">6. Application Raisonnée de Fertilisants</span>
            </v-card-title>
            <v-card-text>
              <p>
                L'application raisonnée des fertilisants est essentielle pour éviter le gaspillage et minimiser l'impact environnemental. Réalisez des analyses de sol pour déterminer les besoins spécifiques en nutriments de vos cultures. L'application de fertilisants doit être ajustée en fonction des résultats de ces analyses pour répondre précisément aux besoins des plantes.
              </p>
              <p>
                Préférez les fertilisants organiques qui améliorent la qualité du sol tout en fournissant les nutriments nécessaires. Évitez les excès qui peuvent entraîner une pollution des eaux et des sols.
              </p>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <v-row class="my-6">
        <v-col cols="12">
          <v-card class="pa-6 animated-section" outlined>
            <v-card-title>
              <v-icon left color="purple">mdi-chemistry</v-icon>
              <span class="headline">7. Utilisation d’Engrais à Libération Contrôlée</span>
            </v-card-title>
            <v-card-text>
              <p>
                Les engrais à libération contrôlée permettent une fourniture progressive des nutriments aux plantes. Cette méthode réduit le gaspillage et améliore l'efficacité des fertilisants. Elle est particulièrement utile pour les cultures à long terme qui nécessitent une alimentation constante.
              </p>
              <p>
                Assurez-vous de choisir des engrais adaptés à vos cultures et à vos conditions de sol pour obtenir les meilleurs résultats. Les engrais à libération contrôlée contribuent également à minimiser la pollution des nappes phréatiques.
              </p>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <v-row class="my-6">
        <v-col cols="12">
          <v-card class="pa-6 animated-section" outlined>
            <v-card-title>
              <v-icon left color="grey">mdi-calendar</v-icon>
              <span class="headline">8. Planification des Travaux</span>
            </v-card-title>
            <v-card-text>
              <p>
                La planification des travaux agricoles est essentielle pour assurer la bonne marche des opérations tout au long de la saison. Utilisez des outils de gestion pour planifier les tâches telles que la plantation, l'irrigation, la fertilisation, et la récolte.
              </p>
              <p>
                Établissez un calendrier précis des tâches à réaliser et ajustez-le en fonction des conditions climatiques et des besoins des cultures. La planification aide à éviter les retards et à optimiser l'utilisation des ressources.
              </p>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <v-row class="my-6">
        <v-col cols="12">
          <v-card class="pa-6 animated-section" outlined>
            <v-card-title>
              <v-icon left color="teal">mdi-chart-line</v-icon>
              <span class="headline">9. Suivi et Analyse des Performances</span>
            </v-card-title>
            <v-card-text>
              <p>
                Le suivi régulier des performances des cultures permet d'identifier les problèmes tôt et d'ajuster les pratiques en conséquence. Utilisez des outils de suivi pour collecter des données sur la croissance des plantes, les rendements, et les conditions environnementales.
              </p>
              <p>
                Analysez les données collectées pour identifier les tendances et prendre des décisions éclairées pour améliorer les pratiques agricoles. Le suivi et l'analyse permettent d'optimiser les rendements et d'augmenter la rentabilité.
              </p>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <v-row class="my-6">
        <v-col cols="12">
          <v-card class="pa-6 animated-section" outlined>
            <v-card-title>
              <v-icon left color="pink">mdi-cogs</v-icon>
              <span class="headline">10. Maintenance des Équipements</span>
            </v-card-title>
            <v-card-text>
              <p>
                La maintenance régulière des équipements agricoles est cruciale pour garantir leur bon fonctionnement et prolonger leur durée de vie. Suivez les recommandations du fabricant pour l'entretien des machines et effectuez des vérifications régulières pour éviter les pannes imprévues.
              </p>
              <p>
                Assurez-vous que tous les équipements sont en bon état avant le début de chaque saison. Une maintenance préventive aide à éviter les interruptions de travail et assure une performance optimale.
              </p>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

    </v-container>
  </v-app>
</template>

<script>
export default {
  name: 'RecommandationsAgricoles'
}
</script>

<style scoped>
.animated-section {
  animation: fadeIn 1s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
