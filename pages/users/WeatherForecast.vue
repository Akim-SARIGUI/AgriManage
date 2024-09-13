<template>
  <div>
    <h1>Weather Forecast</h1>
    <p v-if="currentTemperature !== null">Current temperature: {{ currentTemperature }}°C</p>
    <p v-if="weatherCode !== null">Weather code: {{ weatherCode }}</p>
    <p v-if="windSpeed !== null">Wind speed: {{ windSpeed }} m/s</p>
    <p v-if="windDirection !== null">Wind direction: {{ windDirection }}°</p>
    <h2>Hourly forecast</h2>
    <ul>
      <li v-for="hour in hourlyForecast" :key="hour.time">
        {{ hour.time }}: {{ hour.temperature }}°C, {{ hour.precipitation }} mm
      </li>
    </ul>
    <h2>Daily forecast</h2>
    <ul>
      <li v-for="day in dailyForecast" :key="day.time">
        {{ day.time }}: {{ day.temperatureMax }}°C / {{ day.temperatureMin }}°C
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { fetchWeatherApi } from 'openmeteo'

const currentTemperature = ref(null)
const weatherCode = ref(null)
const windSpeed = ref(null)
const windDirection = ref(null)
const hourlyForecast = ref([])
const dailyForecast = ref([])

async function getLocation() {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 })
  })
}

onMounted(async () => {
  try {
    const { coords } = await getLocation()
   const latitude = 40.7128 // New York
const longitude = -74.0060

    const params = {
      latitude: latitude,
      longitude: longitude,
      current_weather: 'true',
      hourly: 'temperature_2m,precipitation',
      daily: 'weathercode,temperature_2m_max,temperature_2m_min'
    }

    const url = 'https://api.open-meteo.com/v1/forecast'
    const response = await fetchWeatherApi(url, params)

    // Vérifiez si les données sont disponibles
    if (response.current_weather) {
      currentTemperature.value = response.current_weather.temperature
      weatherCode.value = response.current_weather.weathercode
      windSpeed.value = response.current_weather.windspeed
      windDirection.value = response.current_weather.winddirection
    }

    hourlyForecast.value = response.hourly.time.map((time, index) => ({
      time,
      temperature: response.hourly.temperature_2m[index],
      precipitation: response.hourly.precipitation[index]
    }))

    dailyForecast.value = response.daily.time.map((time, index) => ({
      time,
      temperatureMax: response.daily.temperature_2m_max[index],
      temperatureMin: response.daily.temperature_2m_min[index]
    }))
  } catch (error) {
    console.error('Error fetching weather data:', error)
  }
})
</script>
