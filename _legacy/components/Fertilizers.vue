<template>
  <v-card class="rounded-lg shadow-md pa-6 mb-6">
    <v-card-title class="text-h5 font-weight-bold text-success">
      Gestion des Fertilisants
    </v-card-title>

    <!-- Bouton pour ajouter un nouveau fertilisant -->
    <v-btn color="success" class="mb-4" @click="openAddDialog">
      <v-icon>mdi-plus</v-icon> Ajouter un nouveau fertilisant
    </v-btn>

    <!-- Recherche de fertilisants -->
    <v-text-field
      v-model="search"
      label="Rechercher un fertilisant"
      append-icon="mdi-magnify"
      class="mb-4"
    ></v-text-field>

    <!-- Tableau des fertilisants -->
    <v-data-table
      :headers="headers"
      :items="filteredFertilizers"
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
        <v-btn class="ml-4" color="success" @click="openEntryDialog(item)">
          <v-icon>mdi-plus</v-icon> Entrer
        </v-btn>
        <v-btn class="ml-4" color="blue" @click="openExitDialog(item)">
          <v-icon>mdi-minus</v-icon>Sortie
        </v-btn>
      </template>
      <template v-slot:no-data>
        <v-alert type="info" :value="true">
          Aucun fertilisant en stock
        </v-alert>
      </template>
    </v-data-table>

    <!-- Boîte de dialogue pour ajouter un nouveau fertilisant -->
    <v-dialog v-model="addDialog.visible" max-width="500">
      <v-card>
        <v-card-title class="text-h6">Ajouter un nouveau fertilisant</v-card-title>
        <v-card-text>
          <v-form @submit.prevent="saveFertilizer">
            <v-text-field
              v-model="newFertilizer.name"
              label="Nom du Fertilisant"
              outlined
              required
            ></v-text-field>
            <v-text-field
              v-model.number="newFertilizer.quantity"
              label="Quantité"
              type="number"
              min="0"
              outlined
              required
            ></v-text-field>
            <v-text-field
              v-model="newFertilizer.unit"
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

    <!-- Boîte de dialogue pour modifier un fertilisant -->
    <v-dialog v-model="editDialog.visible" max-width="500">
      <v-card>
        <v-card-title class="text-h6">Modifier le fertilisant</v-card-title>
        <v-card-text>
          <v-form @submit.prevent="saveFertilizer">
            <v-text-field
              v-model="newFertilizer.name"
              label="Nom du Fertilisant"
              outlined
              required
            ></v-text-field>
            <v-text-field
              v-model.number="newFertilizer.quantity"
              label="Quantité"
              type="number"
              min="0"
              outlined
              required
            ></v-text-field>
            <v-text-field
              v-model="newFertilizer.unit"
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

    <!-- Boîte de dialogue pour les entrées -->
    <v-dialog v-model="entryDialog.visible" max-width="500">
      <v-card>
        <v-card-title>Entrer une quantité</v-card-title>
        <v-card-text>
          <v-text-field
            v-model.number="entryDialog.quantity"
            label="Quantité à ajouter"
            type="number"
            min="0"
            outlined
            required
          ></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-btn color="primary" @click="handleEntry">Confirmer</v-btn>
          <v-btn color="error" @click="entryDialog.visible = false">Annuler</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Boîte de dialogue pour les sorties -->
    <v-dialog v-model="exitDialog.visible" max-width="500">
      <v-card>
        <v-card-title>Retirer une quantité</v-card-title>
        <v-card-text>
          <v-text-field
            v-model.number="exitDialog.quantity"
            label="Quantité à retirer"
            type="number"
            min="0"
            outlined
            required
          ></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-btn color="primary" @click="handleExit">Confirmer</v-btn>
          <v-btn color="error" @click="exitDialog.visible = false">Annuler</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Boîte de dialogue pour la suppression -->
    <v-dialog v-model="deleteDialog.visible" max-width="500">
      <v-card>
        <v-card-title class="text-error">Supprimer le fertilisant</v-card-title>
        <v-card-text>
          Êtes-vous sûr de vouloir supprimer "{{ deleteDialog.selectedFertilizer?.name }}" ?
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
const newFertilizer = ref({ name: '', quantity: 0, unit: '' });
const selectedFertilizerId = ref(null);
const fertilizers = ref([]);
const dialog = ref({
  visible: false,
  type: '', // Type de dialogue (success, error, info)
  title: '', // Titre du dialogue
  message: '', // Message à afficher
  action: null, // Action supplémentaire (bouton avec handler)
});
const addDialog = ref({
  visible: false,
});
const editDialog = ref({
  visible: false,
});
const entryDialog = ref({
  visible: false,
  quantity: 0,
  selectedFertilizer: null,
});
const exitDialog = ref({
  visible: false,
  quantity: 0,
  selectedFertilizer: null,
});
const deleteDialog = ref({
  visible: false,
  selectedFertilizer: null,
});

