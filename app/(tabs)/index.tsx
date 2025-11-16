import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  FlatList,
  Alert,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// --- IMPORT FIREBASE ---
import { initializeApp, getApp, getApps } from 'firebase/app';
import {
  initializeAuth,
  getReactNativePersistence,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  query,
} from 'firebase/firestore';

// --- IMPORT MMKV (Sintaks V4/V3) ---
import { createMMKV } from 'react-native-mmkv';
export const storage = createMMKV();

// -----------------------------------------------------------------
// --- KONFIGURASI FIREBASE ---
// -----------------------------------------------------------------
const firebaseConfig = {
  apiKey: "AIzaSyAuo809_Nsf9RyxtBVmkaq5gbkKDHCAb9k",
  authDomain: "mahasiswaapp-e791f.firebaseapp.com",
  projectId: "mahasiswaapp-e791f",
  storageBucket: "mahasiswaapp-e791f.firebasestorage.app",
  messagingSenderId: "61296272751",
  appId: "1:61296272751:web:85eecd85ff0ce9d858f49a",
  measurementId: "G-LT3NX05HE8"
};

let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

// --- Adapter MMKV untuk Firebase Auth ---
const mmkvStorageAdapter = {
  setItem: (key: string, value: string) => {
    storage.set(key, value);
    return Promise.resolve();
  },
  getItem: (key: string) => {
    const value = storage.getString(key);
    return Promise.resolve(value !== undefined ? value : null);
  },
  removeItem: (key: string) => {
    storage.delete(key);
    return Promise.resolve();
  },
};

// Inisialisasi Auth dengan ADAPTER MMKV
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(mmkvStorageAdapter),
});
const db = getFirestore(app);

// -----------------------------------------------------------------
// --- Komponen ListHeader (Untuk fix re-render input) ---
// -----------------------------------------------------------------
interface ListHeaderProps {
  userEmail: string | null;
  onLogout: () => void;
  onAdd: (nama: string, nim: string, jurusan: string) => void;
}

// Ini adalah komponen terpisah yang mengelola state form-nya sendiri
const ListHeader: React.FC<ListHeaderProps> = ({ userEmail, onLogout, onAdd }) => {
  const [nama, setNama] = useState('');
  const [nim, setNim] = useState('');
  const [jurusan, setJurusan] = useState('');

  const handleAddPress = () => {
    onAdd(nama, nim, jurusan);
    setNama('');
    setNim('');
    setJurusan('');
  };

  return (
    <View style={styles.headerContainer}>
      <Text style={styles.welcomeText}>Selamat Datang, {userEmail}</Text>
      <Button title="Logout" onPress={onLogout} color="red" />

      {/* --- Form Tambah Data --- */}
      <View style={styles.formContainer}>
        <Text style={styles.subtitle}>Tambah Data Mahasiswa</Text>
        <TextInput
          style={styles.input}
          placeholder="Nama Lengkap"
          value={nama}
          onChangeText={setNama}
        />
        <TextInput
          style={styles.input}
          placeholder="NIM"
          value={nim}
          onChangeText={setNim}
          keyboardType="numeric"
        />
        <TextInput
          style={styles.input}
          placeholder="Jurusan"
          value={jurusan}
          onChangeText={setJurusan}
        />
        <Button title="Simpan Data" onPress={handleAddPress} />
      </View>

      <Text style={styles.subtitle}>Daftar Mahasiswa</Text>
    </View>
  );
};

// -----------------------------------------------------------------
// --- KOMPONEN UTAMA ---
// -----------------------------------------------------------------
export default function AppScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mahasiswaList, setMahasiswaList] = useState<any[]>([]);

  // --- LOGIC ---

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      const q = query(collection(db, 'mahasiswa'));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const list: any[] = [];
          snapshot.forEach((doc) => {
            list.push({ id: doc.id, ...doc.data() });
          });
          setMahasiswaList(list);
        },
        (error) => {
          console.error("Error fetching data: ", error);
          Alert.alert("Error", "Gagal mengambil data dari Firestore.");
        }
      );
      return () => unsubscribe();
    } else {
      setMahasiswaList([]);
    }
  }, [user]);

  const handleRegister = async () => {
    if (email === '' || password === '') {
      Alert.alert('Error', 'Email dan Password tidak boleh kosong.');
      return;
    }
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      Alert.alert('Sukses', 'Akun berhasil dibuat & otomatis login.');
    } catch (error: any) {
      Alert.alert('Error Registrasi', error.message);
    }
  };

  const handleLogin = async () => {
    if (email === '' || password === '') {
      Alert.alert('Error', 'Email dan Password tidak boleh kosong.');
      return;
    }
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      Alert.alert('Error Login', error.message);
    }
  };

  const handleLogout = useCallback(async () => {
    try {
      await signOut(auth);
    } catch (error: any) {
      Alert.alert('Error Logout', error.message);
    }
  }, []);

  const handleAddMahasiswa = useCallback(
    async (nama: string, nim: string, jurusan: string) => {
      if (nama === '' || nim === '' || jurusan === '') {
        Alert.alert('Error', 'Semua field data mahasiswa wajib diisi.');
        return;
      }
      try {
        await addDoc(collection(db, 'mahasiswa'), {
          nama: nama,
          nim: nim,
          jurusan: jurusan,
        });
        Alert.alert('Sukses', 'Data mahasiswa berhasil ditambahkan.');
      } catch (error: any) {
        console.error("Error adding document: ", error);
        Alert.alert('Error', 'Gagal menyimpan data.');
      }
    },
    []
  );

  // --- RENDER TAMPILAN ---

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1, justifyContent: 'center' }}
        >
          <ScrollView contentContainerStyle={styles.authContainer}>
            <Text style={styles.title}>Login / Register</Text>
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <TextInput
              style={styles.input}
              placeholder="Password (min. 6 karakter)"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            <View style={styles.buttonContainer}>
              <Button title="Login" onPress={handleLogin} />
              <Button title="Register" onPress={handleRegister} color="#841584" />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  const memoizedListHeader = useMemo(() => {
    return (
      <ListHeader
        userEmail={user ? user.email : ''}
        onLogout={handleLogout}
        onAdd={handleAddMahasiswa}
      />
    );
  }, [user, handleLogout, handleAddMahasiswa]);

  return (
    <SafeAreaView style={styles.mainAppSafeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <FlatList
          data={mahasiswaList}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.itemContainer}>
              <Text style={styles.itemNama}>{item.nama}</Text>
              <Text>{item.nim} - {item.jurusan}</Text>
            </View>
          )}
          ListHeaderComponent={memoizedListHeader}
          ListEmptyComponent={<Text style={{ paddingHorizontal: 16 }}>Belum ada data mahasiswa.</Text>}
          ListFooterComponent={<View style={{ height: 30 }} />}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// --- STYLESHEET ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  mainAppSafeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  authContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  welcomeText: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  input: {
    width: '100%',
    height: 44,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 12,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 10,
  },
  formContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  itemContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
    marginBottom: 10,
    marginHorizontal: 16,
  },
  itemNama: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});