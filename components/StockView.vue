<template>
  <v-container class="pt-4">
    <!-- Titre de la section -->
    <v-row>
      <v-col>
        <v-card class="mx-auto" max-width="600">
          <v-card-title class="text-h4 font-weight-bold text-center text-success">
            🌱 Gestion de Stock Agricole 🌱
          </v-card-title>
        </v-card>
      </v-col>
    </v-row>

    <!-- Boutons pour changer de vue -->
    <v-row class="my-4">
      <v-btn @click="changeView('stock')" :color="buttonColor('stock')" class="mx-2">Voir le Stock</v-btn>
      <v-btn @click="changeView('addProduct')" :color="buttonColor('addProduct')" class="mx-2">Ajouter un Produit</v-btn>
      <v-btn @click="changeView('stockEntry')" :color="buttonColor('stockEntry')" class="mx-2">Entrée de Stock</v-btn>
      <v-btn @click="changeView('stockExit')" :color="buttonColor('stockExit')" class="mx-2">Sortie de Stock</v-btn>
      <v-btn @click="changeView('stockHistory')" :color="buttonColor('stockHistory')" class="mx-2">Historique des Mouvements</v-btn>
    </v-row>

    <!-- Vue du stock complet -->
    <transition name="fade" mode="out-in">
      <v-card v-if="view === 'stock'" class="rounded-lg shadow-md pa-6 mb-6">
        <v-card-title class="text-h5 font-weight-bold text-success">
          Bilan Complet du Stock
        </v-card-title>
        <v-text-field v-model="search" label="Rechercher un produit" append-icon="mdi-magnify" class="mb-4"></v-text-field>
        <v-list dense>
          <v-list-item-group v-for="product in filteredProducts" :key="product.id">
            <v-list-item>
              <v-list-item-content>
                <v-list-item-title>{{ product.name }}</v-list-item-title>
                <v-list-item-subtitle :class="{'text-error': product.quantity <= 0, 'text-success': product.quantity > 0}">
                  Quantité: {{ product.quantity }} {{ product.unit }} ({{ product.quantity <= 0 ? 'Stock épuisé' : 'Suffisant' }})
                </v-list-item-subtitle>
              </v-list-item-content>
              <v-list-item-action>
                <v-btn @click="selectProduct(product)" icon>
                  <v-icon>mdi-pencil</v-icon>
                </v-btn>
                <v-btn @click="confirmDelete(product.id)" icon>
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
              </v-list-item-action>
            </v-list-item>
          </v-list-item-group>
          <v-list-item v-if="filteredProducts.length === 0">
            <v-list-item-content>
              <v-list-item-title>Aucun produit en stock</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </v-card>
    </transition>

    <!-- Formulaire pour ajouter ou modifier un produit -->
    <transition name="fade" mode="out-in">
      <v-card v-if="view === 'addProduct'" class="rounded-lg shadow-md pa-6 mb-6">
        <v-card-title class="text-h5 font-weight-bold text-success">
          Ajouter un Produit
        </v-card-title>
        <v-form @submit.prevent="saveProduct">
          <v-text-field v-model="newProduct.name" label="Nom du Produit" outlined required></v-text-field>
          <v-text-field v-model.number="newProduct.quantity" label="Quantité" type="number" min="0" outlined required></v-text-field>
          <v-text-field v-model="newProduct.unit" label="Unité de Mesure" outlined required></v-text-field>
          <v-btn type="submit" color="success">{{ selectedProductId ? 'Modifier' : 'Ajouter' }}</v-btn>
          <v-btn @click="clearForm" color="error">Annuler</v-btn>
        </v-form>
        <v-alert v-if="alerts.productExists" type="error" outlined class="mt-4">
          Ce produit existe déjà !
        </v-alert>
        <v-alert v-if="alerts.invalidName" type="error" outlined class="mt-4">
          Nom de produit invalide ! Veuillez entrer un nom valide.
        </v-alert>
        <v-alert v-if="alerts.invalidQuantity" type="error" outlined class="mt-4">
          Quantité invalide ! Veuillez entrer une quantité supérieure à zéro.
        </v-alert>
      </v-card>
    </transition>

    <!-- Formulaire pour enregistrer une entrée de stock -->
    <transition name="fade" mode="out-in">
      <v-card v-if="view === 'stockEntry'" class="rounded-lg shadow-md pa-6 mb-6">
        <v-card-title class="text-h5 font-weight-bold text-success">
          Entrée de Stock
        </v-card-title>
        <v-form @submit.prevent="updateStock('Ajout')">
          <v-select v-model="stockChange.productId" :items="products" item-text="name" item-value="id" label="Produit" outlined required></v-select>
          <v-text-field v-model.number="stockChange.quantity" label="Quantité" type="number" min="1" outlined required></v-text-field>
          <v-btn type="submit" color="success">Enregistrer</v-btn>
        </v-form>
        <v-alert v-if="alerts.noProductSelected" type="error" outlined class="mt-4">
          Veuillez sélectionner un produit !
        </v-alert>
        <v-alert v-if="alerts.invalidQuantity" type="error" outlined class="mt-4">
          Quantité invalide ! Veuillez entrer une quantité supérieure à zéro.
        </v-alert>
      </v-card>
    </transition>

    <!-- Formulaire pour enregistrer une sortie de stock -->
    <transition name="fade" mode="out-in">
      <v-card v-if="view === 'stockExit'" class="rounded-lg shadow-md pa-6 mb-6">
        <v-card-title class="text-h5 font-weight-bold text-error">
          Sortie de Stock
        </v-card-title>
        <v-form @submit.prevent="updateStock('Retrait')">
          <v-select v-model="stockChange.productId" :items="products" item-text="name" item-value="id" label="Produit" outlined required></v-select>
          <v-text-field v-model.number="stockChange.quantity" label="Quantité" type="number" min="1" outlined required></v-text-field>
          <v-btn type="submit" color="error">Enregistrer</v-btn>
        </v-form>
        <v-alert v-if="alerts.noProductSelected" type="error" outlined class="mt-4">
          Veuillez sélectionner un produit !
        </v-alert>
        <v-alert v-if="insufficientStock" type="error" outlined class="mt-4">
          Stock insuffisant pour cette sortie !
        </v-alert>
        <v-alert v-if="alerts.invalidQuantity" type="error" outlined class="mt-4">
          Quantité invalide ! Veuillez entrer une quantité supérieure à zéro.
        </v-alert>
      </v-card>
    </transition>

    <!-- Affichage de l'historique des mouvements de stock -->
    <transition name="slide-fade" mode="out-in">
      <v-card v-if="view === 'stockHistory'" class="rounded-lg shadow-md pa-6 mb-6">
        <v-card-title class="text-h5 font-weight-bold text-success">
          Historique des Mouvements de Stock
        </v-card-title>
        <v-row>
          <!-- Historique des Entrées -->
          <v-col>
            <v-subheader class="text-h6 font-weight-bold text-success">Entrées</v-subheader>
            <v-list dense>
              <v-list-item v-for="entry in stockHistory.filter(e => e.type === 'Ajout')" :key="entry.id">
                <v-list-item-content>
                  <v-list-item-title>{{ entry.productName }} - Entrée de {{ entry.quantity }} {{ entry.unit }}</v-list-item-title>
                  <v-list-item-subtitle>{{ entry.date }}</v-list-item-subtitle>
                </v-list-item-content>
              </v-list-item>
            </v-list>
          </v-col>

          <!-- Historique des Sorties -->
          <v-col>
            <v-subheader class="text-h6 font-weight-bold text-error">Sorties</v-subheader>
            <v-list dense>
              <v-list-item v-for="exit in stockHistory.filter(e => e.type === 'Retrait')" :key="exit.id">
                <v-list-item-content>
                  <v-list-item-title>{{ exit.productName }} - Sortie de {{ exit.quantity }} {{ exit.unit }}</v-list-item-title>
                  <v-list-item-subtitle>{{ exit.date }}</v-list-item-subtitle>
                </v-list-item-content>
              </v-list-item>
            </v-list>
          </v-col>
        </v-row>
      </v-card>
    </transition>
  </v-container>
