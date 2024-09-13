<template>
  <v-card class="mx-auto" max-width="600">
    <v-card-title>
      Historique des Mouvements de Stock
    </v-card-title>
    <v-list>
      <v-list-item-group v-if="history.length">
        <v-list-item v-for="entry in history" :key="entry.id">
          <v-list-item-content>
            <v-list-item-title>{{ entry.productName }}</v-list-item-title>
            <v-list-item-subtitle>{{ entry.quantity }} {{ entry.unit }} - {{ entry.type }} le {{ entry.date }}</v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>
      </v-list-item-group>
      <v-list-item v-else>
        <v-list-item-content>
          <v-list-item-title>Aucun mouvement enregistré.</v-list-item-title>
        </v-list-item-content>
      </v-list-item>
    </v-list>
  </v-card>
</template>

<script>
export default {
  props: {
    history: Array
  }
};
</script>
