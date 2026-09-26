<template>
  <div class="container mx-auto p-4">
    <v-btn @click="openDialog" color="primary">Voir les Rapports</v-btn>

    <v-dialog v-model="dialog" max-width="500px">
      <v-card>
        <v-card-title>
          <span class="headline">Alerte</span>
        </v-card-title>
        <v-card-text>
          <p>
            Pour voir vos rapports, vous devez finir votre saison de culture. 
            Référez-vous aux autres interfaces pour plus d'informations.
          </p>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" @click="closeDialog">Fermer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
// Importing necessary libraries
import { ref } from 'vue';

// Reactive reference for dialog visibility
const dialog = ref(false);

// Function to open the dialog
function openDialog() {
  dialog.value = true;
}

// Function to close the dialog
function closeDialog() {
  dialog.value = false;
}
</script>

<style scoped>
.headline {
  font-weight: bold;
}
.container {
  max-width: 800px; /* Adjust max-width as needed */
}
</style>
