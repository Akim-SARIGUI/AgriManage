<template>
  <v-card class="rounded-lg shadow-md pa-6 mb-6">
    <v-card-title class="text-h5 font-weight-bold text-success">
      Gestion des Produits
    </v-card-title>

    <!-- Bouton pour ajouter un nouveau produit -->
    <v-btn color="success" class="mb-4" @click="openAddDialog">
      <v-icon>mdi-plus</v-icon> Ajouter un nouveau produit
    </v-btn>

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
      <template v-slot:item.status="{ item }">
        <v-icon v-if="item.quantity < CRITICAL_QUANTITY" color="error">mdi-alert</v-icon>
        <span v-else>-</span>
      </template>

      <template v-slot:item.actions="{ item }">
        <v-btn class="ml-4" color="primary" @click="openEditDialog(item)">
          <v-icon>mdi-pencil</v-icon>Modifier
        </v-btn>
        <v-btn class="ml-4" color="error" @click="openDeleteDialog(item)">
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

    <!-- Boîte de dialogue pour ajouter un nouveau produit -->
    <v-dialog v-model="addDialog.visible" max-width="500">
      <v-card>
        <v-card-title class="text-h6">Ajouter un nouveau produit</v-card-title>
        <v-card-text>
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
              <v-btn type="submit" color="success">Ajouter</v-btn>
              <v-btn @click="addDialog.visible = false" color="error">Annuler</v-btn>
            </div>
          </v-form>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- Boîte de dialogue pour modifier un produit -->
    <v-dialog v-model="editDialog.visible" max-width="500">
      <v-card>
        <v-card-title class="text-h6">Modifier le produit</v-card-title>
        <v-card-text>
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
              <v-btn type="submit" color="success">Modifier</v-btn>
              <v-btn @click="editDialog.visible = false" color="error">Annuler</v-btn>
            </div>
          </v-form>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- Boîte de dialogue pour la suppression -->
    <v-dialog v-model="deleteDialog.visible" max-width="500">
      <v-card>
        <v-card-title class="text-error">Supprimer le produit</v-card-title>
        <v-card-text>
          Êtes-vous sûr de vouloir supprimer "{{ deleteDialog.selectedProduct?.name }}" ?
        </v-card-text>
        <v-card-actions>
          <v-btn color="error" @click="confirmDelete">Confirmer</v-btn>
          <v-btn color="primary" @click="deleteDialog.visible = false">Annuler</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Boîte de dialogue pour les messages -->
    <v-dialog v-model="dialog.visible" max-width="500">
      <v-card>
        <v-card-title :class="`text-${dialog.type}`">
          {{ dialog.title }}
        </v-card-title>
        <v-card-text>
          {{ dialog.message }}
        </v-card-text>
        <v-card-actions>
          <v-btn v-if="dialog.action" color="primary" @click="dialog.action.handler">
            {{ dialog.action.text }}
          </v-btn>
          <v-btn color="error" @click="dialog.visible = false">Fermer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialogue pour l'entrée de produits -->
    <v-dialog v-model="entryDialog.visible" max-width="500">
      <v-card>
        <v-card-title class="text-h6">Entrer des produits</v-card-title>
        <v-card-text>
          <v-text-field
            v-model.number="entryDialog.quantity"
            label="Quantité à ajouter"
            type="number"
            min="1"
            outlined
          ></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-btn color="primary" @click="handleEntryConfirm">Confirmer</v-btn>
          <v-btn color="error" @click="entryDialog.visible = false">Annuler</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialogue pour la sortie de produits -->
    <v-dialog v-model="exitDialog.visible" max-width="500">
      <v-card>
        <v-card-title class="text-h6">Sortie de produits</v-card-title>
        <v-card-text>
          <v-text-field
            v-model.number="exitDialog.quantity"
            label="Quantité à retirer"
            type="number"
            min="1"
            outlined
          ></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-btn color="primary" @click="handleExitConfirm">Confirmer</v-btn>
          <v-btn color="error" @click="exitDialog.visible = false">Annuler</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';
