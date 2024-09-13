<template>
  <div class="profile-container">
    <h1 class="text-3xl font-bold text-green-600 mb-6">Profil Utilisateur</h1>
    
    <div v-if="user" class="profile-info">
      <p><strong>Nom :</strong> {{ user.name }}</p>
      <p><strong>Email :</strong> {{ user.email }}</p>
      <p><strong>Rôle :</strong> {{ user.role }}</p>
    </div>
    <div v-else>
      <p>Chargement des informations...</p>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      user: null,
      error: null
    };
  },
  async created() {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        this.$router.push('/login');
        return;
      }

      // Requête pour obtenir les informations de l'utilisateur
      const response = await this.$axios.get('/api/user-profile', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      this.user = response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des informations de l\'utilisateur:', error);
      this.error = 'Erreur lors de la récupération des informations.';
    }
  }
};
</script>

<style scoped>
.profile-container {
  max-width: 800px;
  margin: auto;
  padding: 20px;
}
.profile-info p {
  font-size: 18px;
  margin-bottom: 10px;
}
</style>
