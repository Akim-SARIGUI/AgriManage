<template>
  <v-card class="rounded-lg shadow-md pa-6 mb-6">
    <v-card-title class="text-h5 font-weight-bold text-success">
      Gestion des Produits
    </v-card-title>

    <!-- Recherche de produits -->
    <v-text-field
      v-model="search"
      label="Rechercher un produit"
      append-icon="mdi-magnify"
      class="mb-4"
    ></v-text-field>

    <!-- Tableau des produits -->
    <v-data-table
      :headers="headers"
      :items="filteredProducts"
      item-key="id"
      class="mb-4"
    >
      <template v-slot:item.actions="{ item }">
        <v-btn class="ml-4" color="primary" @click="selectProduct(item)">
          <v-icon>mdi-pencil</v-icon>Modifier
        </v-btn>
        <v-btn class="ml-4" color="error" @click="confirmDelete(item.id)">
          <v-icon>mdi-delete</v-icon>Supprimer
        </v-btn>
        <v-btn class="ml-4" color="success" :title="'Ajouter ' + item.name" @click="handleEntry(item)">
          <v-icon>mdi-plus</v-icon> Entrer
        </v-btn>
        <v-btn class="ml-4" color="blue" :title="'Retirer ' + item.name" @click="handleExit(item)">
          <v-icon>mdi-minus</v-icon>Sortie
        </v-btn>
      </template>
      <template v-slot:no-data>
        <v-alert type="info" :value="true">
          Aucun produit en stock
        </v-alert>
      </template>
    </v-data-table>

    <!-- Formulaire pour ajouter ou modifier un produit -->
    <v-form @submit.prevent="saveProduct">
      <v-text-field
        v-model="newProduct.name"
        label="Nom du Produit"
        outlined
        required
      ></v-text-field>
      <v-text-field
        v-model.number="newProduct.quantity"
        label="Quantité"
        type="number"
        min="0"
        outlined
        required
      ></v-text-field>
      <v-text-field
        v-model="newProduct.unit"
        label="Unité de Mesure"
        outlined
        required
      ></v-text-field>
      <div class="d-flex justify-space-between">
        <v-btn type="submit" color="success">{{ selectedProductId ? 'Modifier' : 'Ajouter' }}</v-btn>
        <v-btn @click="clearForm" color="error">Annuler</v-btn>
      </div>
    </v-form>

    <!-- Alertes -->
    <v-alert v-if="alerts.productExists" type="error" outlined class="mt-4">
      Ce produit existe déjà !
    </v-alert>
    <v-alert v-if="alerts.invalidName" type="error" outlined class="mt-4">
      Nom de produit invalide ! Veuillez entrer un nom valide.
    </v-alert>
    <v-alert v-if="alerts.invalidQuantity" type="error" outlined class="mt-4">
      Quantité invalide ! Veuillez entrer une quantité supérieure à zéro.
    </v-alert>
    <v-alert v-if="alerts.successMessage" type="success" outlined class="mt-4">
      Produit sauvegardé avec succès !
    </v-alert>
  </v-card>
</template>
<script setup>
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';
import { validate as validateUUID } from 'uuid'

// État local pour gérer les produits
const router = useRouter()
const userId = ref(null)
const search = ref('');
const newProduct = ref({ name: '', quantity: 0, unit: '' });
const selectedProductId = ref(null);
const alerts = ref({
  productExists: false,
  invalidName: false,
  invalidQuantity: false,
  successMessage: false,
});

// Charger les produits avec Axios
const products = ref([]);

