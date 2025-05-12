import React from 'react';
import { MapPin, Phone, Mail, Clock, Car } from 'lucide-react';

export default function Footer() {
  return (
    <footer id="contact" className="bg-black text-white py-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-6">
              <Car className="h-8 w-8 text-yellow-400" />
              <span className="text-xl font-bold">IML Auto</span>
            </div>
            <p className="text-gray-400">
              Votre partenaire de confiance pour la location de véhicules et le service protocolaire à Kinshasa.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Contact</h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <MapPin className="h-5 w-5 text-yellow-400" />
                <p>81 bis, avenue Uvira, commune de Gombe (Réf : Pullman Hôtel)</p>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-yellow-400" />
                <p>+243 819 623 320</p>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-yellow-400" />
                <p>jbmbokanga@iml-consulting.com</p>
              </div>
              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-yellow-400" />
                <p>Lun - Sam de 8h à 18h</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Services</h3>
            <ul className="space-y-2">
              <li><a href="/fleet" className="hover:text-yellow-400">Location de véhicules</a></li>
              <li><a href="/premium-service" className="hover:text-yellow-400">Service protocolaire</a></li>
              <li><a href="/airport-service" className="hover:text-yellow-400">Transport aéroportuaire</a></li>
              <li><a href="/fleet" className="hover:text-yellow-400">Location longue durée</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Liens rapides</h3>
            <ul className="space-y-2">
              <li><a href="/" className="hover:text-yellow-400">Accueil</a></li>
              <li><a href="#services" className="hover:text-yellow-400">Services</a></li>
              <li><a href="/fleet" className="hover:text-yellow-400">Véhicules</a></li>
              <li><a href="#temoignages" className="hover:text-yellow-400">Témoignages</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 text-center">
          <p className="text-gray-400">
            © {new Date().getFullYear()} IML Auto. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
}