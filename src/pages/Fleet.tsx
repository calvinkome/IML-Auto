import React from 'react';
import CarList from '../components/CarList';

export default function Fleet() {
  return (
    <div className="pt-20">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            Découvrez notre flotte de véhicules haut de gamme
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Une sélection exclusive de véhicules premium pour tous vos besoins de mobilité
          </p>
        </div>

        <CarList />
      </div>
    </div>
  );
}