const router = useRouter();
const userId = ref(null);

// En-têtes du tableau
const headers = [
  { text: 'Nom', value: 'name' },
  { text: 'Quantité', value: 'quantity' },
  { text: 'Unité', value: 'unit' },
  { text: 'Statut', value: 'status', sortable: false }, // Nouvelle colonne pour le statut
  { text: 'Actions', value: 'actions', sortable: false },
];

// Charger les fertilisants avec Axios
const loadFertilizers = async () => {
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

    const fertilizerResponse = await axios.get(`http://localhost:3001/api/fertilizers/${userId.value}`);
    fertilizers.value = fertilizerResponse.data;

    // Vérifier les fertilisants critiques
    const criticalFertilizers = fertilizers.value.filter(fertilizer => fertilizer.quantity < CRITICAL_QUANTITY);
    if (criticalFertilizers.length > 0) {
      dialog.value = {
        visible: true,
        type: 'error',
        title: 'Alerte',
        message: `Attention, ${criticalFertilizers.length} fertilisant(s) ont une quantité critique !`,
      };
    }
  } catch (error) {
    console.error('Erreur lors du chargement des fertilisants:', error);
    dialog.value = {
      visible: true,
      type: 'error',
      title: 'Erreur',
      message: 'Erreur de connexion au serveur.',
    };
  }
};

// Filtrer les fertilisants en fonction de la recherche
const filteredFertilizers = computed(() =>
  fertilizers.value.filter(fertilizer =>
    fertilizer.name.toLowerCase().includes(search.value.toLowerCase())
));

// Ouvrir le dialogue pour ajouter un fertilisant
const openAddDialog = () => {
  clearForm();
  addDialog.value.visible = true;
};

// Ouvrir le dialogue pour modifier un fertilisant
const openEditDialog = (fertilizer) => {
  newFertilizer.value = { ...fertilizer };
  selectedFertilizerId.value = fertilizer.id;
  editDialog.value.visible = true;
};

// Ouvrir la boîte de dialogue pour l'entrée
const openEntryDialog = (fertilizer) => {
  entryDialog.value.selectedFertilizer = fertilizer;
  entryDialog.value.quantity = 0;
  entryDialog.value.visible = true;
};

// Ouvrir la boîte de dialogue pour la sortie
const openExitDialog = (fertilizer) => {
  exitDialog.value.selectedFertilizer = fertilizer;
  exitDialog.value.quantity = 0;
  exitDialog.value.visible = true;
};

// Ouvrir la boîte de dialogue pour la suppression
const openDeleteDialog = (fertilizer) => {
  deleteDialog.value.selectedFertilizer = fertilizer;
  deleteDialog.value.visible = true;
};

