import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { formatAmountInput } from "../helpers/formatAmount";

// Dummy payment methods
const PAYMENT_METHODS = [
  {
    id: "cc",
    name: "Credit / Debit Card",
    icon: "card-outline",
    providers: [
      {
        id: "visa",
        name: "Visa",
        image:
          "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/200px-Visa_Inc._logo.svg.png",
      },
      {
        id: "mc",
        name: "Mastercard",
        image:
          "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/200px-Mastercard-logo.svg.png",
      },
    ],
  },
  {
    id: "bank",
    name: "Bank Transfer",
    icon: "business-outline",
    providers: [
      {
        id: "bca",
        name: "BCA",
        image:
          "https://upload.wikimedia.org/wikipedia/id/thumb/5/5c/Bank_Central_Asia.svg/200px-Bank_Central_Asia.svg.png",
      },
      {
        id: "bni",
        name: "BNI",
        image:
          "https://upload.wikimedia.org/wikipedia/id/thumb/5/55/BNI_logo.svg/200px-BNI_logo.svg.png",
      },
      {
        id: "mandiri",
        name: "Mandiri",
        image:
          "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/Bank_Mandiri_logo_2016.svg/200px-Bank_Mandiri_logo_2016.svg.png",
      },
    ],
  },
  {
    id: "ewallet",
    name: "E-Wallet",
    icon: "wallet-outline",
    providers: [
      {
        id: "ovo",
        name: "OVO",
        image:
          "https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/Logo_ovo_purple.svg/200px-Logo_ovo_purple.svg.png",
      },
      {
        id: "gopay",
        name: "GoPay",
        image:
          "https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/Gopay_logo.svg/200px-Gopay_logo.svg.png",
      },
      {
        id: "dana",
        name: "DANA",
        image:
          "https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/Logo_dana_blue.svg/200px-Logo_dana_blue.svg.png",
      },
    ],
  },
];

// Predefined top-up amounts
const AMOUNT_OPTIONS = [
  { value: 50000, label: "Rp 50.000" },
  { value: 100000, label: "Rp 100.000" },
  { value: 200000, label: "Rp 200.000" },
  { value: 500000, label: "Rp 500.000" },
];

