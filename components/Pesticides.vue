<template>
  <v-card class="rounded-lg shadow-md pa-6 mb-6">
    <v-card-title class="text-h5 font-weight-bold text-warning">
      Gestion des Pesticides
    </v-card-title>

    <!-- Bouton pour ajouter un nouveau pesticide -->
    <v-btn color="warning" class="mb-4" @click="openPesticideDialog">
      <v-icon>mdi-plus</v-icon> Ajouter un nouveau pesticide
    </v-btn>

    <!-- Recherche de pesticides -->
    <v-text-field
      v-model="search"
      label="Rechercher un pesticide"
      append-icon="mdi-magnify"
      class="mb-4"
    ></v-text-field>

    <!-- Tableau des pesticides -->
    <v-data-table
      :headers="headers"
      :items="filteredPesticides"
      item-key="id"
      class="elevation-1"
    >
      <template v-slot:item.status="{ item }">
        <v-icon v-if="item.quantity < CRITICAL_QUANTITY" color="error">mdi-alert</v-icon>
        <span v-else>-</span>
      </template>

      <template v-slot:item.actions="{ item }">
        <v-btn 
          @click="openPesticideDialog(item)" 
          class="mr-2" 
          :title="'Modifier ' + item.name"
          color="primary"
        >
          <v-icon>mdi-pencil</v-icon>Modifier
        </v-btn>

        <v-btn 
          @click="openDeleteDialog(item)" 
          color="error"  
          class="mr-2" 
          :title="'Supprimer ' + item.name"
        >
          <v-icon>mdi-delete</v-icon>Supprimer
        </v-btn>

        <v-btn 
          @click="openEntryDialog(item)" 
          color="green"
          class="mr-2" 
          :title="'Ajouter ' + item.name"
        >
          <v-icon>mdi-plus</v-icon> Entrer
        </v-btn>

        <v-btn 
          @click="openExitDialog(item)" 
          color="blue"
          class="mr-2" 
          :title="'Retirer ' + item.name"
        >
          <v-icon>mdi-minus</v-icon> Sortie
        </v-btn>
      </template>

      <template v-slot:no-data>
        <v-alert type="info" class="mt-4">
          Aucun pesticide en stock
        </v-alert>
      </template>
    </v-data-table>

    <!-- Boîte de dialogue pour ajouter/modifier un pesticide -->
    <v-dialog v-model="pesticideDialog.visible" max-width="500">
      <v-card>
        <v-card-title class="text-h6">{{ pesticideDialog.title }}</v-card-title>
        <v-card-text>
          <v-form @submit.prevent="savePesticide">
            <v-text-field
              v-model="newPesticide.name"
              label="Nom du Pesticide"
              outlined
              required
            ></v-text-field>
            <v-text-field
              v-model.number="newPesticide.quantity"
              label="Quantité"
              type="number"
              min="0"
              outlined
              required
            ></v-text-field>
            <v-text-field
              v-model="newPesticide.unit"
              label="Unité de Mesure"
              outlined
              required
            ></v-text-field>
            <div class="d-flex justify-space-between">
              <v-btn type="submit" color="success">{{ pesticideDialog.action }}</v-btn>
              <v-btn @click="pesticideDialog.visible = false" color="error">Annuler</v-btn>
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
        <v-card-title class="text-error">Supprimer le pesticide</v-card-title>
        <v-card-text>
          Êtes-vous sûr de vouloir supprimer "{{ deleteDialog.selectedPesticide?.name }}" ?
        </v-card-text>
        <v-card-actions>
          <v-btn color="error" @click="confirmDelete">Confirmer</v-btn>
          <v-btn color="primary" @click="deleteDialog.visible = false">Annuler</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Boîte de dialogue pour les messages -->
    <v-dialog v-model="messageDialog.visible" max-width="500">
      <v-card>
        <v-card-title :class="`text-${messageDialog.type}`">
          {{ messageDialog.title }}
        </v-card-title>
        <v-card-text>
          {{ messageDialog.message }}
        </v-card-text>
        <v-card-actions>
          <v-btn v-if="messageDialog.action" color="primary" @click="messageDialog.action.handler">
            {{ messageDialog.action.text }}
          </v-btn>
          <v-btn color="error" @click="messageDialog.visible = false">Fermer</v-btn>
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
const newPesticide = ref({ name: '', quantity: 0, unit: '' });
const selectedPesticideId = ref(null);
const pesticides = ref([]);
const messageDialog = ref({
  visible: false,
  type: '', // Type de dialogue (success, error, info)
  title: '', // Titre du dialogue
  message: '', // Message à afficher
  action: null, // Action supplémentaire (bouton avec handler)
});
const pesticideDialog = ref({
  visible: false,
  title: '',
  action: '',
});
const entryDialog = ref({
  visible: false,
  quantity: 0,
  selectedPesticide: null,
});
const exitDialog = ref({
  visible: false,
  quantity: 0,
  selectedPesticide: null,
});
const deleteDialog = ref({
  visible: false,
  selectedPesticide: null,
});

