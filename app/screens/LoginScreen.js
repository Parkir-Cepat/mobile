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
  Alert,
} from "react-native";
import { gql, useMutation } from "@apollo/client";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import * as SecureStore from "expo-secure-store";

const LOGIN_USER = gql`
  mutation Login($user: loginInput) {
    login(user: $user) {
      token
      user {
        _id
        email
        name
        role
        amount
      }
    }
  }
`;

const GOOGLE_LOGIN = gql`
  mutation LoginGoogle($input: googleLogin) {
    loginGoogle(input: $input) {
      token
      user {
        _id
        email
        name
        role
        amount
      }
    }
  }
`;

export default function LoginScreen() {
  const scrollViewRef = useRef();
  const navigation = useNavigation();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [loginUser] = useMutation(LOGIN_USER);
  const [loginGoogle] = useMutation(GOOGLE_LOGIN);
  const [input, setInput] = useState({
    email: "",
    password: "",
  });

  const handleChange = (value, key) => {
    setInput({
      ...input,
      [key]: value,
    });
    // Clear specific field error when user starts typing
    if (errors[key]) {
      setErrors({ ...errors, [key]: null });
    }
  };

  const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!input.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(input.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!input.password.trim()) {
      newErrors.password = "Password is required";
    } else if (input.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }

    setErrors({});
    setIsLoading(true);

    try {
      const { data } = await loginUser({
        variables: {
          user: {
            email: input.email.trim(),
            password: input.password,
          },
        },
      });

      if (data?.login?.token) {
        await SecureStore.setItemAsync("access_token", data.login.token);
        Alert.alert("Success", "Login successful!");
        
        // Reset form
        setInput({ email: "", password: "" });
        setErrors({});
        setShowPassword(false);

        // Navigate to main app (you'll need to add this route)
        // navigation.navigate("MainApp");
      }
    } catch (err) {
      const newErrors = {};
      if (err.graphQLErrors && err.graphQLErrors.length > 0) {
        const errorMessage = err.graphQLErrors[0].message.toLowerCase();
        if (errorMessage.includes("email") || errorMessage.includes("password")) {
          newErrors.general = "Invalid email or password";
        } else {
          newErrors.general = err.graphQLErrors[0].message;
        }
      } else {
        newErrors.general = "An error occurred. Please try again.";
      }
      setErrors(newErrors);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    // Placeholder for Google login implementation
    Alert.alert("Google Login", "Google login feature will be implemented soon");
  };

  const handleForgotPassword = () => {
    Alert.alert("Forgot Password", "Password reset feature will be implemented soon");
  };

  const handleNavigateToRegister = () => {
    navigation.navigate("RegisterScreen");
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
              source={require("../assets/logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>
            Sign in to continue your parking journey
          </Text>

          {/* General Error */}
          {errors.general ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{errors.general}</Text>
            </View>
          ) : null}

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Email Address</Text>
            {errors.email ? (
              <Text style={styles.fieldErrorText}>{errors.email}</Text>
            ) : null}
            <View style={styles.inputWrapper}>
              <Ionicons
                name="mail-outline"
                size={22}
                color="#4B5EAA"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                value={input.email}
                onChangeText={(value) => handleChange(value, "email")}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#8A94A6"
                autoComplete="email"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Password</Text>
            {errors.password ? (
              <Text style={styles.fieldErrorText}>{errors.password}</Text>
            ) : null}
            <View style={styles.inputWrapper}>
              <Ionicons
                name="lock-closed-outline"
                size={22}
                color="#4B5EAA"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                value={input.password}
                onChangeText={(value) => handleChange(value, "password")}
                secureTextEntry={!showPassword}
                placeholderTextColor="#8A94A6"
                autoComplete="password"
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

          <TouchableOpacity 
            onPress={handleForgotPassword}
            style={styles.forgotPasswordContainer}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleLogin}
            style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
            disabled={isLoading}
          >
            <Text style={styles.loginButtonText}>
              {isLoading ? "Signing In..." : "Sign In"}
            </Text>
          </TouchableOpacity>

          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            onPress={handleGoogleLogin}
            style={styles.googleButton}
            disabled={isLoading}
          >
            <Ionicons name="logo-google" size={22} color="#DB4437" style={styles.googleIcon} />
            <Text style={styles.googleButtonText}>Continue with Google</Text>
          </TouchableOpacity>

          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>Don't have an account?</Text>
            <TouchableOpacity onPress={handleNavigateToRegister}>
              <Text style={styles.registerLink}> Sign Up</Text>
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
    backgroundColor: "#F5F7FA",
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 25,
    paddingTop: 80,
    paddingBottom: 100,
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 40,
    justifyContent: "center",
  },
  logo: {
    width: 130,
    height: 50,
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
    marginBottom: 40,
    textAlign: "center",
    fontWeight: "400",
  },
  inputContainer: {
    marginBottom: 25,
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
  forgotPasswordContainer: {
    alignSelf: "flex-end",
    marginBottom: 30,
  },
  forgotPasswordText: {
    color: "#D4A017",
    fontSize: 14,
    fontWeight: "600",
  },
  loginButton: {
    backgroundColor: "#1E3A8A",
    borderRadius: 16,
    height: 60,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  loginButtonDisabled: {
    backgroundColor: "#9CA3AF",
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 25,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E5E7EB",
  },
  dividerText: {
    color: "#6B7280",
    fontSize: 14,
    fontWeight: "500",
    marginHorizontal: 15,
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    height: 56,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 3,
  },
  googleIcon: {
    marginRight: 12,
  },
  googleButtonText: {
    color: "#374151",
    fontSize: 16,
    fontWeight: "600",
  },
  registerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 10,
    marginBottom: 20,
  },
  registerText: {
    color: "#6B7280",
    fontSize: 16,
    fontWeight: "400",
  },
  registerLink: {
    color: "#D4A017",
    fontWeight: "600",
    fontSize: 16,
  },
  errorContainer: {
    backgroundColor: "#FEF2F2",
    borderColor: "#F87171",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  errorText: {
    color: "#DC2626",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  fieldErrorText: {
    color: "#FF6B6B",
    fontSize: 12,
    marginBottom: 8,
    fontWeight: "600",
  },
});