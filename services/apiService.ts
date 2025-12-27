
import { User, Obra, Funcionario, Ponto, TransacaoFinanceira, Material, Ferramenta, DiarioObra, Servico, UserRole } from '../types';
import { auth, db } from './firebase';
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged 
} from 'firebase/auth';
import { 
    collection, 
    getDocs, 
    addDoc, 
    doc, 
    updateDoc, 
    deleteDoc,
    query,
    where,
    getDoc,
    setDoc
} from 'firebase/firestore';
import { initialUsers } from './dataService'; // Keep for seeding

// --- Helper para mapear dados do Firestore ---
const mapFirestoreDoc = <T>(doc: any): T => {
    const data = doc.data();
    return { id: doc.id, ...data } as T;
};

// --- Generic CRUD Factory for Firestore ---
const createCrudService = <T extends { id: string }>(collectionName: string) => {
    const collRef = collection(db, collectionName);

    return {
        async getAll(): Promise<T[]> {
            const snapshot = await getDocs(collRef);
            return snapshot.docs.map(doc => mapFirestoreDoc<T>(doc));
        },
        async create(itemData: Omit<T, 'id'>): Promise<T> {
            const docRef = await addDoc(collRef, itemData);
            return { id: docRef.id, ...itemData } as T;
        },
        async update(itemId: string, updates: Partial<T>): Promise<T> {
            const docRef = doc(db, collectionName, itemId);
            await updateDoc(docRef, updates);
            const updatedDoc = await getDoc(docRef);
            return mapFirestoreDoc<T>(updatedDoc);
        },
        async delete(itemId: string): Promise<void> {
            const docRef = doc(db, collectionName, itemId);
            await deleteDoc(docRef);
        },
        async replaceAll(newItems: T[]): Promise<void> {
            // This is complex with Firestore, usually handled per-item.
            // For simplicity in this migration, we'll batch updates.
            const promises = newItems.map(item => {
                const docRef = doc(db, collectionName, item.id);
                return setDoc(docRef, item, { merge: true });
            });
            await Promise.all(promises);
        }
    };
};

// --- API Service with Firebase ---
export const apiService = {
    // --- Auth ---
    async login(username: string, password: string): Promise<User | null> {
        // Firebase Auth usa email, então vamos simular `username@domain.com`
        // Para o admin, o login é especial e não usa senha no Firebase Auth.
        // O ideal é criar um usuário admin com email/senha no Firebase.
        // Por agora, manteremos a lógica de username, mas com um email falso.
        
        let email = `${username}@diariodeobra.app`;
        
        // Handle special admin case if needed, but Firebase standard is better
        if (username.toLowerCase() === 'admin') {
           // You should create an admin user in Firebase with a strong password
           // For this example, we assume you have an admin@diariodeobra.app user
           email = 'admin@diariodeobra.app';
           // Você precisará de uma senha para o admin no Firebase
           if (!password) password = "firebase_admin_password"; // Example password
        }

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const userQuery = query(collection(db, 'users'), where('username', '==', username));
            const querySnapshot = await getDocs(userQuery);
            if (!querySnapshot.empty) {
                const appUser = mapFirestoreDoc<User>(querySnapshot.docs[0]);
                return appUser;
            }
            return null; // User authenticated but not in our 'users' collection
        } catch (error) {
            console.error("Firebase login error:", error);
            return null;
        }
    },

    async logout(): Promise<void> {
        await signOut(auth);
    },

    checkSession(): Promise<User | null> {
        return new Promise((resolve) => {
            const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
                unsubscribe();
                if (firebaseUser && firebaseUser.email) {
                    const username = firebaseUser.email.split('@')[0];
                    const userQuery = query(collection(db, 'users'), where('username', '==', username));
                    const querySnapshot = await getDocs(userQuery);
                    if (!querySnapshot.empty) {
                        resolve(mapFirestoreDoc<User>(querySnapshot.docs[0]));
                    } else {
                        resolve(null);
                    }
                } else {
                    resolve(null);
                }
            });
        });
    },

    // --- Specific Services ---
    get users() {
        const baseService = createCrudService<User>('users');
        return {
            ...baseService,
            async create(userData: Omit<User, 'id'>): Promise<User> {
                // FIX: Added a check for the password, as it's now optional in the User type 
                // but required by Firebase Auth for user creation.
                if (!userData.password) {
                    throw new Error("A password is required to create a new user.");
                }
                // Create user in Firebase Auth
                const email = `${userData.username}@diariodeobra.app`;
                try {
                    const userCredential = await createUserWithEmailAndPassword(auth, email, userData.password);
                    // Now create the user in Firestore collection, omitting the password for security.
                    const { password, ...firestoreUserData } = userData;
                    const userDocRef = doc(db, 'users', userCredential.user.uid);
                    await setDoc(userDocRef, firestoreUserData);
                    
                    // FIX: The original error on this line is resolved because the User type in `types.ts` 
                    // now has an optional password, so this returned object matches the type.
                    return { id: userCredential.user.uid, ...firestoreUserData };
                } catch(error) {
                    console.error("Error creating user in Firebase:", error);
                    // Handle error, e.g., email already in use
                    throw error;
                }
            }
        };
    },
    get obras() { return createCrudService<Obra>('obras'); },
    get funcionarios() { return createCrudService<Funcionario>('funcionarios'); },
    get pontos() { return createCrudService<Ponto>('pontos'); },
    get transacoes() { return createCrudService<TransacaoFinanceira>('transacoes'); },
    get materiais() { return createCrudService<Material>('materiais'); },
    get ferramentas() { return createCrudService<Ferramenta>('ferramentas'); },
    get diarios() { return createCrudService<DiarioObra>('diarios'); },
    get servicos() { return createCrudService<Servico>('servicos'); },
};