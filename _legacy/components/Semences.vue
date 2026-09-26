<template>
  <v-card class="rounded-lg shadow-md pa-6 mb-6">
    <v-card-title class="text-h5 font-weight-bold text-success">
      Gestion des Semences
    </v-card-title>

    <!-- Bouton pour ajouter une nouvelle semence -->
    <v-btn color="success" class="mb-4" @click="openAddDialog">
      <v-icon>mdi-plus</v-icon> Ajouter une nouvelle semence
    </v-btn>

    <!-- Recherche de semences -->
    <v-text-field
      v-model="search"
      label="Rechercher une semence"
      append-icon="mdi-magnify"
      class="mb-4"
    ></v-text-field>

    <!-- Tableau des semences -->
    <v-data-table
      :headers="headers"
      :items="filteredSeeds"
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
          Aucune semence en stock
        </v-alert>
      </template>
    </v-data-table>

    <!-- Boîte de dialogue pour ajouter une nouvelle semence -->
    <v-dialog v-model="addDialog.visible" max-width="500">
      <v-card>
        <v-card-title class="text-h6">Ajouter une nouvelle semence</v-card-title>
        <v-card-text>
          <v-form @submit.prevent="saveSeed">
            <v-text-field
              v-model="newSeed.name"
              label="Nom de la Semence"
              outlined
              required
            ></v-text-field>
            <v-text-field
              v-model.number="newSeed.quantity"
              label="Quantité"
              type="number"
              min="0"
              outlined
              required
            ></v-text-field>
            <v-text-field
              v-model="newSeed.unit"
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

    <!-- Boîte de dialogue pour modifier une semence -->
    <v-dialog v-model="editDialog.visible" max-width="500">
      <v-card>
        <v-card-title class="text-h6">Modifier la semence</v-card-title>
        <v-card-text>
          <v-form @submit.prevent="saveSeed">
            <v-text-field
              v-model="newSeed.name"
              label="Nom de la Semence"
              outlined
              required
            ></v-text-field>
            <v-text-field
              v-model.number="newSeed.quantity"
              label="Quantité"
              type="number"
              min="0"
              outlined
              required
            ></v-text-field>
            <v-text-field
              v-model="newSeed.unit"
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
        <v-card-title class="text-error">Supprimer la semence</v-card-title>
        <v-card-text>
          Êtes-vous sûr de vouloir supprimer "{{ deleteDialog.selectedSeed?.name }}" ?
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

    <!-- Dialogue pour l'entrée de semences -->
    <v-dialog v-model="entryDialog.visible" max-width="500">
      <v-card>
        <v-card-title class="text-h6">Entrer des semences</v-card-title>
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

    <!-- Dialogue pour la sortie de semences -->
    <v-dialog v-model="exitDialog.visible" max-width="500">
      <v-card>
        <v-card-title class="text-h6">Sortie de semences</v-card-title>
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
const newSeed = ref({ name: '', quantity: 0, unit: '' });
const selectedSeedId = ref(null);
const seeds = ref([]);
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
  selectedSeed: null, // Semence sélectionnée pour la suppression
});
const existingSeed = ref(null); // Semence existante pour la suggestion

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
  seed: null, // Semence sélectionnée pour l'entrée
  quantity: 1, // Quantité par défaut
});

const exitDialog = ref({
  visible: false,
  seed: null, // Semence sélectionnée pour la sortie
  quantity: 1, // Quantité par défaut
});

const router = useRouter();
const userId = ref(null);

