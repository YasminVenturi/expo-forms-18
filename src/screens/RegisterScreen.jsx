import React, { useState, useEffect } from "react";
import { View, Alert, ActivityIndicator, Image, TouchableOpacity } from "react-native";
import { Button, Surface, Text, TextInput, Checkbox } from "react-native-paper";
import * as ImagePicker from "expo-image-picker";
import { StyleSheet } from "react-native";
import { auth, db, storage } from "../config/firebase";
import { createUserWithEmailAndPassword, updateProfile, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { FontAwesome } from "react-native-vector-icons";

export default function RegisterScreen({ navigation }) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [repetirSenha, setRepetirSenha] = useState("");
  const [escola, setEscola] = useState("");
  const [termosAceitos, setTermosAceitos] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permissão necessária", "Precisamos de acesso à sua galeria para escolher uma imagem.");
      }
    })();
  }, []);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  async function handleGoogleLogin() {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      navigation.navigate("HomeScreen");
    } catch (error) {
      Alert.alert("Erro de Login com Google", "Não foi possível logar.");
    }
  }

  const handleRegister = async () => {
    if (!termosAceitos) {
      Alert.alert("Erro", "Você deve aceitar os Termos & Serviços.");
      return;
    }
    if (senha !== repetirSenha) {
      Alert.alert("Erro", "As senhas não coincidem.");
      return;
    }
    if (!nome || !email || !senha || !escola) {
      Alert.alert("Erro", "Todos os campos devem ser preenchidos.");
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
      const user = userCredential.user;

      let photoURL = null;

      // Upload da imagem para Firebase Storage
      if (profileImage) {
        const response = await fetch(profileImage);
        const blob = await response.blob();
        const storageRef = ref(storage, `profileImages/${user.uid}`);
        await uploadBytes(storageRef, blob);
        photoURL = await getDownloadURL(storageRef);
      }

      // Atualizar o perfil do usuário no Firebase Authentication
      await updateProfile(user, {
        displayName: nome,
        photoURL: photoURL,
      });

      // Salvar dados no Firestore
      await setDoc(doc(db, "usuarios", user.uid), {
        nome,
        email,
        escola,
        termosAceitos,
        profileImage: photoURL,
        createdAt: new Date(),
      });

      setLoading(false);
      Alert.alert("Sucesso", "Registro realizado com sucesso!");
      navigation.navigate("HomeScreen");
    } catch (error) {
      setLoading(false);
      Alert.alert("Erro", error.message);
    }
  };

  return (
    <Surface style={styles.container}>
      {loading && <ActivityIndicator size="large" color="#A767C6" />}
      <View style={styles.innerContainer}>
        <Text style={styles.title}>Cadastrar</Text>

        <TextInput placeholder="Name" value={nome} onChangeText={setNome} style={styles.input} />
        <TextInput placeholder="Email" value={email} onChangeText={setEmail} style={styles.input} />
        <TextInput
          placeholder="Password"
          value={senha}
          onChangeText={setSenha}
          secureTextEntry
          style={styles.input}
        />
        <TextInput
          placeholder="Repeat Password"
          value={repetirSenha}
          onChangeText={setRepetirSenha}
          secureTextEntry
          style={styles.input}
        />
        <TextInput placeholder="School" value={escola} onChangeText={setEscola} style={styles.input} />

        <Button mode="contained" onPress={pickImage} style={styles.lightPurpleButton}>
          Escolher Imagem de Perfil
        </Button>

        {profileImage && (
          <View style={styles.imagePreviewContainer}>
            <Image source={{ uri: profileImage }} style={styles.imagePreview} />
          </View>
        )}

        <View style={styles.checkboxContainer}>
          <Checkbox
            status={termosAceitos ? "checked" : "unchecked"}
            onPress={() => setTermosAceitos(!termosAceitos)}
          />
          <Text style={styles.checkboxText}>
            Sim, eu concordo com{" "}
            <Text
              style={styles.linkText}
              onPress={() => navigation.navigate("TermsScreen")}
            >
             Termos e Serviços
            </Text>
          </Text>
        </View>

        <Button mode="contained" onPress={handleRegister} style={styles.button}>
          Cadastrar
        </Button>

        <Text style={styles.socialText}>Ou cadastrar com</Text>

        <View style={styles.socialContainer}>
        <TouchableOpacity style={styles.socialButton} onPress={handleGoogleLogin}>
  <FontAwesome name="google" size={24} color="#A767C6" />
</TouchableOpacity>

        </View>
      </View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  innerContainer: {
    flex: 1,
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#A767C6",
    textAlign: "center",
    marginBottom: 20,
  },
  input: {
    marginBottom: 15,
    backgroundColor: "white",
  },
  button: {
    marginTop: 10,
    marginBottom: 20,
    backgroundColor: "#A767C6",
  },
  lightPurpleButton: {
    marginTop: 10,
    marginBottom: 20,
    backgroundColor: "#C59AE5",
  },
  linkText: {
    color: "#A767C6",
    textDecorationLine: "underline",
  },
  checkboxText: {
    marginLeft: 10,
    color: "#A767C6",
  },
  socialText: {
    textAlign: "center",
    marginVertical: 15,
    fontSize: 16,
    color: "#555",
  },
  socialContainer: {
    flexDirection: "row",
    justifyContent: "center",
  },
  socialButton: {
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 50,
  },
  imagePreviewContainer: {
    alignSelf: "center",
    width: 150,
    height: 150,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#A767C6",
    marginTop: 10,
    overflow: "hidden",
    backgroundColor: "#f0f0f0",
  },
  imagePreview: {
    width: "100%",
    height: "100%",
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
});