import { validate as validateUUID } from 'uuid';
import { useRouter } from 'vue-router';

// Constantes
const CRITICAL_QUANTITY = 10; // Seuil critique

// Données réactives
const search = ref('');
const newProduct = ref({ name: '', quantity: 0, unit: '' });
const selectedProductId = ref(null);
const products = ref([]);
const historique = ref([]); // Historique des actions
const dialog = ref({
  visible: false,
  type: '', // Type de dialogue (success, error, warning)
  title: '', // Titre du dialogue
  message: '', // Message à afficher
  action: null, // Action supplémentaire (bouton avec handler)
});
const deleteDialog = ref({
  visible: false,
  selectedProduct: null, // Produit sélectionné pour la suppression
});
const existingProduct = ref(null); // Produit existant pour la suggestion

// Dialogues pour ajouter et modifier
const addDialog = ref({
  visible: false,
});

const editDialog = ref({
  visible: false,
});

// Dialogues pour entrée et sortie
const entryDialog = ref({
  visible: false,
  product: null, // Produit sélectionné pour l'entrée
  quantity: 1, // Quantité par défaut
});

const exitDialog = ref({
  visible: false,
  product: null, // Produit sélectionné pour la sortie
  quantity: 1, // Quantité par défaut
});

const router = useRouter();
const userId = ref(null);

// Charger les produits avec Axios
const loadProducts = async () => {
  try {
    const token = localStorage.getItem('authToken');

    if (!token) {
      router.push('/users/connexion');
      return;
    }

    const response = await axios.get('http://localhost:3001/api/user-profile', {
      headers: { Authorization: `Bearer ${token}` },
    });

    userId.value = response.data.id;

    if (!validateUUID(userId.value)) {
      console.error("ID utilisateur non valide pour UUID:", userId.value);
      return;
    }

    const productResponse = await axios.get(`http://localhost:3001/api/products/${userId.value}`);
    products.value = productResponse.data;

    // Vérifier les produits critiques
    const criticalProducts = products.value.filter(product => product.quantity < CRITICAL_QUANTITY);
    if (criticalProducts.length > 0) {
      dialog.value = {
        visible: true,
        type: 'error',
        title: 'Alerte',
        message: `Attention, ${criticalProducts.length} produit(s) ont une quantité critique !`,
      };
    }
  } catch (error) {
    console.error('Erreur lors du chargement des produits:', error);
    dialog.value = {
      visible: true,
      type: 'error',
      title: 'Erreur',
      message: 'Erreur de connexion au serveur.',
    };
  }
};

// Charger l'historique
const loadHistorique = async () => {
  try {
    const response = await axios.get(`http://localhost:3001/historique/${userId.value}`);
    historique.value = response.data;
  } catch (error) {
    console.error('Erreur lors du chargement de l\'historique:', error);
  }
};

// Filtrer les produits en fonction de la recherche
const filteredProducts = computed(() =>
  products.value.filter(product =>
    product.name.toLowerCase().includes(search.value.toLowerCase())
));

// En-têtes du tableau
const headers = [
  { text: 'Nom', value: 'name' },
  { text: 'Quantité', value: 'quantity' },
  { text: 'Unité', value: 'unit' },
  { text: 'Statut', value: 'status', sortable: false }, // Nouvelle colonne pour le statut
  { text: 'Actions', value: 'actions', sortable: false }
];

// Ouvrir le dialogue pour ajouter un produit
const openAddDialog = () => {
  clearForm();
  addDialog.value.visible = true;
};

// Ouvrir le dialogue pour modifier un produit
const openEditDialog = (product) => {
  selectProduct(product);
  editDialog.value.visible = true;
};

// Sélectionner un produit pour modification
const selectProduct = (product) => {
  newProduct.value = { ...product };
  selectedProductId.value = product.id;
};

