<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <h1>Gestion des Utilisateurs</h1>
        <v-btn color="success" @click="openAddUserDialog">Ajouter un utilisateur</v-btn>
        <v-data-table :headers="headers" :items="users" class="elevation-1">
          <template v-slot:item.actions="{ item }">
            <v-btn  color="primary" @click="viewUser(item)">Voir</v-btn>
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
      this.newUser = { full_name: '', email: '', role: '', password: '' }; // Réinitialiser le formulaire
      this.addUserDialog = true;
    },
    async addUser() {
      try {
        await axios.post('http://localhost:3001/api/users', this.newUser);
        this.fetchUsers(); // Recharger la liste des utilisateurs
        this.addUserDialog = false; // Fermer le dialogue
      } catch (error) {
        console.error('Erreur lors de l\'ajout de l\'utilisateur:', error);
      }
    },
    openEditUserDialog(user) {
      this.selectedUser = { ...user }; // Créer une copie de l'utilisateur sélectionné
      this.editUserDialog = true;
    },
    async updateUser() {
      try {
        await axios.put(`http://localhost:3001/api/users/${this.selectedUser.id}`, this.selectedUser);
        this.fetchUsers(); // Recharger la liste des utilisateurs
        this.editUserDialog = false; // Fermer le dialogue
      } catch (error) {
        console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
      }
    },
    async deleteUser(user) {
      const confirmDelete = confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur ${user.full_name} ?`);
      if (confirmDelete) {
        try {
          await axios.delete(`http://localhost:3001/api/users/${user.id}`);
          this.fetchUsers(); // Recharger la liste des utilisateurs
        } catch (error) {
          console.error('Erreur lors de la suppression de l\'utilisateur:', error);
        }
      }
    },
    viewUser(user) {
      this.selectedUser = user; // Assignation de l'utilisateur sélectionné
      this.viewUserDialog = true; // Ouvrir le dialogue de vue
    },
    closeAddUserDialog() {
      this.addUserDialog = false; // Fermer le dialogue d'ajout
    },
    closeEditUserDialog() {
      this.editUserDialog = false; // Fermer le dialogue de modification
    },
    closeViewUserDialog() {
      this.viewUserDialog = false; // Fermer le dialogue de vue
    },
  },
};
</script>

<style scoped>
/* Styles pour le tableau des utilisateurs */
</style>
