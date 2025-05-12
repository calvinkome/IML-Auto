import React from 'react';
import { Users, Car, Calendar, BarChart as ChartBar, Settings, FileText } from 'lucide-react';

const AdminDashboard = () => {
  return (
    <div className="pt-20 min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold mb-8">Tableau de bord administrateur</h1>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Quick Stats */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Utilisateurs</h3>
              <Users className="h-6 w-6 text-yellow-400" />
            </div>
            <p className="text-3xl font-bold">0</p>
            <p className="text-sm text-gray-500">Total des utilisateurs</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Véhicules</h3>
              <Car className="h-6 w-6 text-yellow-400" />
            </div>
            <p className="text-3xl font-bold">0</p>
            <p className="text-sm text-gray-500">Flotte totale</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Réservations</h3>
              <Calendar className="h-6 w-6 text-yellow-400" />
            </div>
            <p className="text-3xl font-bold">0</p>
            <p className="text-sm text-gray-500">Réservations actives</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Activité récente</h2>
            <div className="space-y-4">
              <p className="text-gray-500 text-center py-4">Aucune activité récente</p>
            </div>
          </div>

          {/* Analytics Preview */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Aperçu analytique</h2>
            <div className="h-64 flex items-center justify-center">
              <ChartBar className="h-12 w-12 text-gray-300" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;