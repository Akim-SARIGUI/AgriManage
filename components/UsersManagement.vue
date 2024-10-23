<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <h1>Gestion des Utilisateurs</h1>
        <v-btn color="success" @click="openAddUserDialog">Ajouter un utilisateur</v-btn>
        <v-btn color="blue" @click="openAddAdminDialog" class="ml-4">Ajouter un admin</v-btn>
        <v-data-table :headers="headers" :items="users" class="elevation-1">
          <template v-slot:item.actions="{ item }">
            <v-btn color="primary" @click="viewUser(item)">Voir</v-btn>
            <v-btn class="ml-5" color="warning" @click="openEditUserDialog(item)">Modifier</v-btn>
            <v-btn class="ml-5" color="red" @click="deleteUser(item)">Supprimer</v-btn>
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

  </v-container>
</template>

<script>
// Import axios for API calls
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
      newUser: {
        full_name: '',
        email: '',
        role: '',
        password: '',
      },
      selectedUser: {},
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
        console.error('Erreur lors de la récupération des utilisateurs:', error);
      }
    },
    openAddUserDialog() {
      this.newUser = { full_name: '', email: '', role: '', password: '' }; // Reset form for regular user
      this.addUserDialog = true;
    },
    openAddAdminDialog() {
      this.newUser = { full_name: '', email: '', role: 'admin', password: '' }; // Set role to admin
      this.addUserDialog = true; // Open dialog for adding user
    },
    async addUser() {
      try {
        await axios.post('http://localhost:3001/api/users', this.newUser);
        this.fetchUsers(); // Reload users list
        this.addUserDialog = false; // Close dialog
      } catch (error) {
        console.error('Erreur lors de l\'ajout de l\'utilisateur:', error);
      }
    },
    openEditUserDialog(user) {
      this.selectedUser = { ...user }; // Create a copy of the selected user
      this.editUserDialog = true;
    },
    async updateUser() {
      try {
        await axios.put(`http://localhost:3001/api/users/${this.selectedUser.id}`, this.selectedUser);
        this.fetchUsers(); // Reload users list
        this.editUserDialog = false; // Close dialog
      } catch (error) {
        console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
      }
    },
    async deleteUser(user) {
      const confirmDelete = confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur ${user.full_name} ?`);
      if (confirmDelete) {
        try {
          await axios.delete(`http://localhost:3001/api/users/${user.id}`);
          this.fetchUsers(); // Reload users list
        } catch (error) {
          console.error('Erreur lors de la suppression de l\'utilisateur:', error);
        }
      }
    },
    viewUser(user) {
      this.selectedUser = user; // Assign selected user
      this.viewUserDialog = true; // Open view dialog
    },
    closeAddUserDialog() {
      this.addUserDialog = false; // Close add dialog
    },
    closeEditUserDialog() {
      this.editUserDialog = false; // Close edit dialog
    },
    closeViewUserDialog() {
      this.viewUserDialog = false; // Close view dialog
    },
  },
};
</script>

<style scoped>
/* Styles pour le tableau des utilisateurs */
</style>

