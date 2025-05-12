import React from 'react';
import { Star } from 'lucide-react';

const testimonials = [
  {
    name: 'Jean-Paul M.',
    rating: 5,
    comment: 'Service exceptionnel ! La voiture était impeccable et le service protocolaire à l\'aéroport très professionnel.'
  },
  {
    name: 'Marie K.',
    rating: 5,
    comment: 'Très satisfaite de la qualité du service. Le personnel est courtois et professionnel.'
  },
  {
    name: 'Patrick L.',
    rating: 4,
    comment: 'Excellent rapport qualité-prix. Je recommande vivement leurs services.'
  }
];

export default function Testimonials() {
  return (
    <section id="temoignages" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="text-4xl font-bold text-center mb-4">Témoignages</h2>
        <p className="text-gray-600 text-center mb-12">
          Ce que nos clients disent de nous
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-white p-6 rounded-lg shadow-lg">
              <div className="flex mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-600 mb-4">{testimonial.comment}</p>
              <p className="font-semibold">{testimonial.name}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}