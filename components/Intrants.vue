<template>
  <v-container class="pt-4">
    <v-card class="rounded-lg shadow-md pa-6 mb-6">
      <v-card-title class="text-h5 font-weight-bold">
        Gestion des Intrants Agricoles
      </v-card-title>
    </v-card>

    <v-row class="my-4">
      <v-btn @click="changeView('seeds')" :color="buttonColor('seeds')" class="mx-2">Semences</v-btn>
      <v-btn @click="changeView('fertilizers')" :color="buttonColor('fertilizers')" class="mx-2">Fertilisants</v-btn>
      <v-btn @click="changeView('pesticides')" :color="buttonColor('pesticides')" class="mx-2">Pesticides</v-btn>
      <v-btn @click="changeView('stockHistory')" :color="buttonColor('stockHistory')" class="mx-2">Historique</v-btn>
    </v-row>

    <component :is="currentView" @delete-item="handleDelete" @update-item="handleUpdate" @create-item="handleCreate" @load-data="loadData" @clear-form="clearForm"/>
  </v-container>
</template>

<script>
import Seeds from './Semences.vue';
import Fertilizers from './Fertilizers.vue';
import Pesticides from './Pesticides.vue';
import StockHistory from './StockHistoryy.vue';
import axios from '../axios';

export default {
  components: {
    Seeds,
    Fertilizers,
    Pesticides,
    StockHistory,
  },
  data() {
    return {
      view: 'seeds',
    };
  },
  computed: {
    currentView() {
      return this.view.charAt(0).toUpperCase() + this.view.slice(1);
    },
  },
  methods: {
    changeView(view) {
      this.view = view;
    },
    buttonColor(view) {
      return this.view === view ? 'primary' : 'default';
    },
    loadData(view) {
      if (view === 'seeds') {
        axios.get('/seeds').then(response => {
          this.$refs.seeds.seeds = response.data;
        });
      } else if (view === 'fertilizers') {
        axios.get('/fertilizers').then(response => {
          this.$refs.fertilizers.fertilizers = response.data;
        });
      } else if (view === 'pesticides') {
        axios.get('/pesticides').then(response => {
          this.$refs.pesticides.pesticides = response.data;
        });
      }
    },
    handleDelete({ id, type }) {
      axios.delete(`/${type}/${id}`).then(() => {
        this.loadData(this.view);
      });
    },
    handleUpdate({ id, data, type }) {
      axios.put(`/${type}/${id}`, data).then(() => {
        this.loadData(type);
      });
    },
    handleCreate({ data, type }) {
      axios.post(`/${type}`, data).then(() => {
        this.loadData(type);
      });
    },
    clearForm(type) {
      this.$refs[type].clearForm();
    },
  },
  mounted() {
    this.loadData(this.view);
  },
};
</script>
