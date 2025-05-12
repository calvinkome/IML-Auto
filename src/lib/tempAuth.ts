// Temporary in-memory storage
interface TempUser {
  id: string;
  username: string;
  email: string;
  password: string; // In real app, this would be hashed
  createdAt: Date;
}

interface Session {
  userId: string;
  createdAt: Date;
  expiresAt: Date;
}

class TempAuthStore {
  private users: TempUser[] = [];
  private sessions: Map<string, Session> = new Map();

  generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  validateUsername(username: string): boolean {
    return username.length >= 3 && /^[a-zA-Z0-9_]+$/.test(username);
  }

  validateEmail(email: string): boolean {
    return /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email);
  }

  validatePassword(password: string): boolean {
    return password.length >= 8 &&
           /[A-Z]/.test(password) && // At least one uppercase
           /[a-z]/.test(password) && // At least one lowercase
           /[0-9]/.test(password);   // At least one number
  }

  async register(username: string, email: string, password: string): Promise<TempUser> {
    // Validate inputs
    const normalizedEmail = email.toLowerCase().trim();
    const normalizedUsername = username.trim();

    if (!normalizedUsername) {
      throw new Error('Le nom d\'utilisateur est requis');
    }

    if (!this.validateUsername(username)) {
      throw new Error('Le nom d\'utilisateur doit contenir au moins 3 caractères et uniquement des lettres, chiffres et underscores');
    }

    if (!normalizedEmail) {
      throw new Error('L\'adresse email est requise');
    }

    if (!this.validateEmail(normalizedEmail)) {
      throw new Error('Format d\'email invalide');
    }

    if (!password) {
      throw new Error('Le mot de passe est requis');
    }

    if (!this.validatePassword(password)) {
      throw new Error('Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre');
    }

    // Check for existing users
    if (this.users.some(u => u.username.toLowerCase() === normalizedUsername.toLowerCase())) {
      throw new Error('Ce nom d\'utilisateur est déjà pris');
    }
    if (this.users.some(u => u.email.toLowerCase() === normalizedEmail)) {
      throw new Error('Un compte existe déjà avec cette adresse email');
    }

    // Create new user
    const newUser: TempUser = {
      id: this.generateId(),
      username: normalizedUsername,
      email: normalizedEmail,
      password, // In real app, would be hashed
      createdAt: new Date()
    };

    this.users.push(newUser);
    return newUser;
  }

  async login(identifier: string, password: string): Promise<{ user: TempUser; sessionId: string }> {
    // Validate inputs
    if (!identifier || !password) {
      throw new Error('Veuillez remplir tous les champs');
    }

    const normalizedIdentifier = identifier.toLowerCase().trim();

    // Find user by email or username
    const user = this.users.find(
      u => u.email.toLowerCase() === normalizedIdentifier || 
           u.username.toLowerCase() === normalizedIdentifier
    );

    // Combined check for better security
    if (!user || user.password !== password) {
      throw new Error('Email/nom d\'utilisateur ou mot de passe incorrect');
    }

    // Create session
    const sessionId = this.generateId();
    const session: Session = {
      userId: user.id,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    };

    this.sessions.set(sessionId, session);
    
    // Return user without password
    const { password: _, ...safeUser } = user;
    return { user: safeUser as TempUser, sessionId };
  }

  async logout(sessionId: string): Promise<void> {
    this.sessions.delete(sessionId);
  }

  async validateSession(sessionId: string): Promise<TempUser | null> {
    const session = this.sessions.get(sessionId);
    if (!session || session.expiresAt < new Date()) {
      this.sessions.delete(sessionId);
      return null;
    }

    return this.users.find(u => u.id === session.userId) || null;
  }

  async getCurrentUser(sessionId: string): Promise<TempUser | null> {
    return this.validateSession(sessionId);
  }
}

export const tempAuth = new TempAuthStore();