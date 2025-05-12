import React from 'react';
import { MapPin, Phone, Mail, Clock, Shield, Target, Users, Award, Heart, CheckCircle, Star } from 'lucide-react';
import { motion } from 'framer-motion';

interface TimelineItem {
  year: string;
  title: string;
  description: string;
}

const timelineItems: TimelineItem[] = [
  {
    year: '2023',
    title: 'Création d\'IML Auto',
    description: 'Début de l\'aventure avec une flotte de 10 véhicules',
  },
  {
    year: '2024',
    title: 'Expansion des Services',
    description: 'Intégration des services de diagnostic automobile',
  },
  {
    year: '2025',
    title: 'Innovation Continue',
    description: 'Modernisation des services et développement',
  },
];

export default function About() {
  return (
    <div className="pt-20 bg-white">
      {/* Hero Section */}
      <div className="relative h-[50vh] bg-black">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: 'url("https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&q=80")',
          }}
        >
          <div className="absolute inset-0 bg-black bg-opacity-70"></div>
        </div>
        <div className="relative h-full flex items-center">
          <div className="max-w-7xl mx-auto px-6 text-white">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-4xl md:text-5xl font-bold mb-6"
            >
              À Propos de IML Auto
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-xl max-w-2xl"
            >
              Votre partenaire de confiance depuis 2010 pour la location de véhicules et les services de diagnostic automobile
            </motion.p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Timeline Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <h2 className="text-3xl font-bold text-center mb-12">Notre Histoire</h2>
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-yellow-400"></div>

            {/* Timeline Items */}
            <div className="space-y-20">
              {timelineItems.map((item, index) => (
                <motion.div
                  key={item.year}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.2 }}
                  className={`relative flex items-center ${
                    index % 2 === 0 ? 'justify-start' : 'justify-end'
                  }`}
                >
                  {/* Timeline Point */}
                  <div className="absolute left-1/2 transform -translate-x-1/2 w-4 h-4 bg-yellow-400 rounded-full"></div>

                  {/* Content */}
                  <div className={`w-5/12 ${index % 2 === 0 ? 'pr-8 text-right' : 'pl-8'}`}>
                    <div className="bg-white p-6 rounded-lg shadow-lg">
                      <div className="text-yellow-400 font-bold text-xl mb-2">{item.year}</div>
                      <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                      <p className="text-gray-600">{item.description}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Nos Valeurs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <h2 className="text-3xl font-bold mb-12 text-center">Nos Valeurs Fondamentales</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
              <Shield className="h-12 w-12 text-yellow-400 mb-6" />
              <h3 className="text-xl font-semibold mb-4">Excellence</h3>
              <p className="text-gray-600">
                Nous visons l'excellence dans chaque aspect de nos services, de la qualité de notre flotte à l'attention portée à chaque détail.
              </p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
              <Heart className="h-12 w-12 text-yellow-400 mb-6" />
              <h3 className="text-xl font-semibold mb-4">Engagement</h3>
              <p className="text-gray-600">
                Notre engagement envers la satisfaction client guide chacune de nos actions et décisions.
              </p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
              <Award className="h-12 w-12 text-yellow-400 mb-6" />
              <h3 className="text-xl font-semibold mb-4">Innovation</h3>
              <p className="text-gray-600">
                Nous innovons constamment pour offrir des solutions modernes et adaptées à vos besoins.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Certifications */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <h2 className="text-3xl font-bold text-center mb-12">Nos Certifications</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-lg text-center">
              <Star className="h-12 w-12 text-yellow-400 mx-auto mb-6" />
              <h3 className="text-xl font-semibold mb-4">ISO 9001</h3>
              <p className="text-gray-600">
                Certification de management de la qualité
              </p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-lg text-center">
              <Shield className="h-12 w-12 text-yellow-400 mx-auto mb-6" />
              <h3 className="text-xl font-semibold mb-4">Certification AFNOR</h3>
              <p className="text-gray-600">
                Conformité aux normes françaises
              </p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-lg text-center">
              <CheckCircle className="h-12 w-12 text-yellow-400 mx-auto mb-6" />
              <h3 className="text-xl font-semibold mb-4">Label Qualité</h3>
              <p className="text-gray-600">
                Excellence des services automobile
              </p>
            </div>
          </div>
        </motion.div>

        {/* Notre Mission */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16 bg-gray-50 rounded-2xl p-12"
        >
          <div className="max-w-3xl mx-auto text-center">
            <Target className="h-12 w-12 text-yellow-400 mx-auto mb-6" />
            <h2 className="text-3xl font-bold mb-6">Notre Mission</h2>
            <p className="text-gray-600 text-lg leading-relaxed">
              Offrir une expérience de transport premium inégalée, en combinant des véhicules haut de gamme avec un service personnalisé exceptionnel, tout en contribuant au développement du secteur automobile à Kinshasa.
            </p>
          </div>
        </motion.div>

        {/* Contact */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-black text-white rounded-2xl p-12"
        >
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl font-bold mb-6">Contactez-nous</h2>
              <p className="mb-8 text-gray-300">
                Notre équipe est à votre disposition pour répondre à toutes vos questions
              </p>
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <MapPin className="h-6 w-6 text-yellow-400" />
                  <p>81 bis, avenue Uvira, commune de Gombe (Réf : Pullman Hôtel)</p>
                </div>
                <div className="flex items-center space-x-4">
                  <Phone className="h-6 w-6 text-yellow-400" />
                  <p>+243 819 623 320</p>
                </div>
                <div className="flex items-center space-x-4">
                  <Mail className="h-6 w-6 text-yellow-400" />
                  <p>jbmbokanga@iml-consulting.com</p>
                </div>
                <div className="flex items-center space-x-4">
                  <Clock className="h-6 w-6 text-yellow-400" />
                  <p>Lun - Sam de 8h à 18h</p>
                </div>
              </div>
            </div>
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1568992687947-868a62a9f521?auto=format&fit=crop&q=80"
                alt="Notre équipe"
                className="rounded-lg w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}