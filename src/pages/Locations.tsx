import { MapPin, Phone, Mail, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

const locations = [
  {
    id: 'berlin',
    city: 'Berlin',
    country: 'Germany',
    address: 'Friedrichstraße 123, 10117 Berlin',
    phone: '+49 30 1234 5678',
    email: 'berlin@imlauto.com',
    hours: 'Mon - Fri: 9:00 - 18:00',
    image: 'https://images.unsplash.com/photo-1560969184-10fe8719e047?auto=format&fit=crop&q=60&w=1200',
    coordinates: {
      lat: 52.520008,
      lng: 13.404954,
    },
  },
  {
    id: 'vancouver',
    city: 'Vancouver',
    country: 'Canada',
    address: '789 West Georgia Street, Vancouver, BC V6C 1H2',
    phone: '+1 604 555 0123',
    email: 'vancouver@imlauto.com',
    hours: 'Mon - Sat: 8:00 - 17:00',
    image: 'https://images.unsplash.com/photo-1560814304-4f05b62af116?auto=format&fit=crop&q=60&w=1200',
    coordinates: {
      lat: 49.28273,
      lng: -123.120735,
    },
  },
];

const VehicleRentalPage = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLocations = locations.filter((location) =>
    location.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="pt-20">
      {/* Section des emplacements */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold mb-8">Nos emplacements</h2>
          <input
            type="text"
            placeholder="Rechercher une ville..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full max-w-md p-2 border rounded-lg mb-8"
          />
          <div className="space-y-16">
            {filteredLocations.map((location) => (
              <motion.div
                key={location.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
              >
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="relative h-[400px] overflow-hidden">
                      <img
                        src={location.image}
                        alt={`${location.city} office`}
                        className="absolute inset-0 w-full h-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-0 left-0 p-8 text-white">
                        <h2 className="text-3xl font-bold mb-2">{location.city}</h2>
                        <p className="text-lg">{location.country}</p>
                      </div>
                    </div>

                    <div className="p-8">
                      <div className="space-y-6">
                        {/* ... (autres informations) */}
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${location.coordinates.lat},${location.coordinates.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-4 py-2 bg-yellow-400 text-black rounded-lg hover:bg-yellow-500 transition-colors"
                        >
                          <MapPin className="h-5 w-5 mr-2" />
                          Obtenir l'itinéraire
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleRentalPage;