<template>
  <v-card class="mx-auto" max-width="600">
    <v-card-title>
      {{ isEditing ? 'Modifier le Produit' : 'Ajouter un Produit' }}
    </v-card-title>
    <v-form @submit.prevent="submitForm">
      <v-card-subtitle>
        <v-alert v-if="alerts.invalidName" type="error" dismissible>Le nom du produit est requis.</v-alert>
        <v-alert v-if="alerts.invalidQuantity" type="error" dismissible>La quantité doit être supérieure à 0.</v-alert>
        <v-alert v-if="alerts.productExists" type="error" dismissible>Le produit existe déjà.</v-alert>
      </v-card-subtitle>
      <v-card-text>
        <v-text-field 
          :value="product.name" 
          @input="product.name = $event" 
          label="Nom du produit" 
          outlined 
          dense
        ></v-text-field>
        <v-text-field 
          :value="product.quantity" 
          @input="product.quantity = $event" 
          label="Quantité" 
          outlined 
          dense 
          type="number"
        ></v-text-field>
        <v-text-field 
          :value="product.unit" 
          @input="product.unit = $event" 
          label="Unité" 
          outlined 
          dense
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
    product: Object,
    alerts: Object,
    isEditing: Boolean
  },
  methods: {
    submitForm() {
      if (!this.product.name || this.product.quantity <= 0) {
        this.$emit('save', null);
        return;
      }
      this.$emit('save', this.product);
    },
    clearForm() {
      this.$emit('clear');
    }
  }
};
</script>
