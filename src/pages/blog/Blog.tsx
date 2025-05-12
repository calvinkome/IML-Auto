import React from 'react';
import { Calendar, ArrowLeft } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

interface Article {
  id: number;
  title: string;
  excerpt: string;
  content: string;
  date: string;
  image: string;
}

const articles: Article[] = [
  {
    id: 1,
    title: 'Comment choisir la voiture parfaite pour vos besoins',
    excerpt: 'Guide complet pour sélectionner le véhicule idéal en fonction de vos besoins spécifiques...',
    content: `Un guide détaillé pour vous aider à choisir le véhicule parfait en fonction de vos besoins spécifiques. 
      Nous aborderons les différents critères à prendre en compte, de la taille du véhicule à la consommation de carburant, 
      en passant par les options de sécurité et le confort.`,
    date: '2024-03-15',
    image: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&q=80&w=800',
  },
  // ... other articles
];

const ArticleCard: React.FC<{ article: Article }> = ({ article }) => (
  <article className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
    <img
      src={article.image}
      alt={article.title}
      className="w-full h-48 object-cover"
      loading="lazy"
    />
    <div className="p-6">
      <div className="flex items-center text-gray-500 text-sm mb-3">
        <Calendar className="h-4 w-4 mr-2" />
        {new Date(article.date).toLocaleDateString('fr-FR')}
      </div>
      <h2 className="text-xl font-semibold mb-3 line-clamp-2">{article.title}</h2>
      <p className="text-gray-600 mb-4 line-clamp-3">{article.excerpt}</p>
      <Link 
        to={`/blog/${article.id}`}
        className="text-yellow-600 font-semibold hover:text-yellow-700 inline-flex items-center transition-colors"
        aria-label={`Lire "${article.title}"`}
      >
        Lire la suite →
      </Link>
    </div>
  </article>
);

const BlogList: React.FC = () => (
  <div className="pt-20">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-3xl sm:text-4xl font-bold mb-4">Blog</h1>
      <p className="text-gray-600 mb-8 sm:mb-12">
        Actualités, conseils et tendances du monde automobile
      </p>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {articles.map(article => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>
    </div>
  </div>
);

const BlogPost: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const article = articles.find(a => a.id === Number(id));

  if (!article) {
    return (
      <div className="pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 text-center">
          <h1 className="text-3xl font-bold mb-4">Article non trouvé</h1>
          <Link 
            to="/blog" 
            className="text-yellow-600 hover:text-yellow-700 inline-flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux articles
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <Link 
          to="/blog"
          className="inline-flex items-center text-yellow-600 hover:text-yellow-700 mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour aux articles
        </Link>
        
        <article className="prose prose-lg max-w-none">
          <img
            src={article.image}
            alt={article.title}
            className="w-full h-auto max-h-96 object-cover rounded-lg mb-8"
            loading="lazy"
          />
          <div className="flex items-center text-gray-500 text-sm mb-4">
            <Calendar className="h-4 w-4 mr-2" />
            {new Date(article.date).toLocaleDateString('fr-FR')}
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-6">{article.title}</h1>
          {article.content.split('\n').map((paragraph, index) => (
            <p key={index} className="text-gray-600 mb-4">
              {paragraph.trim()}
            </p>
          ))}
        </article>
      </div>
    </div>
  );
};

const Blog: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  return id ? <BlogPost /> : <BlogList />;
};

export default Blog;