// Charger les semences avec Axios
const loadSeeds = async () => {
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

    const seedResponse = await axios.get(`http://localhost:3001/api/stocks/seeds/${userId.value}`);
    seeds.value = seedResponse.data;

    // Vérifier les semences critiques
    const criticalSeeds = seeds.value.filter(seed => seed.quantity < CRITICAL_QUANTITY);
    if (criticalSeeds.length > 0) {
      dialog.value = {
        visible: true,
        type: 'error',
        title: 'Alerte',
        message: `Attention, ${criticalSeeds.length} semence(s) ont une quantité critique !`,
      };
    }
  } catch (error) {
    console.error('Erreur lors du chargement des semences:', error);
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

// Filtrer les semences en fonction de la recherche
const filteredSeeds = computed(() =>
  seeds.value.filter(seed =>
    seed.name.toLowerCase().includes(search.value.toLowerCase())
));

// En-têtes du tableau
const headers = [
  { text: 'Nom', value: 'name' },
  { text: 'Quantité', value: 'quantity' },
  { text: 'Unité', value: 'unit' },
  { text: 'Statut', value: 'status', sortable: false }, // Nouvelle colonne pour le statut
  { text: 'Actions', value: 'actions', sortable: false }
];

// Ouvrir le dialogue pour ajouter une semence
const openAddDialog = () => {
  clearForm();
  addDialog.value.visible = true;
};

// Ouvrir le dialogue pour modifier une semence
const openEditDialog = (seed) => {
  selectSeed(seed);
  editDialog.value.visible = true;
};

// Sélectionner une semence pour modification
const selectSeed = (seed) => {
  newSeed.value = { ...seed };
  selectedSeedId.value = seed.id;
};

// Confirmer la suppression d'une semence
const confirmDelete = async () => {
  const seed = deleteDialog.value.selectedSeed;
  if (!seed) return;

  try {
    await axios.delete(`http://localhost:3001/api/stocks/seeds/${seed.id}`);
    await loadSeeds(); // Recharger les semences après suppression
    dialog.value = {
      visible: true,
      type: 'success',
      title: 'Succès',
      message: 'Semence supprimée avec succès !',
    };
  } catch (error) {
    console.error('Erreur lors de la suppression de la semence:', error);
    dialog.value = {
      visible: true,
      type: 'error',
      title: 'Erreur',
      message: "Impossible de supprimer la semence.",
    };
  }
  deleteDialog.value.visible = false; // Fermer la boîte de dialogue
};

// Vérifier si la semence existe déjà
const checkExistingSeed = () => {
  const existingSeed = seeds.value.find(
    seed => seed.name.toLowerCase() === newSeed.value.name.toLowerCase()
  );
  if (existingSeed) {
    dialog.value = {
      visible: true,
      type: 'warning',
      title: 'Semence existante',
      message: `La semence "${newSeed.value.name}" existe déjà. Souhaitez-vous ajouter une nouvelle entrée ?`,
      action: {
        text: 'Faire une entrée',
        handler: () => {
          dialog.value.visible = false; // Fermer la boîte de dialogue
          setTimeout(() => {
            handleEntry(existingSeed); // Ouvrir la boîte de dialogue d'entrée
          }, 300); // Petite attente pour éviter un bug d'affichage
        },
      },
    };
    return true; // Retourne true si la semence existe
  }
  return false; // Retourne false si la semence n'existe pas
};

// Sauvegarder la semence (ajouter ou modifier)
const saveSeed = async () => {
  // Vérifier si la semence existe déjà (sauf en mode édition)
  if (!selectedSeedId.value && checkExistingSeed()) return;

  try {
    if (!newSeed.value.name || !newSeed.value.quantity || !newSeed.value.unit) {
      dialog.value = {
        visible: true,
        type: 'error',
        title: 'Erreur',
        message: 'Veuillez remplir tous les champs obligatoires.',
      };
      return;
    }

    if (isNaN(newSeed.value.quantity) || newSeed.value.quantity < 0) {
      dialog.value = {
        visible: true,
        type: 'error',
        title: 'Erreur',
        message: 'La quantité doit être un nombre positif.',
      };
      return;
    }

    newSeed.value.user_id = userId.value;

       if (selectedSeedId.value) {
      await axios.put(`http://localhost:3001/api/stocks/seeds/${selectedSeedId.value}`, newSeed.value)
    } else {
      await axios.post('http://localhost:3001/api/stocks/seeds', newSeed.value)
    }
    await axios.post('http://localhost:3001/historique', {
      user_id: userId.value,
      type: 'semences',
      name: newSeed.value.name,
      quantity: newSeed.value.quantity,
      unit: newSeed.value.unit,
      niveau: selectedSeedId.value ? 'modifier' : 'ajouter',
      date: new Date().toISOString(),
    });

    clearForm();
    loadSeeds();

    // Vérifier si la quantité est critique
    if (newSeed.value.quantity < CRITICAL_QUANTITY) {
      dialog.value = {
        visible: true,
        type: 'error',
        title: 'Alerte',
        message: `La quantité de "${newSeed.value.name}" est critique !`,
      };
    } else if (newSeed.value.quantity === 0) {
      dialog.value = {
        visible: true,
        type: 'warning',
        title: 'Alerte',
        message: `La semence "${newSeed.value.name}" est maintenant terminée !`,
      };
    } else {
      dialog.value = {
        visible: true,
        type: 'success',
        title: 'Succès',
        message: 'Semence sauvegardée avec succès !',
      };
    }
  } catch (error) {
    console.error('Erreur lors de la sauvegarde de la semence:', error);
    dialog.value = {
      visible: true,
      type: 'error',
      title: 'Erreur',
      message: "Impossible d'enregistrer la semence.",
    };
  }
};

// Gérer l'entrée de semences
const handleEntry = (seed) => {
  entryDialog.value = {
    visible: true,
    seed: seed,
    quantity: 0, // Réinitialiser la quantité par défaut
  };
};

const handleEntryConfirm = async () => {
  const { seed, quantity } = entryDialog.value;

  if (quantity > 0) {
    try {
      const currentQuantity = parseInt(seed.quantity, 10);
      if (isNaN(currentQuantity)) {
        dialog.value = { visible: true, type: 'error', title: 'Erreur', message: 'La quantité actuelle est invalide.' };
        return;
      }

      const newQuantity = currentQuantity + quantity;
      const updatedSeed = { ...seed, quantity: newQuantity };

      await axios.put(`http://localhost:3001/api/stocks/seeds/${seed.id}`, updatedSeed);
      await axios.post('http://localhost:3001/historique', {
        user_id: userId.value,
        type: 'semences',
        name: seed.name,
        quantity,
        unit: seed.unit,
        niveau: 'entrer',
        date: new Date().toISOString(),
      });

      // Mettre à jour la semence dans la liste
      const index = seeds.value.findIndex((s) => s.id === seed.id);
      if (index !== -1) seeds.value[index] = updatedSeed;

      await loadHistorique(); // Recharger l'historique
      dialog.value = { visible: true, type: 'success', title: 'Succès', message: 'Quantité ajoutée avec succès !' };
    } catch (error) {
      console.error("Erreur lors de l'entrée de la semence:", error);
      dialog.value = { visible: true, type: 'error', title: 'Erreur', message: "Impossible d'ajouter la quantité." };
    }
  } else {
    dialog.value = { visible: true, type: 'error', title: 'Erreur', message: 'Quantité invalide !' };
  }

  entryDialog.value.visible = false; // Fermer le dialogue
};

// Gérer la sortie de semences
const handleExit = (seed) => {
  exitDialog.value = {
    visible: true,
    seed: seed,
    quantity: 0, // Réinitialiser la quantité par défaut
  };
};

// Ouvrir la boîte de dialogue pour la suppression
const openDeleteDialog = (seed) => {
  deleteDialog.value.selectedSeed = seed;
  deleteDialog.value.visible = true;
};

const handleExitConfirm = async () => {
  const { seed, quantity } = exitDialog.value;

  if (quantity > 0 && quantity <= seed.quantity) {
    try {
      const currentQuantity = parseInt(seed.quantity, 10);
      if (isNaN(currentQuantity)) {
        dialog.value = { visible: true, type: 'error', title: 'Erreur', message: 'La quantité actuelle est invalide.' };
        return;
      }

      const newQuantity = currentQuantity - quantity;
      const updatedSeed = { ...seed, quantity: newQuantity };

      await axios.put(`http://localhost:3001/api/stocks/seeds/${seed.id}`, updatedSeed);
      await axios.post('http://localhost:3001/historique', {
        user_id: userId.value,
        type: 'semences',
        name: seed.name,
        quantity,
        unit: seed.unit,
        niveau: 'sortie',
        date: new Date().toISOString(),
      });

      // Mettre à jour la semence dans la liste
      const index = seeds.value.findIndex((s) => s.id === seed.id);
      if (index !== -1) seeds.value[index] = updatedSeed;

      await loadHistorique(); // Recharger l'historique
      dialog.value = { visible: true, type: 'success', title: 'Succès', message: 'Quantité retirée avec succès !' };
    } catch (error) {
      console.error("Erreur lors de la sortie de la semence:", error);
      dialog.value = { visible: true, type: 'error', title: 'Erreur', message: "Impossible de retirer la quantité." };
    }
  } else {
    dialog.value = { visible: true, type: 'error', title: 'Erreur', message: 'Quantité invalide ou insuffisante !' };
  }

  exitDialog.value.visible = false; // Fermer le dialogue
};

// Réinitialiser le formulaire
const clearForm = () => {
  newSeed.value = { name: '', quantity: 0, unit: '' };
  selectedSeedId.value = null;
  dialog.value = { visible: false, type: '', title: '', message: '' };
  addDialog.value.visible = false;
  editDialog.value.visible = false;
};

// Charger les semences et l'historique au montage du composant
onMounted(() => {
  loadSeeds();
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