// Confirmer la suppression d'un fertilisant
const confirmDelete = async () => {
  const fertilizer = deleteDialog.value.selectedFertilizer;
  if (!fertilizer) return;

  try {
    await axios.delete(`http://localhost:3001/api/fertilizers/${fertilizer.id}`);
    await loadFertilizers(); // Recharge les données après suppression
    dialog.value = { visible: true, type: 'success', title: 'Succès', message: 'Fertilisant supprimé avec succès !' };
  } catch (error) {
    console.error('Erreur lors de la suppression du fertilisant:', error);
    dialog.value = { visible: true, type: 'error', title: 'Erreur', message: 'Erreur lors de la suppression du fertilisant.' };
  }
  deleteDialog.value.visible = false;
};

// Gérer l'entrée de fertilisants
const handleEntry = async () => {
  const quantity = entryDialog.value.quantity;
  const fertilizer = entryDialog.value.selectedFertilizer;

  if (quantity > 0) {
    try {
      const currentQuantity = parseInt(fertilizer.quantity, 10);
      if (isNaN(currentQuantity)) {
        dialog.value = { visible: true, type: 'error', title: 'Erreur', message: 'La quantité actuelle est invalide.' };
        return;
      }

      const newQuantity = currentQuantity + quantity;
      const updatedFertilizer = { ...fertilizer, quantity: newQuantity };

      await axios.put(`http://localhost:3001/api/fertilizers/${fertilizer.id}`, updatedFertilizer);
      await axios.post('http://localhost:3001/historique', {
        user_id: userId.value,
        type: 'fertilisants',
        name: fertilizer.name,
        quantity,
        unit: fertilizer.unit,
        niveau: 'entrer',
        date: new Date().toISOString(),
      });

      loadFertilizers();
      dialog.value = { visible: true, type: 'success', title: 'Succès', message: 'Quantité ajoutée avec succès !' };
    } catch (error) {
      console.error("Erreur lors de l'entrée du fertilisant:", error);
      dialog.value = { visible: true, type: 'error', title: 'Erreur', message: "Impossible d'ajouter la quantité." };
    }
  } else {
    dialog.value = { visible: true, type: 'error', title: 'Erreur', message: 'Quantité invalide !' };
  }
  entryDialog.value.visible = false;
};

// Gérer la sortie de fertilisants
const handleExit = async () => {
  const quantity = exitDialog.value.quantity;
  const fertilizer = exitDialog.value.selectedFertilizer;

  if (quantity > 0 && quantity <= fertilizer.quantity) {
    try {
      const currentQuantity = parseInt(fertilizer.quantity, 10);
      if (isNaN(currentQuantity)) {
        dialog.value = { visible: true, type: 'error', title: 'Erreur', message: 'La quantité actuelle est invalide.' };
        return;
      }

      const newQuantity = currentQuantity - quantity;
      const updatedFertilizer = { ...fertilizer, quantity: newQuantity };

      await axios.put(`http://localhost:3001/api/fertilizers/${fertilizer.id}`, updatedFertilizer);
      await axios.post('http://localhost:3001/historique', {
        user_id: userId.value,
        type: 'fertilisants',
        name: fertilizer.name,
        quantity,
        unit: fertilizer.unit,
        niveau: 'sortie',
        date: new Date().toISOString(),
      });

      loadFertilizers();

      // Vérifier si la quantité restante est critique
      if (newQuantity < CRITICAL_QUANTITY) {
        dialog.value = {
          visible: true,
          type: 'error',
          title: 'Alerte',
          message: `La quantité de "${fertilizer.name}" est maintenant critique !`,
        };
      } else if (newQuantity === 0) {
        dialog.value = {
          visible: true,
          type: 'warning',
          title: 'Alerte',
          message: `Le fertilisant "${fertilizer.name}" est maintenant terminé !`,
        };
      } else {
        dialog.value = {
          visible: true,
          type: 'success',
          title: 'Succès',
          message: 'Quantité retirée avec succès !',
        };
      }
    } catch (error) {
      console.error("Erreur lors de la sortie du fertilisant:", error);
      dialog.value = { visible: true, type: 'error', title: 'Erreur', message: "Impossible de retirer la quantité." };
    }
  } else {
    dialog.value = { visible: true, type: 'error', title: 'Erreur', message: 'Quantité invalide ou insuffisante !' };
  }
  exitDialog.value.visible = false;
};

