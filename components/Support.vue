<template>
  <v-app>
    <v-container fluid>
      <!-- FAQ Section -->
      <v-row>
        <v-col cols="12" md="8" offset-md="2">
          <v-card outlined>
            <v-card-title>
              <v-icon left>mdi-help-circle</v-icon> FAQ
            </v-card-title>
            <v-card-text>
              <v-expansion-panels>
                <v-expansion-panel v-for="(item, index) in faqs" :key="index">
                  <v-expansion-panel-header>{{ item.question }}</v-expansion-panel-header>
                  <v-expansion-panel-content>{{ item.answer }}</v-expansion-panel-content>
                </v-expansion-panel>
              </v-expansion-panels>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Contact Support Section -->
      <v-row class="mt-4">
        <v-col cols="12" md="8" offset-md="2">
          <v-card outlined>
            <v-card-title>
              <v-icon left>mdi-email</v-icon> Contactez le Support
            </v-card-title>
            <v-card-text>
              <v-form ref="contactForm">
                <v-text-field
                  v-model="contact.name"
                  label="Nom"
                  :rules="nameRules"
                  outlined
                  class="mb-4"
                ></v-text-field>
                <v-text-field
                  v-model="contact.email"
                  label="Email"
                  :rules="emailRules"
                  outlined
                  class="mb-4"
                ></v-text-field>
                <v-textarea
                  v-model="contact.message"
                  label="Message"
                  :rules="messageRules"
                  outlined
                  class="mb-4"
                ></v-textarea>
                <v-btn @click="sendMessage" color="primary" class="animated-button">
                  Envoyer le Message
                </v-btn>
              </v-form>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </v-app>
</template>

<script>
import axios from 'axios'; // Import axios

export default {
  data() {
    return {
      faqs: [],
      contact: {
        name: '',
        email: '',
        message: ''
      },
      nameRules: [v => !!v || 'Le nom est requis'],
      emailRules: [v => /.+@.+\..+/.test(v) || 'L\'email doit être valide'],
      messageRules: [v => !!v || 'Le message est requis']
    };
  },
  async mounted() {
    await this.fetchFAQs();
  },
  methods: {
    async fetchFAQs() {
      try {
        const response = await axios.get('http://localhost:3001/api/faqs'); // Using Axios
        this.faqs = response.data;
      } catch (error) {
        console.error('Erreur lors de la récupération des FAQs:', error);
        alert('Erreur lors de la récupération des FAQs. Veuillez réessayer plus tard.');
      }
    },
    async sendMessage() {
      if (!this.$refs.contactForm.validate()) {
        return;
      }

      try {
        const response = await axios.post('http://localhost:3001/api/contact-support', this.contact); // Using Axios

        if (response.status === 200) {
          alert('Votre message a été envoyé avec succès');
          this.contact = { name: '', email: '', message: '' }; // Clear the form
        }
      } catch (error) {
        console.error('Erreur lors de l\'envoi du message:', error);
        alert(`Erreur: ${error.message}`);
      }
    }
  }
};
</script>

<style scoped>
.animated-button {
  transition: all 0.3s ease;
}

.animated-button:hover {
  transform: scale(1.05);
  box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.3);
}

.mb-4 {
  margin-bottom: 16px;
}

.mt-4 {
  margin-top: 16px;
}
</style>