const loadProducts = async () => {
  try {
    const token = localStorage.getItem('authToken')

    if (!token) {
      router.push('/users/connexion')
      return
    }

    const response = await axios.get('http://localhost:3001/api/user-profile', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    const userIdFromServer = response.data.id

    // Vérification et conversion en UUID valide
    if (!validateUUID(userIdFromServer)) {
      console.error("ID utilisateur non valide pour UUID:", userIdFromServer)
      return
    }

    userId.value = userIdFromServer
    console.log("User ID:", userId.value)

    const Produitsresponse = await axios.get(`http://localhost:3001/api/products/${userId.value}`);
    products.value = Produitsresponse.data;
  } catch (error) {
    console.error('Erreur lors du chargement des produits:', error);
  }
};

// Filtrer les produits en fonction de la recherche
const filteredProducts = computed(() =>
  products.value.filter(product =>
    product.name.toLowerCase().includes(search.value.toLowerCase())
  )
);

// En-têtes du tableau
const headers = [
  { text: 'Nom', value: 'name' },
  { text: 'Quantité', value: 'quantity' },
  { text: 'Unité', value: 'unit' },
  { text: 'État', value: 'status' },
  { text: 'Actions', value: 'actions', sortable: false }
];

// Sélectionner un produit pour modification
const selectProduct = (product) => {
  newProduct.value = { ...product };
  selectedProductId.value = product.id;
};

// Confirmer la suppression d'un produit
const confirmDelete = async (id) => {
  if (confirm('Êtes-vous sûr de vouloir supprimer cet élément ?')) {
    try {
      await axios.delete(`http://localhost:3001/api/products/${id}`);
      loadProducts(); // Recharge les données après suppression
    } catch (error) {
      console.error('Erreur lors de la suppression du produit:', error);
    }
  }
};

// Formatage de la date
function formatDate(dateString) {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

// Sauvegarder le produit (ajouter ou modifier)
const saveProduct = async () => {
  if (newProduct.value.name === '') {
    alerts.value.invalidName = true;
    return;
  } else if (newProduct.value.quantity <= 0) {
    alerts.value.invalidQuantity = true;
    return;
  }

  try {
    newProduct.value.user_id = userId.value
    if (selectedProductId.value) {
      // Mise à jour du produit existant
      await axios.put(`http://localhost:3001/api/products/${selectedProductId.value}`, newProduct.value);
      const index = products.value.findIndex(p => p.id === selectedProductId.value);
      if (index !== -1) {
        products.value[index] = newProduct.value; // Mise à jour à l'index
      }
    } else {
      // Création d'un nouveau produit
      const response = await axios.post('http://localhost:3001/api/products', newProduct.value);
      products.value.unshift(response.data); // Ajout au début du tableau
    }
    await axios.post('http://localhost:3001/historique', {
      user_id: userId.value,
      type: 'produits',
      name: newProduct.value.name,
      quantity: newProduct.value.quantity,
      unit: newProduct.value.unit,
      niveau: selectedProductId.value ? 'modifier' : 'ajouter',
      date: formatDate(new Date())
    });
    clearForm();
    alerts.value.successMessage = true;
    loadProducts(); // Recharge les données après sauvegarde
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du produit:', error);
  }
};

// Réinitialiser le formulaire
const clearForm = () => {
  newProduct.value = { name: '', quantity: 0, unit: '' };
  selectedProductId.value = null;
  alerts.value = {
    productExists: false,
    invalidName: false,
    invalidQuantity: false,
    successMessage: false,
  };
};

// Charger les produits au montage du composant
onMounted(() => {
  loadProducts();
});

// Gérer l'entrée de produits
const handleEntry = async (product) => {
  const quantity = parseInt(prompt('Entrer la quantité à ajouter :', 0), 10);
  if (quantity > 0) {
    product.quantity += quantity; // Mise à jour de la quantité
    await updateProduct(product); // Mise à jour dans le tableau
    await axios.post('http://localhost:3001/historique', {
      type: 'produits',
      name: product.name,
      quantity,
      unit: product.unit,
      niveau: 'entrer',
      date: new Date()
    });
  } else {
    alert('Quantité invalide !');
  }
};

// Gérer la sortie de produits
const handleExit = async (product) => {
  const quantity = parseInt(prompt('Entrer la quantité à retirer :', 0), 10);
  if (quantity > 0 && quantity <= product.quantity) {
    product.quantity -= quantity; // Mise à jour de la quantité
    await updateProduct(product); // Mise à jour dans le tableau
    await axios.post('http://localhost:3001/historique', {
      type: 'produits',
      name: product.name,
      quantity,
      unit: product.unit,
      niveau: 'sortie',
      date: new Date()
    });
  } else {
    alert('Quantité invalide ou insuffisante !');
  }
};

// Mise à jour d'un produit
const updateProduct = async (updatedProduct) => {
  try {
    await axios.put(`http://localhost:3001/api/products/${updatedProduct.id}`, updatedProduct);
    const index = products.value.findIndex(p => p.id === updatedProduct.id);
    if (index !== -1) {
      products.value[index] = updatedProduct; // Mise à jour du produit
    }
  } catch (error) {
    console.error('Erreur lors de la mise à jour du produit:', error);
  }
};
</script>
