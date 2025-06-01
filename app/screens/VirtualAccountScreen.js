import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ScrollView,
  Clipboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { gql, useMutation } from "@apollo/client";
import { formatAmountInput } from "../helpers/formatAmount";

const CONFIRM_PAYMENT = gql`
  mutation ConfirmPayment($transaction_id: String!) {
    confirmPayment(transaction_id: $transaction_id) {
      transaction_id
      status
      user {
        saldo
      }
    }
  }
`;
const SIMULATE_PAYMENT = gql`
  mutation SimulatePaymentSuccess($transaction_id: String!) {
    simulatePaymentSuccess(transaction_id: $transaction_id) {
      success
      message
      transaction {
        transaction_id
        status
      }
      user {
        saldo
      }
      webhook_data
    }
  }
`;

export default function VirtualAccountScreen() {
  const navigation = useNavigation();
  const route = useRoute();

  const {
    transaction_id,
    amount,
    payment_method,
    bank,
    va_number,
    simulation,
  } = route.params;

  const [confirmPayment, { loading: confirmLoading }] =
    useMutation(CONFIRM_PAYMENT);
  const [simulatePayment, { loading: simulateLoading }] =
    useMutation(SIMULATE_PAYMENT);

  const copyToClipboard = (text, label) => {
    Clipboard.setString(text);
    Alert.alert("Copied!", `${label} copied to clipboard`);
  };

  // Get bank-specific instructions
  const getBankInstructions = () => {
    switch (bank) {
      case "BRI":
        return {
          appName: "BRImo",
          steps: [
            "Open BRImo app and login",
            'Tap "Transfer" on home screen',
            'Select "Virtual Account BRI"',
            `Enter VA number: ${va_number}`,
            `Confirm amount: Rp ${formatAmountInput(amount)}`,
            "Enter your PIN to complete transfer",
            'Save transfer receipt and tap "Confirm Payment" below',
          ],
        };
      case "BCA":
        return {
          appName: "BCA mobile",
          steps: [
            "Open BCA mobile app and login",
            'Tap "m-Transfer" menu',
            'Select "BCA Virtual Account"',
            `Enter VA number: ${va_number}`,
            `Confirm amount: Rp ${formatAmountInput(amount)}`,
            "Enter your PIN to complete transfer",
            'Save transfer receipt and tap "Confirm Payment" below',
          ],
        };
      case "MANDIRI":
        return {
          appName: "Livin by Mandiri",
          steps: [
            "Open Livin by Mandiri app and login",
            'Tap "Transfer" menu',
            'Select "To Mandiri Virtual Account"',
            `Enter VA number: ${va_number}`,
            `Confirm amount: Rp ${formatAmountInput(amount)}`,
            "Enter your MPIN to complete transfer",
            'Save transfer receipt and tap "Confirm Payment" below',
          ],
        };
      default:
        return {
          appName: "Mobile Banking",
          steps: [
            `Open your ${bank} mobile banking app`,
            "Find Transfer or Virtual Account menu",
            `Enter VA number: ${va_number}`,
            `Enter amount: Rp ${formatAmountInput(amount)}`,
            "Complete the transfer",
            'Tap "Confirm Payment" below',
          ],
        };
    }
  };

  const bankInfo = getBankInstructions();

  const handleSimulatePayment = async () => {
    Alert.alert(
      "Simulasi Pembayaran",
      `Simulasikan pembayaran berhasil untuk Rp ${formatAmountInput(amount)}?`,
      [
        {
          text: "Batal",
          style: "cancel",
        },
        {
          text: "Payment Successful",
          onPress: async () => {
            try {
              console.log(
                `🎯 Starting VA payment simulation for ${transaction_id}`
              );

              const result = await simulatePayment({
                variables: { transaction_id },
              });

              if (result.data?.simulatePaymentSuccess?.success) {
                const { message, user } = result.data.simulatePaymentSuccess;

                Alert.alert(
                  "🎉 Pembayaran Berhasil!",
                  `${message}\n\nSaldo baru: Rp ${formatAmountInput(
                    user.saldo
                  )}\n\n✅ Webhook Midtrans telah diproses`,
                  [
                    {
                      text: "OK",
                      onPress: () => {
                        console.log(
                          "💰 VA payment simulation completed successfully"
                        );
                        navigation.navigate("HomeScreen");
                      },
                    },
                  ]
                );
              } else {
                Alert.alert("Error", "Gagal memproses simulasi pembayaran");
              }
            } catch (error) {
              console.error("❌ VA simulate payment error:", error);
              Alert.alert("Error", `Simulasi gagal: ${error.message}`);
            }
          },
        },
      ]
    );
  };

  const handleManualConfirm = () => {
    if (simulation) {
      handleSimulatePayment();
    } else {
      // Real payment confirmation
      Alert.alert(
        "Konfirmasi Pembayaran",
        "Apakah Anda sudah menyelesaikan transfer? Ini akan menandai pembayaran sebagai berhasil.",
        [
          {
            text: "Belum",
            style: "cancel",
          },
          {
            text: "Ya, Sudah Transfer",
            onPress: handleSimulatePayment, // Use simulation for now
          },
        ]
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
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
          <Text style={styles.headerTitle}>
            {bank} Virtual Account {simulation ? "(Demo)" : ""}
          </Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.paymentInfo}>
          <Text style={styles.paymentAmount}>
            Rp {formatAmountInput(amount)}
          </Text>
          <Text style={styles.transactionId}>ID: {transaction_id}</Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.vaSection}>
          {simulation ? (
            <View style={styles.simulationContainer}>
              <Ionicons name="information-circle" size={48} color="#3B82F6" />
              <Text style={styles.simulationTitle}>Simulation Mode</Text>
              <Text style={styles.simulationText}>
                This is a demo version. Real {bank} Virtual Account requires
                merchant approval from Midtrans.
              </Text>
              <Text style={styles.simulationInstructions}>
                Click "Simulate Payment" below to complete the demo transaction.
              </Text>
            </View>
          ) : (
            <>
              <Text style={styles.vaTitle}>Virtual Account Payment</Text>
              <Text style={styles.vaSubtitle}>
                Transfer via {bankInfo.appName} to complete your top-up
              </Text>

              <View style={styles.vaContainer}>
                <View style={styles.vaHeader}>
                  <Text style={styles.vaLabel}>
                    {bank} Virtual Account Number
                  </Text>
                  <TouchableOpacity
                    style={styles.copyButton}
                    onPress={() => copyToClipboard(va_number, "VA Number")}
                  >
                    <Ionicons name="copy-outline" size={20} color="#FE7A3A" />
                    <Text style={styles.copyText}>Copy</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.vaNumber}>{va_number}</Text>
              </View>

              {va_number === "SIMULATION-MODE" && (
                <View style={styles.warningContainer}>
                  <Ionicons name="warning-outline" size={24} color="#F59E0B" />
                  <View style={styles.warningText}>
                    <Text style={styles.warningTitle}>Demo Mode Active</Text>
                    <Text style={styles.warningMessage}>
                      This VA number is for demonstration only. Use "Simulate
                      Payment" to continue.
                    </Text>
                  </View>
                </View>
              )}
            </>
          )}

          <TouchableOpacity
            style={[
              styles.confirmButton,
              simulation && styles.simulationButton,
            ]}
            onPress={handleManualConfirm}
            disabled={simulateLoading}
          >
            <Ionicons
              name={simulation ? "flash" : "checkmark-circle"}
              size={24}
              color="#FFFFFF"
            />
            <Text style={styles.confirmButtonText}>
              {simulateLoading
                ? "Memproses..."
                : simulation
                ? "Payment Successful"
                : "Saya Sudah Transfer"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  paymentInfo: {
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 15,
    padding: 15,
  },
  paymentAmount: {
    fontSize: 32,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 5,
  },
  transactionId: {
    fontSize: 12,
    color: "#FFFFFF",
    opacity: 0.8,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  vaSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  vaTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1E3A8A",
    marginBottom: 5,
    textAlign: "center",
  },
  vaSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 20,
  },
  vaContainer: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: "#E9ECEF",
  },
  vaHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  vaLabel: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "600",
  },
  copyButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF5F0",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  copyText: {
    marginLeft: 4,
    fontSize: 12,
    color: "#FE7A3A",
    fontWeight: "600",
  },
  vaNumber: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1E293B",
    letterSpacing: 1,
  },
  amountContainer: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: "#E9ECEF",
  },
  amountHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  amountLabel: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "600",
  },
  amountNumber: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1E293B",
  },
  warningContainer: {
    flexDirection: "row",
    backgroundColor: "#FEF3C7",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: "#F59E0B",
  },
  warningText: {
    flex: 1,
    marginLeft: 12,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#92400E",
    marginBottom: 4,
  },
  warningMessage: {
    fontSize: 13,
    color: "#92400E",
    lineHeight: 18,
  },
  instructionsContainer: {
    marginBottom: 20,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E3A8A",
    marginBottom: 10,
  },
  instructionItem: {
    flexDirection: "row",
    marginBottom: 8,
    alignItems: "flex-start",
  },
  instructionNumber: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FE7A3A",
    marginRight: 10,
    minWidth: 20,
  },
  instructionText: {
    fontSize: 14,
    color: "#4B5563",
    flex: 1,
    lineHeight: 20,
  },
  confirmButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#10B981",
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 25,
  },
  confirmButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 10,
  },
  helpText: {
    textAlign: "center",
    fontSize: 12,
    color: "#6B7280",
    marginTop: 20,
    fontStyle: "italic",
  },
  simulationContainer: {
    alignItems: "center",
    padding: 30,
    backgroundColor: "#EBF8FF",
    borderRadius: 15,
    marginBottom: 20,
  },
  simulationTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1E40AF",
    marginTop: 15,
    marginBottom: 10,
  },
  simulationText: {
    fontSize: 14,
    color: "#1E40AF",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 10,
  },
  simulationInstructions: {
    fontSize: 13,
    color: "#3B82F6",
    textAlign: "center",
    fontWeight: "600",
  },
  simulationButton: {
    backgroundColor: "#3B82F6",
  },
});
