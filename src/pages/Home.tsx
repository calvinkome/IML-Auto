import React from 'react';
import Hero from '../components/Hero';
import Services from '../components/Services';
import CarList from '../components/CarList';
import Testimonials from '../components/Testimonials';

export default function Home() {
  return (
    <div>
      <Hero />
      <Services />
      <CarList />
      <Testimonials />
    </div>
  );
}