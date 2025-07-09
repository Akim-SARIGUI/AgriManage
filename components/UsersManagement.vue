<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 text-md-h3">Gestion des Utilisateurs</h1>
        <v-btn color="success" @click="openAddUserDialog" class="mb-4">Ajouter un utilisateur</v-btn>
        <v-btn color="blue" @click="openAddAdminDialog" class="mb-4 ml-2">Ajouter un admin</v-btn>
        <v-data-table :headers="headers" :items="users" class="elevation-1">
          <template v-slot:item.actions="{ item }">
            <v-btn color="primary" @click="viewUser(item)" class="mb-2 mb-sm-0">Voir</v-btn>
            <v-btn color="warning" @click="openEditUserDialog(item)" class="mb-2 mb-sm-0 ml-2">Modifier</v-btn>
            <v-btn color="red" @click="confirmDeleteUser(item)" class="mb-2 mb-sm-0 ml-2">Supprimer</v-btn>
          </template>
        </v-data-table>
      </v-col>
    </v-row>

    <!-- Dialog pour ajouter un utilisateur -->
    <v-dialog v-model="addUserDialog" max-width="600px">
      <v-card>
        <v-card-title>
          <span class="headline">Ajouter un Utilisateur</span>
        </v-card-title>
        <v-card-text>
          <v-text-field v-model="newUser.full_name" label="Nom Complet" required></v-text-field>
          <v-text-field v-model="newUser.email" label="Email" required></v-text-field>
          <v-text-field v-model="newUser.role" label="Rôle" required></v-text-field>
          <v-text-field v-model="newUser.password" label="Mot de Passe" type="password" required></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-btn color="green darken-1" text @click="addUser">Ajouter</v-btn>
          <v-btn color="grey" text @click="closeAddUserDialog">Annuler</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog pour modifier un utilisateur -->
    <v-dialog v-model="editUserDialog" max-width="600px">
      <v-card>
        <v-card-title>
          <span class="headline">Modifier l'Utilisateur</span>
        </v-card-title>
        <v-card-text>
          <v-text-field v-model="selectedUser.full_name" label="Nom Complet" required></v-text-field>
          <v-text-field v-model="selectedUser.email" label="Email" required></v-text-field>
          <v-text-field v-model="selectedUser.role" label="Rôle" required></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-btn color="yellow darken-1" text @click="updateUser">Modifier</v-btn>
          <v-btn color="grey" text @click="closeEditUserDialog">Annuler</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog pour voir les détails d'un utilisateur -->
    <v-dialog v-model="viewUserDialog" max-width="600px">
      <v-card>
        <v-card-title>
          <span class="headline">Détails de l'Utilisateur</span>
        </v-card-title>
        <v-card-text>
          <p><strong>Nom Complet:</strong> {{ selectedUser.full_name }}</p>
          <p><strong>Email:</strong> {{ selectedUser.email }}</p>
          <p><strong>Rôle:</strong> {{ selectedUser.role }}</p>
        </v-card-text>
        <v-card-actions>
          <v-btn color="grey" text @click="closeViewUserDialog">Fermer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog de confirmation -->
    <v-dialog v-model="confirmDialog" max-width="400px">
      <v-card>
        <v-card-title>
          <span class="headline">Confirmation</span>
        </v-card-title>
        <v-card-text>
          {{ dialogMessage }}
        </v-card-text>
        <v-card-actions>
          <v-btn color="red" text @click="proceedDelete">Supprimer</v-btn>
          <v-btn color="grey" text @click="closeConfirmDialog">Annuler</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog d'erreur -->
    <v-dialog v-model="errorDialog" max-width="400px">
      <v-card>
        <v-card-title>
          <span class="headline">Erreur</span>
        </v-card-title>
        <v-card-text>
          {{ dialogMessage }}
        </v-card-text>
        <v-card-actions>
          <v-btn color="grey" text @click="closeErrorDialog">Fermer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      users: [],
      headers: [
        { text: 'Nom', value: 'full_name' },
        { text: 'Email', value: 'email' },
        { text: 'Rôle', value: 'role' },
        { text: 'Actions', value: 'actions', sortable: false },
      ],
      addUserDialog: false,
      editUserDialog: false,
      viewUserDialog: false,
      confirmDialog: false,
      errorDialog: false,
      dialogMessage: '',
      newUser: {
        full_name: '',
        email: '',
        role: '',
        password: '',
      },
      selectedUser: {},
      userToDelete: null, // Stocke l'utilisateur à supprimer
    };
  },
  mounted() {
    this.fetchUsers();
  },
  methods: {
    async fetchUsers() {
      try {
        const response = await axios.get('http://localhost:3001/api/users');
        this.users = response.data;
      } catch (error) {
        this.showError('Erreur lors de la récupération des utilisateurs.');
      }
    },
    openAddUserDialog() {
      this.newUser = { full_name: '', email: '', role: '', password: '' };
      this.addUserDialog = true;
    },
    openAddAdminDialog() {
      this.newUser = { full_name: '', email: '', role: 'admin', password: '' };
      this.addUserDialog = true;
    },
    async addUser() {
      try {
        await axios.post('http://localhost:3001/api/users', this.newUser);
        this.fetchUsers();
        this.addUserDialog = false;
      } catch (error) {
        this.showError("Erreur lors de l'ajout de l'utilisateur.");
      }
    },
    openEditUserDialog(user) {
      this.selectedUser = { ...user };
      this.editUserDialog = true;
    },
    async updateUser() {
      try {
        await axios.put(`http://localhost:3001/api/users/${this.selectedUser.id}`, this.selectedUser);
        this.fetchUsers();
        this.editUserDialog = false;
      } catch (error) {
        this.showError("Erreur lors de la mise à jour de l'utilisateur.");
      }
    },
    confirmDeleteUser(user) {
      this.userToDelete = user;
      this.dialogMessage = `Êtes-vous sûr de vouloir supprimer l'utilisateur ${user.full_name} ?`;
      this.confirmDialog = true;
    },
    async proceedDelete() {
      try {
        await axios.delete(`http://localhost:3001/api/users/${this.userToDelete.id}`);
        this.fetchUsers();
        this.confirmDialog = false;
      } catch (error) {
        this.showError("Erreur lors de la suppression de l'utilisateur.");
      }
    },
    viewUser(user) {
      this.selectedUser = user;
      this.viewUserDialog = true;
    },
    showError(message) {
      this.dialogMessage = message;
      this.errorDialog = true;
    },
    closeAddUserDialog() {
      this.addUserDialog = false;
    },
    closeEditUserDialog() {
      this.editUserDialog = false;
    },
    closeViewUserDialog() {
      this.viewUserDialog = false;
    },
    closeConfirmDialog() {
      this.confirmDialog = false;
    },
    closeErrorDialog() {
      this.errorDialog = false;
    },
  },
};
</script>

<style scoped>
/* Styles pour le tableau des utilisateurs */
.v-data-table {
  overflow-x: auto;
}

/* Ajustements pour les petits écrans */
@media (max-width: 600px) {
  .text-h4 {
    font-size: 1.5rem;
  }
  .v-btn {
    width: 100%;
    margin-bottom: 8px;
  }
  .v-btn.ml-2 {
    margin-left: 0 !important;
  }
}
</style>