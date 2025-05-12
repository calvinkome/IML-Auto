import React, { useState, useEffect } from 'react';
import { User, Settings, Clock, FileText, Bell, CreditCard, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/Button';

const tabs = [
  { id: 'profile', label: 'Profil', icon: User },
  { id: 'reservations', label: 'Réservations', icon: Clock },
  { id: 'payments', label: 'Paiements', icon: CreditCard },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'settings', label: 'Paramètres', icon: Settings },
];

export default function Profile() {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedUsername, setEditedUsername] = useState(user?.username || '');
  const [editedEmail, setEditedEmail] = useState(user?.email || '');
  const [notifications, setNotifications] = useState({ email: false, sms: false });
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setDataLoading(false);
    };

    fetchData();
  }, []);

  const handleSignOut = async () => {
    try {
      setLoading(true);
      await signOut();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    // Call API to update user details
    console.log('Updated username:', editedUsername);
    console.log('Updated email:', editedEmail);
    setIsEditing(false);
  };

  const handleNotificationChange = (type: string, value: boolean) => {
    setNotifications((prev) => ({ ...prev, [type]: value }));
    // Call API to save preferences
    console.log(`${type} notifications updated to ${value}`);
  };

  return (
    <div className="pt-20 min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <div className="w-full md:w-64 space-y-4">
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <div className="w-20 h-20 rounded-full bg-yellow-400 flex items-center justify-center text-black text-3xl font-bold mx-auto mb-4">
                {user?.username[0].toUpperCase()}
              </div>
              <h2 className="text-xl font-semibold">{user?.username}</h2>
              <p className="text-gray-500 text-sm">{user?.email}</p>
            </div>

            <nav className="bg-white rounded-lg shadow">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-2 px-4 py-3 transition-colors ${
                    activeTab === tab.id
                      ? 'text-yellow-600 bg-yellow-50'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <tab.icon className="h-5 w-5" />
                  <span>{tab.label}</span>
                </button>
              ))}
              <Button
                variant="ghost"
                className="w-full justify-start px-4 py-3 text-red-600 hover:bg-red-50"
                icon={<LogOut className="h-5 w-5" />}
                onClick={handleSignOut}
                loading={loading}
              >
                Déconnexion
              </Button>
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="bg-white rounded-lg shadow p-6">
              {dataLoading ? (
                <p>Chargement...</p>
              ) : activeTab === 'profile' ? (
                <div className="space-y-6">
                  <h2 className="text-2xl font-semibold">Informations personnelles</h2>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nom d'utilisateur
                      </label>
                      <input
                        type="text"
                        value={editedUsername}
                        onChange={(e) => setEditedUsername(e.target.value)}
                        readOnly={!isEditing}
                        className={`w-full px-4 py-2 border rounded-md ${
                          isEditing ? 'bg-white' : 'bg-gray-50'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={editedEmail}
                        onChange={(e) => setEditedEmail(e.target.value)}
                        readOnly={!isEditing}
                        className={`w-full px-4 py-2 border rounded-md ${
                          isEditing ? 'bg-white' : 'bg-gray-50'
                        }`}
                      />
                    </div>
                  </div>
                  <div className="flex space-x-4">
                    {isEditing ? (
                      <>
                        <Button variant="primary" onClick={handleSave}>
                          Enregistrer
                        </Button>
                        <Button variant="secondary" onClick={() => setIsEditing(false)}>
                          Annuler
                        </Button>
                      </>
                    ) : (
                      <Button variant="primary" onClick={() => setIsEditing(true)}>
                        Modifier
                      </Button>
                    )}
                  </div>
                </div>
              ) : activeTab === 'reservations' ? (
                <div>
                  <h2 className="text-2xl font-semibold mb-6">Mes réservations</h2>
                  <div className="text-center text-gray-500 py-8">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>Aucune réservation pour le moment</p>
                    <Button variant="primary" className="mt-4">
                      Faire une réservation
                    </Button>
                  </div>
                </div>
              ) : activeTab === 'payments' ? (
                <div>
                  <h2 className="text-2xl font-semibold mb-6">Historique des paiements</h2>
                  <div className="text-center text-gray-500 py-8">
                    <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>Aucun paiement enregistré</p>
                  </div>
                </div>
              ) : activeTab === 'notifications' ? (
                <div>
                  <h2 className="text-2xl font-semibold mb-6">Centre de notifications</h2>
                  <div className="space-y-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={notifications.email}
                        onChange={(e) => handleNotificationChange('email', e.target.checked)}
                        className="h-4 w-4 text-yellow-600 focus:ring-yellow-500"
                      />
                      <span className="ml-2">Notifications par email</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={notifications.sms}
                        onChange={(e) => handleNotificationChange('sms', e.target.checked)}
                        className="h-4 w-4 text-yellow-600 focus:ring-yellow-500"
                      />
                      <span className="ml-2">Notifications SMS</span>
                    </label>
                  </div>
                </div>
              ) : (
                <div>
                  <h2 className="text-2xl font-semibold mb-6">Paramètres du compte</h2>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-4">Préférences de notification</h3>
                      <div className="space-y-4">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={notifications.email}
                            onChange={(e) => handleNotificationChange('email', e.target.checked)}
                            className="h-4 w-4 text-yellow-600 focus:ring-yellow-500"
                          />
                          <span className="ml-2">Notifications par email</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={notifications.sms}
                            onChange={(e) => handleNotificationChange('sms', e.target.checked)}
                            className="h-4 w-4 text-yellow-600 focus:ring-yellow-500"
                          />
                          <span className="ml-2">Notifications SMS</span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium mb-4">Sécurité</h3>
                      <div className="space-y-4">
                        <Button variant="secondary">Changer le mot de passe</Button>
                        <Button variant="secondary">Activer l'authentification à deux facteurs</Button>
                        <Button variant="secondary">Voir l'historique des connexions</Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}