// Confirmer la suppression d'un produit
const confirmDelete = async () => {
  const product = deleteDialog.value.selectedProduct;
  if (!product) return;

  try {
    await axios.delete(`http://localhost:3001/api/products/${product.id}`);
    await loadProducts(); // Recharger les produits après suppression
    dialog.value = {
      visible: true,
      type: 'success',
      title: 'Succès',
      message: 'Produit supprimé avec succès !',
    };
  } catch (error) {
    console.error('Erreur lors de la suppression du produit:', error);
    dialog.value = {
      visible: true,
      type: 'error',
      title: 'Erreur',
      message: "Impossible de supprimer le produit.",
    };
  }
  deleteDialog.value.visible = false; // Fermer la boîte de dialogue
};

// Vérifier si le produit existe déjà
const checkExistingProduct = () => {
  const existingProduct = products.value.find(
    product => product.name.toLowerCase() === newProduct.value.name.toLowerCase()
  );
  if (existingProduct) {
    dialog.value = {
      visible: true,
      type: 'warning',
      title: 'Produit existant',
      message: `Le produit "${newProduct.value.name}" existe déjà. Souhaitez-vous ajouter une nouvelle entrée ?`,
      action: {
        text: 'Faire une entrée',
        handler: () => {
          dialog.value.visible = false; // Fermer la boîte de dialogue
          setTimeout(() => {
            handleEntry(existingProduct); // Ouvrir la boîte de dialogue d'entrée
          }, 300); // Petite attente pour éviter un bug d'affichage
        },
      },
    };
    return true; // Retourne true si le produit existe
  }
  return false; // Retourne false si le produit n'existe pas
};

// Sauvegarder le produit (ajouter ou modifier)
const saveProduct = async () => {
  // Vérifier si le produit existe déjà (sauf en mode édition)
  if (!selectedProductId.value && checkExistingProduct()) return;

  try {
    if (!newProduct.value.name || !newProduct.value.quantity || !newProduct.value.unit) {
      dialog.value = {
        visible: true,
        type: 'error',
        title: 'Erreur',
        message: 'Veuillez remplir tous les champs obligatoires.',
      };
      return;
    }

    if (isNaN(newProduct.value.quantity) || newProduct.value.quantity < 0) {
      dialog.value = {
        visible: true,
        type: 'error',
        title: 'Erreur',
        message: 'La quantité doit être un nombre positif.',
      };
      return;
    }

    newProduct.value.user_id = userId.value;

    if (selectedProductId.value) {
      await axios.put(`http://localhost:3001/api/products/${selectedProductId.value}`, newProduct.value);
    } else {
      await axios.post('http://localhost:3001/api/products', newProduct.value);
    }

    await axios.post('http://localhost:3001/historique', {
      user_id: userId.value,
      type: 'produits',
      name: newProduct.value.name,
      quantity: newProduct.value.quantity,
      unit: newProduct.value.unit,
      niveau: selectedProductId.value ? 'modifier' : 'ajouter',
      date: new Date().toISOString(),
    });

    clearForm();
    loadProducts();

    // Vérifier si la quantité est critique
    if (newProduct.value.quantity < CRITICAL_QUANTITY) {
      dialog.value = {
        visible: true,
        type: 'error',
        title: 'Alerte',
        message: `La quantité de "${newProduct.value.name}" est critique !`,
      };
    } else if (newProduct.value.quantity === 0) {
      dialog.value = {
        visible: true,
        type: 'warning',
        title: 'Alerte',
        message: `Le produit "${newProduct.value.name}" est maintenant terminé !`,
      };
    } else {
      dialog.value = {
        visible: true,
        type: 'success',
        title: 'Succès',
        message: 'Produit sauvegardé avec succès !',
      };
    }
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du produit:', error);
    dialog.value = {
      visible: true,
      type: 'error',
      title: 'Erreur',
      message: "Impossible d'enregistrer le produit.",
    };
  }
};

// Gérer l'entrée de produits
const handleEntry = (product) => {
  entryDialog.value = {
    visible: true,
    product: product,
    quantity: 0, // Réinitialiser la quantité par défaut
  };
};