const router = useRouter();
const userId = ref(null);

// Entêtes du tableau
const headers = [
  { text: 'Nom', value: 'name' },
  { text: 'Quantité', value: 'quantity' },
  { text: 'Unité', value: 'unit' },
  { text: 'Statut', value: 'status', sortable: false }, // Nouvelle colonne pour le statut
  { text: 'Actions', value: 'actions', sortable: false }
];

// Chargement des pesticides depuis l'API
const loadPesticides = async () => {
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

    const pesticideResponse = await axios.get(`http://localhost:3001/api/pesticides/${userId.value}`);
    pesticides.value = pesticideResponse.data;

    // Vérifier les pesticides critiques
    const criticalPesticides = pesticides.value.filter(pesticide => pesticide.quantity < CRITICAL_QUANTITY);
    if (criticalPesticides.length > 0) {
      showMessage('error', 'Alerte', `Attention, ${criticalPesticides.length} pesticide(s) ont une quantité critique !`);
    }
  } catch (error) {
    console.error('Erreur lors du chargement des pesticides:', error);
    showMessage('error', 'Erreur', 'Erreur de connexion au serveur.');
  }
};

// Filtrer les pesticides en fonction de la recherche
const filteredPesticides = computed(() =>
  pesticides.value.filter(pesticide =>
    pesticide.name.toLowerCase().includes(search.value.toLowerCase())
));

// Ouvrir le dialogue pour ajouter/modifier un pesticide
const openPesticideDialog = (pesticide = null) => {
  if (pesticide) {
    newPesticide.value = { ...pesticide };
    selectedPesticideId.value = pesticide.id;
    pesticideDialog.value.title = 'Modifier le pesticide';
    pesticideDialog.value.action = 'Modifier';
  } else {
    clearForm();
    pesticideDialog.value.title = 'Ajouter un nouveau pesticide';
    pesticideDialog.value.action = 'Ajouter';
  }
  pesticideDialog.value.visible = true;
};

// Ouvrir la boîte de dialogue pour l'entrée
const openEntryDialog = (pesticide) => {
  entryDialog.value.selectedPesticide = pesticide;
  entryDialog.value.quantity = 0;
  entryDialog.value.visible = true;
};

// Ouvrir la boîte de dialogue pour la sortie
const openExitDialog = (pesticide) => {
  exitDialog.value.selectedPesticide = pesticide;
  exitDialog.value.quantity = 0;
  exitDialog.value.visible = true;
};

// Ouvrir la boîte de dialogue pour la suppression
const openDeleteDialog = (pesticide) => {
  deleteDialog.value.selectedPesticide = pesticide;
  deleteDialog.value.visible = true;
};

// Confirmer la suppression d'un pesticide
const confirmDelete = async () => {
  const pesticide = deleteDialog.value.selectedPesticide;
  if (!pesticide) return;

  try {
    await axios.delete(`http://localhost:3001/api/pesticides/${pesticide.id}`);
    await loadPesticides(); // Recharge les données après suppression
    showMessage('success', 'Succès', 'Pesticide supprimé avec succès !');
  } catch (error) {
    console.error('Erreur lors de la suppression du pesticide:', error);
    showMessage('error', 'Erreur', 'Erreur lors de la suppression du pesticide.');
  }
  deleteDialog.value.visible = false;
};

// Gérer l'entrée de pesticides
const handleEntry = async () => {
  const quantity = entryDialog.value.quantity;
  const pesticide = entryDialog.value.selectedPesticide;

  if (quantity > 0) {
    try {
      const currentQuantity = parseInt(pesticide.quantity, 10);
      if (isNaN(currentQuantity)) {
        showMessage('error', 'Erreur', 'La quantité actuelle est invalide.');
        return;
      }

      const newQuantity = currentQuantity + quantity;
      const updatedPesticide = { ...pesticide, quantity: newQuantity };

      await axios.put(`http://localhost:3001/api/pesticides/${pesticide.id}`, updatedPesticide);
      await axios.post('http://localhost:3001/historique', {
        user_id: userId.value,
        type: 'pesticides',
        name: pesticide.name,
        quantity,
        unit: pesticide.unit,
        niveau: 'entrer',
        date: new Date().toISOString(),
      });

      loadPesticides();
      showMessage('success', 'Succès', 'Quantité ajoutée avec succès !');
    } catch (error) {
      console.error("Erreur lors de l'entrée du pesticide:", error);
      showMessage('error', 'Erreur', "Impossible d'ajouter la quantité.");
    }
  } else {
    showMessage('error', 'Erreur', 'Quantité invalide !');
  }
  entryDialog.value.visible = false;
};

