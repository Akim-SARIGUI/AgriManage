<template>
  <v-card class="mx-auto" max-width="600">
    <v-card-title>
      Enregistrement des {{ type }} de stock
    </v-card-title>
    <v-form @submit.prevent="submitForm">
      <v-card-subtitle>
        <v-alert v-if="alerts.noProductSelected" type="error" dismissible>Un produit doit être sélectionné.</v-alert>
        <v-alert v-if="alerts.invalidQuantity" type="error" dismissible>La quantité doit être supérieure à 0.</v-alert>
        <v-alert v-if="insufficientStock" type="error" dismissible>Quantité insuffisante en stock.</v-alert>
      </v-card-subtitle>
      <v-card-text>
        <v-select 
          :items="products" 
          :value="change.productId" 
          @change="change.productId = $event" 
          item-text="name" 
          item-value="id" 
          label="Produit" 
          outlined 
          dense
        ></v-select>
        <v-text-field 
          :value="change.quantity" 
          @input="change.quantity = $event" 
          label="Quantité" 
          outlined 
          dense 
          type="number"
        ></v-text-field>
      </v-card-text>
      <v-card-actions>
        <v-btn @click="clearForm" color="secondary">Annuler</v-btn>
        <v-btn type="submit" color="primary">Enregistrer</v-btn>
      </v-card-actions>
    </v-form>
  </v-card>
</template>

<script>
export default {
  props: {
    products: Array,
    change: Object,
    alerts: Object,
    type: String,
    insufficientStock: Boolean
  },
  methods: {
    submitForm() {
      if (!this.change.productId || this.change.quantity <= 0) {
        this.$emit('submit', null);
        return;
      }
      this.$emit('submit', this.change);
    },
    clearForm() {
      this.$emit('clear');
    }
  }
};
</script>
