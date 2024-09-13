import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Configurez Leaflet pour l'utilisation côté client
export default ({ app }, inject) => {
  // Injecte Leaflet dans l'instance Vue
  inject('leaflet', L);
}