// Gérer la sortie de pesticides
const handleExit = async () => {
  const quantity = exitDialog.value.quantity;
  const pesticide = exitDialog.value.selectedPesticide;

  if (quantity > 0 && quantity <= pesticide.quantity) {
    try {
      const currentQuantity = parseInt(pesticide.quantity, 10);
      if (isNaN(currentQuantity)) {
        showMessage('error', 'Erreur', 'La quantité actuelle est invalide.');
        return;
      }

      const newQuantity = currentQuantity - quantity;
      const updatedPesticide = { ...pesticide, quantity: newQuantity };

      await axios.put(`http://localhost:3001/api/pesticides/${pesticide.id}`, updatedPesticide);
      await axios.post('http://localhost:3001/historique', {
        user_id: userId.value,
        type: 'pesticides',
        name: pesticide.name,
        quantity,
        unit: pesticide.unit,
        niveau: 'sortie',
        date: new Date().toISOString(),
      });

      loadPesticides();

      // Vérifier si la quantité restante est critique
      if (newQuantity < CRITICAL_QUANTITY) {
        showMessage('error', 'Alerte', `La quantité de "${pesticide.name}" est maintenant critique !`);
      } else if (newQuantity === 0) {
        showMessage('warning', 'Alerte', `Le pesticide "${pesticide.name}" est maintenant terminé !`);
      } else {
        showMessage('success', 'Succès', 'Quantité retirée avec succès !');
      }
    } catch (error) {
      console.error("Erreur lors de la sortie du pesticide:", error);
      showMessage('error', 'Erreur', "Impossible de retirer la quantité.");
    }
  } else {
    showMessage('error', 'Erreur', 'Quantité invalide ou insuffisante !');
  }
  exitDialog.value.visible = false;
};

// Vérifier si le pesticide existe déjà
const checkExistingPesticide = () => {
  const existingPesticide = pesticides.value.find(
    pesticide => pesticide.name.toLowerCase() === newPesticide.value.name.toLowerCase()
  );
  if (existingPesticide) {
    showMessage('warning', 'Pesticide existant', `Le pesticide "${newPesticide.value.name}" existe déjà. Souhaitez-vous ajouter une nouvelle entrée ?`, {
      text: 'Faire une entrée',
      handler: () => {
        messageDialog.value.visible = false; // Fermer la boîte de dialogue
        setTimeout(() => {
          openEntryDialog(existingPesticide); // Ouvrir la boîte de dialogue d'entrée
        }, 300); // Petite attente pour éviter un bug d'affichage
      },
    });
    return true; // Retourne true si le pesticide existe
  }
  return false; // Retourne false si le pesticide n'existe pas
};

// Sauvegarder le pesticide (ajouter ou modifier)
const savePesticide = async () => {
  // Vérifier si le pesticide existe déjà (sauf en mode édition)
  if (!selectedPesticideId.value && checkExistingPesticide()) return;

  try {
    if (!newPesticide.value.name || !newPesticide.value.quantity || !newPesticide.value.unit) {
      showMessage('error', 'Erreur', 'Veuillez remplir tous les champs obligatoires.');
      return;
    }

    if (isNaN(newPesticide.value.quantity) || newPesticide.value.quantity < 0) {
      showMessage('error', 'Erreur', 'La quantité doit être un nombre positif.');
      return;
    }

    newPesticide.value.user_id = userId.value;

    if (selectedPesticideId.value) {
      await axios.put(`http://localhost:3001/api/pesticides/${selectedPesticideId.value}`, newPesticide.value);
    } else {
      await axios.post('http://localhost:3001/api/pesticides', newPesticide.value);
    }

    await axios.post('http://localhost:3001/historique', {
      user_id: userId.value,
      type: 'pesticides',
      name: newPesticide.value.name,
      quantity: newPesticide.value.quantity,
      unit: newPesticide.value.unit,
      niveau: selectedPesticideId.value ? 'modifier' : 'ajouter',
      date: new Date().toISOString(),
    });

    clearForm();
    loadPesticides();

    // Vérifier si la quantité est critique
    if (newPesticide.value.quantity < CRITICAL_QUANTITY) {
      showMessage('error', 'Alerte', `La quantité de "${newPesticide.value.name}" est critique !`);
    } else if (newPesticide.value.quantity === 0) {
      showMessage('warning', 'Alerte', `Le pesticide "${newPesticide.value.name}" est maintenant terminé !`);
    } else {
      showMessage('success', 'Succès', 'Pesticide sauvegardé avec succès !');
    }
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du pesticide:', error);
    showMessage('error', 'Erreur', "Impossible d'enregistrer le pesticide.");
  }
};

// Réinitialiser le formulaire
const clearForm = () => {
  newPesticide.value = { name: '', quantity: 0, unit: '' };
  selectedPesticideId.value = null;
  pesticideDialog.value.visible = false;
};

// Afficher un message
const showMessage = (type, title, message, action = null) => {
  messageDialog.value = {
    visible: true,
    type,
    title,
    message,
    action,
  };
};

// Charger les pesticides au montage du composant
onMounted(() => {
  loadPesticides();
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