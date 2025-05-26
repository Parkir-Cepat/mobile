import { useState, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  StatusBar,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function RegisterScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [amount, setAmount] = useState("");
  const [role, setRole] = useState("seeker");
  const [showPassword, setShowPassword] = useState(false);

  const scrollViewRef = useRef(null);
  const inputRefs = {
    name: useRef(null),
    email: useRef(null),
    password: useRef(null),
    amount: useRef(null),
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F7FA" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 20}
        enabled
      >
        <ScrollView
          ref={scrollViewRef}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.logoContainer}>
            <Image
              source={require("../assets/favicon.png")}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.appName}>Parkirin</Text>
          </View>

          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>
            Register to start your journey with us
          </Text>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <View style={styles.inputWrapper}>
              <Ionicons
                name="person-outline"
                size={22}
                color="#4B5EAA"
                style={styles.inputIcon}
              />
              <TextInput
                ref={inputRefs.name}
                style={styles.input}
                placeholder="Enter your full name"
                value={name}
                onChangeText={setName}
                placeholderTextColor="#8A94A6"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Email Address</Text>
            <View style={styles.inputWrapper}>
              <Ionicons
                name="mail-outline"
                size={22}
                color="#4B5EAA"
                style={styles.inputIcon}
              />
              <TextInput
                ref={inputRefs.email}
                style={styles.input}
                placeholder="Enter your email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#8A94A6"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Password</Text>
            <View style={styles.inputWrapper}>
              <Ionicons
                name="lock-closed-outline"
                size={22}
                color="#4B5EAA"
                style={styles.inputIcon}
              />
              <TextInput
                ref={inputRefs.password}
                style={styles.input}
                placeholder="Create a password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                placeholderTextColor="#8A94A6"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                <Ionicons
                  name={showPassword ? "eye-outline" : "eye-off-outline"}
                  size={22}
                  color="#4B5EAA"
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Initial Amount (Rp)</Text>
            <View style={styles.inputWrapper}>
              <Ionicons
                name="wallet-outline"
                size={22}
                color="#4B5EAA"
                style={styles.inputIcon}
              />
              <TextInput
                ref={inputRefs.amount}
                style={styles.input}
                placeholder="Enter initial amount"
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                placeholderTextColor="#8A94A6"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Select Your Role</Text>
            <View style={styles.roleContainer}>
              <TouchableOpacity
                style={[
                  styles.roleOption,
                  role === "seeker" && styles.roleOptionSelected,
                ]}
                onPress={() => setRole("seeker")}
              >
                <View style={styles.radioButton}>
                  {role === "seeker" && (
                    <View style={styles.radioButtonSelected} />
                  )}
                </View>
                <View style={styles.roleTextContainer}>
                  <Text style={styles.roleTitle}>Seeker</Text>
                  <Text style={styles.roleDescription}>
                    Looking for parking spaces
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.roleOption,
                  role === "owner" && styles.roleOptionSelected,
                ]}
                onPress={() => setRole("owner")}
              >
                <View style={styles.radioButton}>
                  {role === "owner" && (
                    <View style={styles.radioButtonSelected} />
                  )}
                </View>
                <View style={styles.roleTextContainer}>
                  <Text style={styles.roleTitle}>Owner</Text>
                  <Text style={styles.roleDescription}>
                    Managing parking lots
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={styles.registerButton}>
            <Text style={styles.registerButtonText}>Register</Text>
          </TouchableOpacity>

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account?</Text>
            <TouchableOpacity>
              <Text style={styles.loginLink}> Log In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA", // Latar lembut untuk kesan premium
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 25,
    paddingTop: 50,
    paddingBottom: 100, // Padding tambahan agar konten tidak tertutup keyboard
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 40,
    justifyContent: "center",
  },
  logo: {
    width: 50,
    height: 50,
  },
  appName: {
    fontSize: 28,
    fontWeight: "700",
    marginLeft: 12,
    color: "#1E3A8A", // Biru tua premium
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#1E3A8A",
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    marginBottom: 30,
    textAlign: "center",
    fontWeight: "400",
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1E3A8A",
    marginBottom: 10,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 56,
    color: "#1E3A8A",
    fontSize: 16,
    fontWeight: "500",
  },
  eyeIcon: {
    padding: 10,
  },
  roleContainer: {
    marginTop: 10,
  },
  roleOption: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 3,
  },
  roleOptionSelected: {
    borderWidth: 1.5,
    borderColor: "#D4A017", // Aksen emas untuk premium
    backgroundColor: "#F8FAFC",
  },
  radioButton: {
    height: 22,
    width: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#1E3A8A",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  radioButtonSelected: {
    height: 12,
    width: 12,
    borderRadius: 6,
    backgroundColor: "#D4A017",
  },
  roleTextContainer: {
    flex: 1,
  },
  roleTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#1E3A8A",
    marginBottom: 4,
  },
  roleDescription: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "400",
  },
  registerButton: {
    backgroundColor: "#1E3A8A", // Warna solid biru tua
    borderRadius: 16,
    height: 60,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  registerButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 30,
    marginBottom: 20,
  },
  loginText: {
    color: "#6B7280",
    fontSize: 16,
    fontWeight: "400",
  },
  loginLink: {
    color: "#D4A017",
    fontWeight: "600",
    fontSize: 16,
  },
});