export default function TopUpScreen() {
  const navigation = useNavigation();
  const [currentBalance] = useState(120000); // Dummy current balance
  const [selectedAmount, setSelectedAmount] = useState(null);
  const [customAmount, setCustomAmount] = useState("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAmountSelect = (amount) => {
    setSelectedAmount(amount);
    setCustomAmount("");
  };

  const handleCustomAmountChange = (text) => {
    // Remove non-numeric characters
    const numericValue = text.replace(/[^0-9]/g, "");
    setCustomAmount(numericValue);
    setSelectedAmount(null);
  };

  const handlePaymentMethodSelect = (methodId) => {
    setSelectedPaymentMethod(methodId);
    setSelectedProvider(null);
  };

  const handleProviderSelect = (provider) => {
    setSelectedProvider(provider);
  };

  const getTopUpAmount = () => {
    if (selectedAmount) return selectedAmount;
    if (customAmount) return parseInt(customAmount, 10);
    return 0;
  };

  const handleContinue = () => {
    const amount = getTopUpAmount();

    if (!amount || amount < 10000) {
      Alert.alert(
        "Invalid Amount",
        "Please enter an amount of at least Rp 10,000"
      );
      return;
    }

    if (!selectedPaymentMethod) {
      Alert.alert("Payment Method Required", "Please select a payment method");
      return;
    }

    if (!selectedProvider) {
      Alert.alert("Provider Required", "Please select a payment provider");
      return;
    }

    setIsLoading(true);

    // Simulate API call (would be replaced with actual Mitrans API)
    setTimeout(() => {
      setIsLoading(false);
      Alert.alert(
        "Top Up Initiated",
        `You will be redirected to complete your payment of Rp ${formatAmountInput(
          amount
        )} with ${selectedProvider.name}`,
        [
          {
            text: "OK",
            onPress: () => navigation.navigate("HomeScreen"), // Replace with actual redirect
          },
        ]
      );
    }, 1500);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 20 : 0}
      >
        {/* Header */}
        <LinearGradient
          colors={["#FE7A3A", "#FF9A62"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Top Up Balance</Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.balanceContainer}>
            <Text style={styles.balanceLabel}>Current Balance</Text>
            <Text style={styles.balanceAmount}>
              Rp {formatAmountInput(currentBalance)}
            </Text>
          </View>
        </LinearGradient>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Amount Selection Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Amount</Text>

            <View style={styles.amountGrid}>
              {AMOUNT_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.amountOption,
                    selectedAmount === option.value &&
                      styles.selectedAmountOption,
                  ]}
                  onPress={() => handleAmountSelect(option.value)}
                >
                  <Text
                    style={[
                      styles.amountOptionText,
                      selectedAmount === option.value &&
                        styles.selectedAmountOptionText,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.orText}>or enter custom amount:</Text>

            <View style={styles.customAmountContainer}>
              <Text style={styles.currencyPrefix}>Rp</Text>
              <TextInput
                style={styles.customAmountInput}
                placeholder="e.g. 150,000"
                keyboardType="number-pad"
                value={customAmount ? formatAmountInput(customAmount) : ""}
                onChangeText={handleCustomAmountChange}
              />
            </View>
          </View>

          {/* Payment Method Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Method</Text>

            {PAYMENT_METHODS.map((method) => (
              <View key={method.id}>
                <TouchableOpacity
                  style={[
                    styles.paymentMethod,
                    selectedPaymentMethod === method.id &&
                      styles.selectedPaymentMethod,
                  ]}
                  onPress={() => handlePaymentMethodSelect(method.id)}
                >
                  <View style={styles.paymentMethodIcon}>
                    <Ionicons name={method.icon} size={24} color="#FE7A3A" />
                  </View>
                  <Text style={styles.paymentMethodName}>{method.name}</Text>
                  <Ionicons
                    name={
                      selectedPaymentMethod === method.id
                        ? "chevron-up"
                        : "chevron-down"
                    }
                    size={20}
                    color="#9CA3AF"
                  />
                </TouchableOpacity>

                {selectedPaymentMethod === method.id && (
                  <View style={styles.providersContainer}>
                    {method.providers.map((provider) => (
                      <TouchableOpacity
                        key={provider.id}
                        style={[
                          styles.provider,
                          selectedProvider?.id === provider.id &&
                            styles.selectedProvider,
                        ]}
                        onPress={() => handleProviderSelect(provider)}
                      >
                        <Image
                          source={{ uri: provider.image }}
                          style={styles.providerImage}
                          resizeMode="contain"
                        />
                        <Text style={styles.providerName}>{provider.name}</Text>
                        {selectedProvider?.id === provider.id && (
                          <Ionicons
                            name="checkmark-circle"
                            size={20}
                            color="#FE7A3A"
                          />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        </ScrollView>

        {/* Summary Section */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Top Up Amount:</Text>
            <Text style={styles.summaryValue}>
              Rp {formatAmountInput(getTopUpAmount())}
            </Text>
          </View>

          {selectedProvider && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Payment Method:</Text>
              <Text style={styles.summaryValue}>{selectedProvider.name}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.continueButton,
              (!getTopUpAmount() ||
                !selectedPaymentMethod ||
                !selectedProvider) &&
                styles.continueButtonDisabled,
            ]}
            onPress={handleContinue}
            disabled={
              !getTopUpAmount() ||
              !selectedPaymentMethod ||
              !selectedProvider ||
              isLoading
            }
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.continueButtonText}>Continue to Payment</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    paddingTop: 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  backButton: {
    padding: 5,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  balanceContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 15,
    padding: 15,
    alignItems: "center",
  },
  balanceLabel: {
    color: "#FFFFFF",
    fontSize: 14,
    opacity: 0.9,
    marginBottom: 5,
  },
  balanceAmount: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "700",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E3A8A",
    marginBottom: 15,
  },
  amountGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  amountOption: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 15,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  selectedAmountOption: {
    borderColor: "#FE7A3A",
    backgroundColor: "#FFF5F0",
  },
  amountOptionText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4B5563",
  },
  selectedAmountOptionText: {
    color: "#FE7A3A",
  },
  orText: {
    color: "#6B7280",
    textAlign: "center",
    marginVertical: 15,
  },
  customAmountContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 15,
    height: 55,
  },
  currencyPrefix: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4B5563",
    marginRight: 5,
  },
  customAmountInput: {
    flex: 1,
    fontSize: 16,
    color: "#1E293B",
    height: "100%",
  },
  paymentMethod: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 15,
    marginBottom: 10,
  },
  selectedPaymentMethod: {
    borderColor: "#FE7A3A",
    backgroundColor: "#FFF5F0",
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    marginBottom: 0,
  },
  paymentMethodIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#FFF5F0",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 15,
  },
  paymentMethodName: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
  },
  providersContainer: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: "#FE7A3A",
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    paddingHorizontal: 15,
    paddingBottom: 15,
    marginBottom: 10,
  },
  provider: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  selectedProvider: {
    backgroundColor: "#FFF5F0",
  },
  providerImage: {
    width: 40,
    height: 25,
    marginRight: 15,
  },
  providerName: {
    flex: 1,
    fontSize: 15,
    color: "#4B5563",
  },
  summaryContainer: {
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    padding: 20,
    paddingBottom: Platform.OS === "ios" ? 30 : 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 5,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#6B7280",
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
  },
  continueButton: {
    backgroundColor: "#FE7A3A",
    borderRadius: 12,
    height: 55,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    shadowColor: "#FE7A3A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  continueButtonDisabled: {
    backgroundColor: "#BDBDBD",
    shadowOpacity: 0,
  },
  continueButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