</template>

<script>
export default {
  data() {
    return {
      view: 'stock',
      products: [],
      stockHistory: [],
      selectedProductId: null,
      newProduct: { name: '', quantity: 0, unit: '' },
      stockChange: { productId: null, quantity: 0 },
      search: '',
      alerts: {
        productExists: false,
        invalidName: false,
        invalidQuantity: false,
        noProductSelected: false,
      },
      insufficientStock: false,
    };
  },
  computed: {
    filteredProducts() {
      return this.products.filter(product =>
        product.name.toLowerCase().includes(this.search.toLowerCase())
      );
    },
  },
  methods: {
    changeView(view) {
      this.view = view;
      this.clearForm();
    },
    buttonColor(view) {
      return this.view === view ? 'primary' : 'secondary';
    },
    saveProduct() {
      if (!this.newProduct.name || this.newProduct.quantity <= 0) {
        this.alerts.invalidName = !this.newProduct.name;
        this.alerts.invalidQuantity = this.newProduct.quantity <= 0;
        return;
      }

      const productExists = this.products.find(p => p.name === this.newProduct.name);
      if (productExists) {
        this.alerts.productExists = true;
        return;
      }

      this.alerts.productExists = false;
      this.alerts.invalidName = false;
      this.alerts.invalidQuantity = false;

      if (this.selectedProductId) {
        const productIndex = this.products.findIndex(p => p.id === this.selectedProductId);
        if (productIndex !== -1) {
          this.products[productIndex] = { ...this.newProduct, id: this.selectedProductId };
        }
        this.selectedProductId = null;
      } else {
        const newProduct = { ...this.newProduct, id: Date.now() };
        this.products.push(newProduct);
        this.addStockHistory(newProduct, 'Ajout');
      }

      this.clearForm();
    },
    updateStock(type) {
      if (!this.stockChange.productId || this.stockChange.quantity <= 0) {
        this.alerts.noProductSelected = !this.stockChange.productId;
        this.alerts.invalidQuantity = this.stockChange.quantity <= 0;
        return;
      }

      const product = this.products.find(p => p.id === this.stockChange.productId);
      if (!product) return;

      if (type === 'Retrait' && product.quantity < this.stockChange.quantity) {
        this.insufficientStock = true;
        return;
      }

      this.insufficientStock = false;

      if (type === 'Ajout') {
        product.quantity += this.stockChange.quantity;
      } else {
        product.quantity -= this.stockChange.quantity;
      }

      this.addStockHistory({
        ...product,
        quantity: this.stockChange.quantity,
      }, type);

      this.clearForm();
    },
    addStockHistory(product, type) {
      this.stockHistory.push({
        id: Date.now(),
        productName: product.name,
        quantity: product.quantity,
        unit: product.unit,
        type,
        date: new Date().toLocaleDateString(),
      });
    },
    selectProduct(product) {
      this.newProduct = { ...product };
      this.selectedProductId = product.id;
    },
    confirmDelete(productId) {
      this.products = this.products.filter(p => p.id !== productId);
      this.clearForm();
    },
    clearForm() {
      this.newProduct = { name: '', quantity: 0, unit: '' };
      this.stockChange = { productId: null, quantity: 0 };
      this.selectedProductId = null;
      this.alerts = {
        productExists: false,
        invalidName: false,
        invalidQuantity: false,
        noProductSelected: false,
      };
      this.insufficientStock = false;
    },
  },
};
</script>


<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.5s;
}
.fade-enter, .fade-leave-to /* .fade-leave-active in <2.1.8 */ {
  opacity: 0;
}
.slide-fade-enter-active, .slide-fade-leave-active {
  transition: transform 0.5s, opacity 0.5s;
}
.slide-fade-enter, .slide-fade-leave-to /* .slide-fade-leave-active in <2.1.8 */ {
  transform: translateX(20px);
  opacity: 0;
}
</style>
