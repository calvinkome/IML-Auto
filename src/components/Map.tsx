import React, { useEffect, useRef } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

interface MapProps {
  className?: string;
}

const KINSHASA_COORDINATES = {
  lat: -4.3250,
  lng: 15.3222
};

const IML_COORDINATES = {
  lat: -4.3179, // Approximative coordinates for Pullman Hotel area
  lng: 15.3136
};

export default function Map({ className = '' }: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);

  useEffect(() => {
    const initMap = async () => {
      try {
        const loader = new Loader({
          apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
          version: 'weekly',
        });

        const { Map } = await loader.importLibrary('maps');
        
        if (!mapRef.current || mapInstanceRef.current) return;

        mapInstanceRef.current = new Map(mapRef.current, {
          center: { lat: -4.3179, lng: 15.3136 },
          zoom: 16,
          disableDefaultUI: true,
          zoomControl: true,
          mapTypeControl: true,
          scaleControl: true,
          streetViewControl: true,
          rotateControl: true,
          fullscreenControl: true
        });

        // Custom marker
        if (mapInstanceRef.current) {
          const marker = new google.maps.Marker({
            position: { lat: -4.3179, lng: 15.3136 },
            map: mapInstanceRef.current,
            title: 'IML Auto'
          });

          const infoWindow = new google.maps.InfoWindow({
            content: `
              <div style="padding: 8px;">
                <h3 style="font-weight: 600; margin-bottom: 4px;">IML Auto </h3>
                <p style="font-size: 14px;">81 bis, avenue Uvira, commune de Gombe</p>
                <p style="font-size: 14px; color: #666;">(Réf : Pullman Hôtel)</p>
              </div>
            `
          });

          marker.addListener('click', () => {
            infoWindow.open(mapInstanceRef.current, marker);
          });
        }

      } catch (error) {
        console.error('Error loading Google Maps:', error);
        if (mapRef.current) {
          // Show a more informative error message when API key is missing
          const errorMessage = !import.meta.env.VITE_GOOGLE_MAPS_API_KEY
            ? 'Clé API Google Maps manquante. Veuillez configurer VITE_GOOGLE_MAPS_API_KEY dans le fichier .env'
            : 'Impossible de charger la carte. Veuillez réessayer plus tard.';
          
          mapRef.current.innerHTML = `
          <div class="flex items-center justify-center h-full bg-gray-100 rounded-lg p-4 text-center">
            <div>
              <p class="text-gray-500 mb-2">${errorMessage}</p>
              <p class="text-sm text-gray-400">81 bis, avenue Uvira, commune de Gombe (Réf : Pullman Hôtel)</p>
            </div>
          </div>
        `;
        }
      }
    };

    initMap();

    return () => {
      mapInstanceRef.current = null;
    };
  }, []);

  return <div ref={mapRef} className={`w-full h-full min-h-[400px] rounded-lg ${className}`} />;
}