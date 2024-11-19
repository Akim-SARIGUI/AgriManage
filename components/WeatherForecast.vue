<template>
  <v-app>
    <v-container class="py-5">
      <!-- Prévisions Actuelles (3 prochains jours) -->
      <v-row>
        <v-col cols="12">
          <v-card class="elevation-2">
            <v-card-title>
              <v-icon>mdi-weather-sunny</v-icon>
              <span class="title ml-2">Prévisions Actuelles</span>
            </v-card-title>
            <v-card-subtitle>
              Prévisions pour aujourd'hui et les deux jours suivants
            </v-card-subtitle>
            <v-card-text>
              <v-row color="green">
                <v-col v-for="(forecast, index) in currentForecasts" :key="index" cols="12" md="4">
                  <v-card class="elevation-1" flat>
                    <v-card-title>
                      <v-icon>mdi-weather-partly-cloudy</v-icon>
                      <span class="ml-2">{{ forecast.date }}</span>
                    </v-card-title>
                    <v-card-subtitle>{{ forecast.weather }}</v-card-subtitle>
                    <v-card-text>
                      Max Temp : {{ forecast.temp_max }} °C
                      <br>
                      Min Temp : {{ forecast.temp_min }} °C
                      <br>
                      Précipitations : {{ forecast.precipitation }} mm
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Prévisions Historique (4 jours restants) -->
      <v-row class="mt-5">
        <v-col cols="12">
          <v-card class="elevation-2">
            <v-card-title>
              <v-icon>mdi-history</v-icon>
              <span class="title ml-2">Prévisions Historique</span>
            </v-card-title>
            <v-card-subtitle>
              Historique des prévisions météorologiques
            </v-card-subtitle>
            <v-card-text>
              <v-data-table
                :headers="historicalHeaders"
                :items="historicalForecasts"
                item-key="date"
                class="elevation-1"
              >
                <template v-slot:item.date="{ item }">
                  {{ item.date }}
                </template>
                <template v-slot:item.weather="{ item }">
                  {{ item.weather }}
                </template>
                <template v-slot:item.temp_max="{ item }">
                  {{ item.temp_max }} °C
                </template>
                <template v-slot:item.temp_min="{ item }">
                  {{ item.temp_min }} °C
                </template>
                <template v-slot:item.precipitation="{ item }">
                  {{ item.precipitation }} mm
                </template>
              </v-data-table>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </v-app>
</template>

<script>
export default {
  data() {
    return {
      currentForecasts: [], // Prévisions pour aujourd'hui et les deux jours suivants
      historicalForecasts: [], // Prévisions pour les quatre jours restants
      historicalHeaders: [
        { text: 'Date', value: 'date' },
        { text: 'Météo', value: 'weather' },
        { text: 'Temp Max', value: 'temp_max' },
        { text: 'Temp Min', value: 'temp_min' },
        { text: 'Précipitations', value: 'precipitation' }
      ]
    };
  },
  mounted() {
    this.getLocation();
   
  },
  methods: {
    async getWeather(latitude, longitude) {
       console.log(latitude,longitude)
      const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`;
 
      try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        
        // Diviser les prévisions : 3 premiers jours dans currentForecasts, 4 derniers dans historicalForecasts
        this.currentForecasts = data.daily.time.slice(0, 3).map((date, index) => ({
          date: new Date(date).toLocaleDateString(),
          temp_max: data.daily.temperature_2m_max[index],
          temp_min: data.daily.temperature_2m_min[index],
          precipitation: data.daily.precipitation_sum[index],
          weather: this.getWeatherDescription(data.daily.precipitation_sum[index])
        }));

        this.historicalForecasts = data.daily.time.slice(3, 7).map((date, index) => ({
          date: new Date(date).toLocaleDateString(),
          temp_max: data.daily.temperature_2m_max[index + 3],
          temp_min: data.daily.temperature_2m_min[index + 3],
          precipitation: data.daily.precipitation_sum[index + 3],
          weather: this.getWeatherDescription(data.daily.precipitation_sum[index + 3])
        }));
      } catch (error) {
        console.error('Erreur de récupération des données météo:', error);
      }
    },
    getWeatherDescription(precipitation) {
      if (precipitation > 0) return 'Pluvieux';
      else return 'Ensoleillé';
    },
    getLocation() {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          position => {
            const { latitude, longitude } = position.coords;
            this.getWeather(latitude, longitude);
          },
          error => {
            console.error('Erreur de géolocalisation:', error);
          }
        );
      } else {
        console.error("La géolocalisation n'est pas supportée par ce navigateur.");
      }
    },
    formatDate(date) {
      return new Date(date).toLocaleDateString('fr-FR');
    }
  }
};
</script>

<style scoped>
.v-card {
  background: #f5f5f5;
}

.v-card-title {
  background: #1b5e20;
  color: white;
}

.v-card-subtitle {
  font-weight: bold;
}

.v-data-table th, .v-data-table td {
  text-align: center;
}

.v-data-table {
  background: white;
}

.v-icon {
  font-size: 24px;
}

.title {
  font-size: 18px;
  font-weight: bold;
}

.mt-5 {
  margin-top: 40px;
}
</style>