const handleEntryConfirm = async () => {
  const { product, quantity } = entryDialog.value;

  if (quantity > 0) {
    try {
      const currentQuantity = parseInt(product.quantity, 10);
      if (isNaN(currentQuantity)) {
        dialog.value = { visible: true, type: 'error', title: 'Erreur', message: 'La quantité actuelle est invalide.' };
        return;
      }

      const newQuantity = currentQuantity + quantity;
      const updatedProduct = { ...product, quantity: newQuantity };

      await axios.put(`http://localhost:3001/api/products/${product.id}`, updatedProduct);
      await axios.post('http://localhost:3001/historique', {
        user_id: userId.value,
        type: 'produits',
        name: product.name,
        quantity,
        unit: product.unit,
        niveau: 'entrer',
        date: new Date().toISOString(),
      });

      // Mettre à jour le produit dans la liste
      const index = products.value.findIndex((p) => p.id === product.id);
      if (index !== -1) products.value[index] = updatedProduct;

      await loadHistorique(); // Recharger l'historique
      dialog.value = { visible: true, type: 'success', title: 'Succès', message: 'Quantité ajoutée avec succès !' };
    } catch (error) {
      console.error("Erreur lors de l'entrée du produit:", error);
      dialog.value = { visible: true, type: 'error', title: 'Erreur', message: "Impossible d'ajouter la quantité." };
    }
  } else {
    dialog.value = { visible: true, type: 'error', title: 'Erreur', message: 'Quantité invalide !' };
  }

  entryDialog.value.visible = false; // Fermer le dialogue
};

// Gérer la sortie de produits
const handleExit = (product) => {
  exitDialog.value = {
    visible: true,
    product: product,
    quantity: 0, // Réinitialiser la quantité par défaut
  };
};

// Ouvrir la boîte de dialogue pour la suppression
const openDeleteDialog = (product) => {
  deleteDialog.value.selectedProduct = product;
  deleteDialog.value.visible = true;
};

const handleExitConfirm = async () => {
  const { product, quantity } = exitDialog.value;

  if (quantity > 0 && quantity <= product.quantity) {
    try {
      const currentQuantity = parseInt(product.quantity, 10);
      if (isNaN(currentQuantity)) {
        dialog.value = { visible: true, type: 'error', title: 'Erreur', message: 'La quantité actuelle est invalide.' };
        return;
      }

      const newQuantity = currentQuantity - quantity;
      const updatedProduct = { ...product, quantity: newQuantity };

      await axios.put(`http://localhost:3001/api/products/${product.id}`, updatedProduct);
      await axios.post('http://localhost:3001/historique', {
        user_id: userId.value,
        type: 'produits',
        name: product.name,
        quantity,
        unit: product.unit,
        niveau: 'sortie',
        date: new Date().toISOString(),
      });

      // Mettre à jour le produit dans la liste
      const index = products.value.findIndex((p) => p.id === product.id);
      if (index !== -1) products.value[index] = updatedProduct;

      await loadHistorique(); // Recharger l'historique
      dialog.value = { visible: true, type: 'success', title: 'Succès', message: 'Quantité retirée avec succès !' };
    } catch (error) {
      console.error("Erreur lors de la sortie du produit:", error);
      dialog.value = { visible: true, type: 'error', title: 'Erreur', message: "Impossible de retirer la quantité." };
    }
  } else {
    dialog.value = { visible: true, type: 'error', title: 'Erreur', message: 'Quantité invalide ou insuffisante !' };
  }

  exitDialog.value.visible = false; // Fermer le dialogue
};

// Réinitialiser le formulaire
const clearForm = () => {
  newProduct.value = { name: '', quantity: 0, unit: '' };
  selectedProductId.value = null;
  dialog.value = { visible: false, type: '', title: '', message: '' };
  addDialog.value.visible = false;
  editDialog.value.visible = false;
};

// Charger les produits et l'historique au montage du composant
onMounted(() => {
  loadProducts();
  loadHistorique();
});
</script>

<style scoped>
.v-data-table {
  max-height: 500px; /* Ajustez la hauteur selon vos besoins */
  overflow-y: auto;
}

.v-icon.error {
  color: #ff5252; /* Couleur rouge pour l'alerte */
}
</style>