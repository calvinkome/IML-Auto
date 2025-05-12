import React from 'react';
import { Phone, Mail, MessageCircle, Clock } from 'lucide-react';

export default function Support() {
  return (
    <div className="pt-20">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Service Client 24/7</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Notre équipe est disponible 24h/24 et 7j/7 pour répondre à vos besoins
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-semibold mb-6">Contactez-nous</h2>
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <Phone className="h-6 w-6 text-yellow-400" />
                <div>
                  <h3 className="font-semibold">Téléphone</h3>
                  <p className="text-gray-600">+243 819 623 320</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Mail className="h-6 w-6 text-yellow-400" />
                <div>
                  <h3 className="font-semibold">Email</h3>
                  <p className="text-gray-600">jbmbokanga@iml-consulting.com</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Clock className="h-6 w-6 text-yellow-400" />
                <div>
                  <h3 className="font-semibold">Horaires</h3>
                  <p className="text-gray-600">24h/24 - 7j/7</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-semibold mb-6">Formulaire de Contact</h2>
            <form className="space-y-4">
              <div>
                <label className="block text-gray-700 mb-2">Nom complet</label>
                <input
                  type="text"
                  className="w-full border rounded-md p-2"
                  placeholder="Votre nom"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  className="w-full border rounded-md p-2"
                  placeholder="votre@email.com"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Téléphone</label>
                <input
                  type="tel"
                  className="w-full border rounded-md p-2"
                  placeholder="+243..."
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Type de demande</label>
                <select className="w-full border rounded-md p-2">
                  <option>Assistance immédiate</option>
                  <option>Question générale</option>
                  <option>Réclamation</option>
                  <option>Autre</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Message</label>
                <textarea
                  className="w-full border rounded-md p-2"
                  rows={4}
                  placeholder="Comment pouvons-nous vous aider ?"
                ></textarea>
              </div>
              <button
                type="submit"
                className="w-full bg-yellow-400 text-black py-2 rounded-md font-semibold hover:bg-yellow-500"
              >
                Envoyer
              </button>
            </form>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-8">
          <h2 className="text-2xl font-semibold mb-6">FAQ</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold mb-2">Comment puis-je réserver un véhicule ?</h3>
              <p className="text-gray-600">
                Vous pouvez réserver un véhicule directement sur notre site web ou en nous contactant par téléphone.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Quels sont les modes de paiement acceptés ?</h3>
              <p className="text-gray-600">
                Nous acceptons les paiements par Mobile Money et carte bancaire.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Comment annuler une réservation ?</h3>
              <p className="text-gray-600">
                Contactez notre service client 24/7 pour toute modification ou annulation de réservation.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Que faire en cas de panne ?</h3>
              <p className="text-gray-600">
                Notre service d'assistance est disponible 24/7. Appelez-nous immédiatement pour une intervention rapide.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}