// Vérifier si le fertilisant existe déjà
const checkExistingFertilizer = () => {
  const existingFertilizer = fertilizers.value.find(
    fertilizer => fertilizer.name.toLowerCase() === newFertilizer.value.name.toLowerCase()
  );
  if (existingFertilizer) {
    dialog.value = {
      visible: true,
      type: 'warning',
      title: 'Fertilisant existant',
      message: `Le fertilisant "${newFertilizer.value.name}" existe déjà. Souhaitez-vous ajouter une nouvelle entrée ?`,
      action: {
        text: 'Faire une entrée',
        handler: () => {
          dialog.value.visible = false; // Fermer la boîte de dialogue
          setTimeout(() => {
            openEntryDialog(existingFertilizer); // Ouvrir la boîte de dialogue d'entrée
          }, 300); // Petite attente pour éviter un bug d'affichage
        },
      },
    };
    return true; // Retourne true si le fertilisant existe
  }
  return false; // Retourne false si le fertilisant n'existe pas
};

// Sauvegarder le fertilisant (ajouter ou modifier)
const saveFertilizer = async () => {
  // Vérifier si le fertilisant existe déjà (sauf en mode édition)
  if (!selectedFertilizerId.value && checkExistingFertilizer()) return;

  try {
    if (!newFertilizer.value.name || !newFertilizer.value.quantity || !newFertilizer.value.unit) {
      dialog.value = {
        visible: true,
        type: 'error',
        title: 'Erreur',
        message: 'Veuillez remplir tous les champs obligatoires.',
      };
      return;
    }

    if (isNaN(newFertilizer.value.quantity) || newFertilizer.value.quantity < 0) {
      dialog.value = {
        visible: true,
        type: 'error',
        title: 'Erreur',
        message: 'La quantité doit être un nombre positif.',
      };
      return;
    }

    newFertilizer.value.user_id = userId.value;

    if (selectedFertilizerId.value) {
      await axios.put(`http://localhost:3001/api/fertilizers/${selectedFertilizerId.value}`, newFertilizer.value);
    } else {
      await axios.post('http://localhost:3001/api/fertilizers', newFertilizer.value);
    }

    await axios.post('http://localhost:3001/historique', {
      user_id: userId.value,
      type: 'fertilisants',
      name: newFertilizer.value.name,
      quantity: newFertilizer.value.quantity,
      unit: newFertilizer.value.unit,
      niveau: selectedFertilizerId.value ? 'modifier' : 'ajouter',
      date: new Date().toISOString(),
    });

    clearForm();
    loadFertilizers();

    // Vérifier si la quantité est critique
    if (newFertilizer.value.quantity < CRITICAL_QUANTITY) {
      dialog.value = {
        visible: true,
        type: 'error',
        title: 'Alerte',
        message: `La quantité de "${newFertilizer.value.name}" est critique !`,
      };
    } else if (newFertilizer.value.quantity === 0) {
      dialog.value = {
        visible: true,
        type: 'warning',
        title: 'Alerte',
        message: `Le fertilisant "${newFertilizer.value.name}" est maintenant terminé !`,
      };
    } else {
      dialog.value = {
        visible: true,
        type: 'success',
        title: 'Succès',
        message: 'Fertilisant sauvegardé avec succès !',
      };
    }
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du fertilisant:', error);
    dialog.value = {
      visible: true,
      type: 'error',
      title: 'Erreur',
      message: "Impossible d'enregistrer le fertilisant.",
    };
  }
};

// Réinitialiser le formulaire
const clearForm = () => {
  newFertilizer.value = { name: '', quantity: 0, unit: '' };
  selectedFertilizerId.value = null;
  addDialog.value.visible = false;
  editDialog.value.visible = false;
};

// Charger les fertilisants au montage du composant
onMounted(() => {
  loadFertilizers();
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