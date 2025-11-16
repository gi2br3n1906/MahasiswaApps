import React, { useState, useEffect, useCallback, useMemo } from 'react'; // TAMBAH: useCallback dan useMemo
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  // HAPUS: SafeAreaView dari sini
  FlatList,
  Alert,
  Platform,
  KeyboardAvoidingView,
  ScrollView, // Kita butuh ini untuk layar login
} from 'react-native';
// TAMBAH: Impor SafeAreaView dari library yang benar
import { SafeAreaView } from 'react-native-safe-area-context';

// --- IMPORT FIREBASE ---
import { initializeApp, getApp, getApps } from 'firebase/app';
import {
  initializeAuth, // Ganti dari getAuth
  getReactNativePersistence, // Untuk menyimpan login
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

// TAMBAH: Impor AsyncStorage
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

// --- IMPORT MMKV (Sintaks V4/V3) ---
import { createMMKV } from 'react-native-mmkv';
export const storage = createMMKV(); // Pakai createMMKV()

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

// UBAH: Inisialisasi Auth dengan AsyncStorage agar login tersimpan
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});
const db = getFirestore(app);

// -----------------------------------------------------------------
// --- PINDAH: Buat Komponen Header DI LUAR AppScreen ---
// -----------------------------------------------------------------

interface ListHeaderProps {
  userEmail: string | null;
  onLogout: () => void;
  onAdd: (nama: string, nim: string, jurusan: string) => void;
}

// Ini adalah komponen terpisah yang mengelola state form-nya sendiri
const ListHeader: React.FC<ListHeaderProps> = ({ userEmail, onLogout, onAdd }) => {
  // PINDAH STATE FORM KE SINI
  const [nama, setNama] = useState('');
  const [nim, setNim] = useState('');
  const [jurusan, setJurusan] = useState('');

  // Buat fungsi helper untuk handle press
  const handleAddPress = () => {
    // Panggil fungsi onAdd (dari AppScreen) dengan data dari state internal ini
    onAdd(nama, nim, jurusan);

    // Kosongkan form setelah submit
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
          value={nama} // Baca dari state internal
          onChangeText={setNama} // Tulis ke state internal
        />
        <TextInput
          style={styles.input}
          placeholder="NIM"
          value={nim} // Baca dari state internal
          onChangeText={setNim} // Tulis ke state internal
          keyboardType="numeric"
        />
        <TextInput
          style={styles.input}
          placeholder="Jurusan"
          value={jurusan} // Baca dari state internal
          onChangeText={setJurusan} // Tulis ke state internal
        />
        {/* Panggil helper internal */}
        <Button title="Simpan Data" onPress={handleAddPress} />
      </View>

      {/* --- Judul Daftar Mahasiswa --- */}
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
  // HAPUS STATE FORM DARI SINI
  // const [nama, setNama] = useState('');
  // const [nim, setNim] = useState('');
  // const [jurusan, setJurusan] = useState('');

  // --- LOGIC ---

  // Cek status login
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Ambil data jika sudah login
  useEffect(() => {
    if (user) {
      const q = query(collection(db, 'mahasiswa'));
      // onSnapshot = Realtime listener
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
      return () => unsubscribe(); // Berhenti listen saat unmount
    } else {
      setMahasiswaList([]); // Kosongkan list jika logout
    }
  }, [user]); // Dijalankan ulang jika 'user' berubah

  // Fungsi Register (Tidak berubah)
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

  // Fungsi Login (Tidak berubah)
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

  // Fungsi Logout (Bungkus dengan useCallback agar stabil)
  const handleLogout = useCallback(async () => {
    try {
      await signOut(auth);
    } catch (error: any) {
      Alert.alert('Error Logout', error.message);
    }
  }, []); // Dependency kosong, fungsi ini tidak akan pernah dibuat ulang

  // Fungsi Tambah Data (UBAH: Terima parameter dari ListHeader)
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
        // HAPUS: Pengosongan form pindah ke ListHeader
        // setNama('');
        // setNim('');
        // setJurusan('');
        Alert.alert('Sukses', 'Data mahasiswa berhasil ditambahkan.');
      } catch (error: any) {
        console.error("Error adding document: ", error);
        Alert.alert('Error', 'Gagal menyimpan data.');
      }
    },
    []
  ); // Dependency kosong, fungsi ini tidak akan pernah dibuat ulang

  // --- RENDER TAMPILAN ---

  // 1. Tampilan Loading... (Tidak berubah)
      <View style={styles.container}>
  // 2. Tampilan Jika BELUM Login (Tidak berubah)
      </View>
  // HAPUS: Definisi const ListHeader = () => (...) dari sini

  // TAMBAH: Gunakan useMemo untuk membuat ListHeader agar tidak render ulang
  // jika tidak perlu
  const memoizedListHeader = useMemo(() => {
    return (
      <ListHeader
        userEmail={user ? user.email : ''}
        onLogout={handleLogout}
        onAdd={handleAddMahasiswa}
      />
    );
  }, [user, handleLogout, handleAddMahasiswa]); // Hanya buat ulang jika user berubah

  // 3. Tampilan Jika SUDAH Login (Aplikasi Utama)
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
          // Masukkan form, dll, sebagai Header
          ListHeaderComponent={memoizedListHeader} // Gunakan versi memoized
          // Teks jika list kosong
          ListEmptyComponent={<Text style={{ paddingHorizontal: 16 }}>Belum ada data mahasiswa.</Text>}
          // Padding di bawah list
          ListFooterComponent={<View style={{ height: 30 }} />}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// --- STYLESHEET --- (Tidak ada perubahan)
const styles = StyleSheet.create({
  // Style untuk loading dan login
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  // Style untuk SafeAreaView di halaman utama
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
  // Style untuk header list
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