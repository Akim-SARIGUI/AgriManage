<template>
  <v-dialog v-model="dialog" persistent max-width="600px">
    <v-card>
      <v-card-title>
        <span class="text-h5">{{ isEditMode ? 'Modifier Parcelle' : 'Créer Parcelle' }}</span>
      </v-card-title>
      <v-card-text>
        <v-form ref="form">
          <v-text-field v-model="formData.name" label="Nom de la Parcelle" required></v-text-field>
          <v-text-field v-model="formData.dimension" label="Dimension (en hectares)" required></v-text-field>
          <v-text-field v-model="formData.location" label="Localisation" required></v-text-field>
          <v-row>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="formattedDate"
                label="Sélectionner une date"
                prepend-icon="mdi-calendar"
                readonly
                @click="menu = true"
              ></v-text-field>
              <v-menu
                v-model="menu"
                :close-on-content-click="false"
                transition="scale-transition"
                offset-y
                min-width="auto"
              >
                <v-date-picker v-model="formData.date" @input="updateDate" @close="menu = false"></v-date-picker>
              </v-menu>
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="green darken-1" text @click="saveParcelle">Enregistrer</v-btn>
        <v-btn color="red darken-1" text @click="cancelParcelle">Annuler</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-snackbar v-model="snackbar" color="green" timeout="3000">
    Parcelle créée avec succès !
    <v-btn color="white" text @click="snackbar = false">Fermer</v-btn>
  </v-snackbar>
</template>

<script>
export default {
  data() {
    return {
      dialog: false,
      isEditMode: false,
      formData: {
        name: '',
        dimension: '',
        location: '',
        date: null
      },
      menu: false,
      snackbar: false,
      formattedDate: ''
    };
  },
  methods: {
    updateDate() {
      this.formattedDate = this.formatDate(this.formData.date);
      this.menu = false;
    },
    formatDate(date) {
      if (!date) return '';
      const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
      return new Date(date).toLocaleDateString('fr-FR', options);
    },
    saveParcelle() {
      if (this.$refs.form.validate()) {
        // Code pour enregistrer la parcelle ici
        this.snackbar = true;
        this.dialog = false;
        // Réinitialiser le formulaire après l'enregistrement
        this.resetForm();
      }
    },
    cancelParcelle() {
      this.dialog = false;
    },
    resetForm() {
      this.formData = {
        name: '',
        dimension: '',
        location: '',
        date: null
      };
      this.formattedDate = '';
    }
  }
};
</script>

<style scoped>
.v-card-title {
  justify-content: center;
}
</style>
