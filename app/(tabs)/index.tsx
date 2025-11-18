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
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { createMMKV } from 'react-native-mmkv';

const storage = createMMKV();
const PROFILE_STORAGE_KEY = 'user.profile';

type UserProfile = {
  uid: string;
  email: string | null;
};

interface ListHeaderProps {
  userEmail: string | null;
  onLogout: () => void;
  onAdd: (nama: string, nim: string, jurusan: string) => void;
}

const ListHeader: React.FC<ListHeaderProps> = ({ userEmail, onLogout, onAdd }) => {
  const [nama, setNama] = useState('');
  const [nim, setNim] = useState('');
  const [jurusan, setJurusan] = useState('');

  const handleAddPress = () => {
    if (nama.trim() === '' || nim.trim() === '' || jurusan.trim() === '') {
      Alert.alert('Error', 'Semua field data mahasiswa wajib diisi.');
      return;
    }
    onAdd(nama, nim, jurusan);
    setNama('');
    setNim('');
    setJurusan('');
  };

  return (
    <View style={styles.headerContainer}>
      <Text style={styles.welcomeText}>Selamat Datang, {userEmail}</Text>
      <Button title="Logout" onPress={onLogout} color="red" />
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
  // =================================================================
  // BAGIAN 1: SEMUA HOOKS (useState, useEffect, etc.)
  // =================================================================
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [mmkvProfile, setMmkvProfile] = useState<UserProfile | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mahasiswaList, setMahasiswaList] = useState<any[]>([]);

  useEffect(() => {
    const subscriber = auth().onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const profileString = storage.getString(PROFILE_STORAGE_KEY);
        if (profileString) {
          setMmkvProfile(JSON.parse(profileString));
        }
      } else {
        storage.remove(PROFILE_STORAGE_KEY);
        setMmkvProfile(null);
      }
      if (initializing) {
        setInitializing(false);
      }
    });
    return subscriber;
  }, [initializing]);

  useEffect(() => {
    if (user) {
      const subscriber = firestore()
        .collection('mahasiswa')
        .onSnapshot(
          (querySnapshot) => {
            const list: any[] = [];
            querySnapshot.forEach((doc) => {
              list.push({ id: doc.id, ...doc.data() });
            });
            setMahasiswaList(list);
          },
          (error) => {
            console.error("Error fetching data: ", error);
            Alert.alert("Error", "Gagal mengambil data dari Firestore.");
          }
        );
      return () => subscriber();
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
      const userCredential = await auth().createUserWithEmailAndPassword(email, password);
      const userProfile: UserProfile = {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
      };
      storage.set(PROFILE_STORAGE_KEY, JSON.stringify(userProfile));
      setMmkvProfile(userProfile);
      Alert.alert('Sukses', 'Akun berhasil dibuat & profil disimpan.');
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
      const userCredential = await auth().signInWithEmailAndPassword(email, password);
      const userProfile: UserProfile = {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
      };
      storage.set(PROFILE_STORAGE_KEY, JSON.stringify(userProfile));
      setMmkvProfile(userProfile);
      setEmail('');
      setPassword('');
    } catch (error: any) {
      Alert.alert('Error Login', error.message);
    }
  };

  const handleLogout = useCallback(async () => {
    try {
      await auth().signOut();
      storage.remove(PROFILE_STORAGE_KEY);
      setMmkvProfile(null);
      Alert.alert('Sukses', 'Logout berhasil.');
    } catch (error: any) {
      Alert.alert('Error Logout', error.message);
    }
  }, []);

  const handleAddMahasiswa = useCallback(
    async (nama: string, nim: string, jurusan: string) => {
      try {
        await firestore().collection('mahasiswa').add({
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

  const memoizedListHeader = useMemo(() => {
    return (
      <ListHeader
        userEmail={user?.email || mmkvProfile?.email || '...'}
        onLogout={handleLogout}
        onAdd={handleAddMahasiswa}
      />
    );
  }, [user, mmkvProfile, handleLogout, handleAddMahasiswa]);

  // =================================================================
  // BAGIAN 2: LOGIKA TAMPILAN (return) BERDASARKAN KONDISI
  // =================================================================

  if (initializing) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
        <Text style={{ textAlign: 'center', marginTop: 10 }}>Memeriksa status login...</Text>
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