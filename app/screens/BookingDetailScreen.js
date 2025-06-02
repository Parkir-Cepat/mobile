import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  Modal,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { gql, useQuery, useMutation } from "@apollo/client";
import QRCode from "react-native-qrcode-svg";

const GET_BOOKING = gql`
  query GetBooking($getBookingId: ID!) {
    getBooking(id: $getBookingId) {
      _id
      user_id
      user {
        email
        name
        role
        saldo
      }
      parking_id
      parking {
        name
        address
        location {
          type
          coordinates
        }
        operational_hours {
          open
          close
        }
        facilities
        images
        status
        rating
        review_count
      }
      vehicle_type
      start_time
      duration
      cost
      status
      qr_code
      entry_qr
      exit_qr
      created_at
      updated_at
    }
  }
`;

const PROCESS_PAYMENT = gql`
  mutation ProcessBookingPayment($bookingId: ID!) {
    processBookingPayment(bookingId: $bookingId) {
      success
      message
      booking {
        _id
        status
        updated_at
      }
    }
  }
`;

const CONFIRM_BOOKING = gql`
  mutation ConfirmBooking($confirmBookingId: ID!) {
    confirmBooking(id: $confirmBookingId) {
      _id
      user {
        email
        name
        role
        saldo
      }
      parking_id
      parking {
        name
        address
        location {
          type
          coordinates
        }
        operational_hours {
          open
          close
        }
        facilities
        images
        status
        rating
        review_count
      }
      vehicle_type
      start_time
      duration
      cost
      status
      qr_code
      entry_qr
      exit_qr
      created_at
      updated_at
    }
  }
`;

const GENERATE_ENTRY_QR = gql`
  mutation GenerateEntryQR($bookingId: ID!) {
    generateEntryQR(bookingId: $bookingId) {
      qrCode
      qrType
      expiresAt
      instructions
      booking {
        _id
        user {
          email
          name
          role
          saldo
        }
        parking {
          name
          address
          location {
            type
            coordinates
          }
          images
          status
          rating
          review_count
        }
        status
        entry_qr
        updated_at
      }
    }
  }
`;

export default function BookingDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { bookingId } = route.params;
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [currentQRData, setCurrentQRData] = useState(null);

  const { data, loading, error, refetch } = useQuery(GET_BOOKING, {
    variables: { getBookingId: bookingId },
    fetchPolicy: "cache-and-network", // For real-time updates
    onError: (error) => {
      console.log("Get booking error:", error);
    },
  });

  const [processPayment, { loading: paymentLoading }] = useMutation(
    PROCESS_PAYMENT,
    {
      onCompleted: (data) => {
        if (data.processBookingPayment.success) {
          Alert.alert(
            "Payment Success! 🎉",
            data.processBookingPayment.message,
            [{ text: "OK", onPress: () => refetch() }]
          );
        } else {
          Alert.alert("Payment Failed", data.processBookingPayment.message);
        }
      },
      onError: (error) => {
        Alert.alert("Payment Error", error.message);
      },
    }
  );

  const [confirmBooking, { loading: confirmLoading }] = useMutation(
    CONFIRM_BOOKING,
    {
      onCompleted: (data) => {
        Alert.alert(
          "Payment Success! 🎉",
          `Booking confirmed! Your balance: Rp ${data.confirmBooking.user.saldo.toLocaleString()}`,
          [
            {
              text: "OK",
              onPress: () => {
                // Update cache and refresh multiple screens
                refetch();
                // Navigate back to refresh MyBookingsScreen
                navigation.navigate("MyBookingsScreen");
              },
            },
          ]
        );
      },
      onError: (error) => {
        Alert.alert("Payment Failed", error.message);
      },
      // Update cache for real-time updates
      update: (cache, { data }) => {
        if (data?.confirmBooking) {
          // Update the current booking cache
          cache.writeQuery({
            query: GET_BOOKING,
            variables: { getBookingId: bookingId },
            data: {
              getBooking: data.confirmBooking,
            },
          });

          // Invalidate MyBookingsScreen cache to force refresh
          cache.evict({ fieldName: "getMyActiveBookings" });
        }
      },
    }
  );

  const [generateEntryQR, { loading: qrLoading }] = useMutation(
    GENERATE_ENTRY_QR,
    {
      onCompleted: (data) => {
        const qrData = data.generateEntryQR;
        Alert.alert(
          "Entry QR Generated! 📱",
          `${qrData.instructions}\n\nValid until: ${new Date(
            qrData.expiresAt
          ).toLocaleString("id-ID")}`,
          [
            {
              text: "View QR Code",
              onPress: () => showQRCode(qrData.qrCode, qrData.instructions),
            },
            {
              text: "OK",
              onPress: () => refetch(),
            },
          ]
        );
      },
      onError: (error) => {
        Alert.alert("QR Generation Failed", error.message);
      },
      update: (cache, { data }) => {
        if (data?.generateEntryQR?.booking) {
          // Update the current booking cache with new entry_qr
          cache.writeQuery({
            query: GET_BOOKING,
            variables: { getBookingId: bookingId },
            data: {
              getBooking: {
                ...booking,
                entry_qr: data.generateEntryQR.qrCode,
                updated_at: data.generateEntryQR.booking.updated_at,
              },
            },
          });
        }
      },
    }
  );

  const booking = data?.getBooking;

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "#F59E0B";
      case "confirmed":
        return "#10B981";
      case "active":
        return "#3B82F6";
      case "completed":
        return "#6B7280";
      case "cancelled":
        return "#EF4444";
      default:
        return "#6B7280";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return "time-outline";
      case "confirmed":
        return "checkmark-circle";
      case "active":
        return "car";
      case "completed":
        return "checkmark-done";
      case "cancelled":
        return "close-circle";
      default:
        return "help-circle";
    }
  };

  const formatDateTime = (timestamp) => {
    const date = new Date(parseInt(timestamp));
    return date.toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDuration = (hours) => {
    if (hours < 24) {
      return `${hours} hour${hours > 1 ? "s" : ""}`;
    } else if (hours < 168) {
      const days = Math.floor(hours / 24);
      return `${days} day${days > 1 ? "s" : ""}`;
    } else {
      const weeks = Math.floor(hours / 168);
      return `${weeks} week${weeks > 1 ? "s" : ""}`;
    }
  };

  const calculateEndTime = (startTime, duration) => {
    const start = new Date(parseInt(startTime));
    const end = new Date(start.getTime() + duration * 60 * 60 * 1000);
    return end;
  };

  const handlePayment = async () => {
    Alert.alert(
      "Confirm Payment",
      `Pay Rp ${booking.cost.toLocaleString()} for this booking?\n\nCurrent balance: Rp ${booking.user.saldo.toLocaleString()}`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Pay Now",
          onPress: () => {
            // Check if user has enough balance
            if (booking.user.saldo < booking.cost) {
              Alert.alert(
                "Insufficient Balance",
                `You need Rp ${booking.cost.toLocaleString()} but only have Rp ${booking.user.saldo.toLocaleString()}.\n\nPlease top up your balance first.`,
                [{ text: "OK" }]
              );
              return;
            }

            confirmBooking({ variables: { confirmBookingId: booking._id } });
          },
        },
      ]
    );
  };

  const handleCancel = () => {
    Alert.alert(
      "Cancel Booking",
      "Are you sure you want to cancel this booking?",
      [
        { text: "No", style: "cancel" },
        { text: "Yes", onPress: () => console.log("Cancel booking") },
      ]
    );
  };

  const handleGenerateEntryQR = () => {
    Alert.alert(
      "Generate Entry QR Code",
      "Generate QR code for parking entry? This QR will be valid for 24 hours.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Generate",
          onPress: () => {
            generateEntryQR({ variables: { bookingId: booking._id } });
          },
        },
      ]
    );
  };

  const showQRCode = (qrCode, instructions) => {
    setCurrentQRData({ qrCode, instructions });
    setQrModalVisible(true);
  };

  const closeQRModal = () => {
    setQrModalVisible(false);
    setCurrentQRData(null);
  };

  const getStatusMessage = (status) => {
    switch (status) {
      case "pending":
        return "Complete payment to proceed";
      case "confirmed":
        return "Generate QR code to enter parking";
      case "active":
        return "Currently parked - Generate exit QR when ready to leave";
      case "completed":
        return "Parking completed";
      case "cancelled":
        return "Booking cancelled";
      default:
        return "";
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading booking details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !booking) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text>Error loading booking details</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => refetch()}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
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
          <Text style={styles.headerTitle}>Booking Details</Text>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={() => refetch()}
          >
            <Ionicons name="refresh" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View
            style={[
              styles.statusHeader,
              { backgroundColor: getStatusColor(booking.status) },
            ]}
          >
            <Ionicons
              name={getStatusIcon(booking.status)}
              size={24}
              color="#FFFFFF"
            />
            <Text style={styles.statusText}>
              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
            </Text>
          </View>
          <View style={styles.statusBody}>
            <Text style={styles.bookingId}>
              Booking ID: #{booking._id.slice(-8)}
            </Text>
            <Text style={styles.bookingDate}>
              Created: {formatDateTime(booking.created_at)}
            </Text>
          </View>
        </View>

        {/* Parking Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Parking Location</Text>
          <View style={styles.parkingCard}>
            <Image
              source={{
                uri:
                  booking.parking.images[0] ||
                  "https://via.placeholder.com/300x150?text=Parking",
              }}
              style={styles.parkingImage}
            />
            <View style={styles.parkingInfo}>
              <Text style={styles.parkingName}>{booking.parking.name}</Text>
              <View style={styles.addressRow}>
                <Ionicons name="location-outline" size={16} color="#6B7280" />
                <Text style={styles.parkingAddress}>
                  {booking.parking.address}
                </Text>
              </View>
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={16} color="#FFD700" />
                <Text style={styles.rating}>
                  {booking.parking.rating.toFixed(1)} (
                  {booking.parking.review_count} reviews)
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Booking Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Booking Information</Text>
          <View style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Ionicons name="car" size={16} color="#FE7A3A" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Vehicle Type</Text>
                <Text style={styles.detailValue}>
                  {booking.vehicle_type.charAt(0).toUpperCase() +
                    booking.vehicle_type.slice(1)}
                </Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Ionicons name="time" size={16} color="#FE7A3A" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Start Time</Text>
                <Text style={styles.detailValue}>
                  {formatDateTime(booking.start_time)}
                </Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Ionicons name="hourglass" size={16} color="#FE7A3A" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Duration</Text>
                <Text style={styles.detailValue}>
                  {formatDuration(booking.duration)}
                </Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Ionicons name="flag" size={16} color="#FE7A3A" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>End Time</Text>
                <Text style={styles.detailValue}>
                  {calculateEndTime(
                    booking.start_time,
                    booking.duration
                  ).toLocaleDateString("id-ID", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Cost Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Summary</Text>
          <View style={styles.costCard}>
            <View style={styles.costRow}>
              <Text style={styles.costLabel}>Duration</Text>
              <Text style={styles.costValue}>
                {formatDuration(booking.duration)}
              </Text>
            </View>
            <View style={styles.costRow}>
              <Text style={styles.costLabel}>Rate per Hour</Text>
              <Text style={styles.costValue}>
                Rp{" "}
                {Math.round(booking.cost / booking.duration).toLocaleString()}
              </Text>
            </View>
            <View style={[styles.costRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalValue}>
                Rp {booking.cost.toLocaleString()}
              </Text>
            </View>
          </View>
        </View>

        {/* QR Code Section */}
        {(booking.entry_qr || booking.exit_qr || booking.qr_code) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>QR Codes</Text>
            <View style={styles.qrCard}>
              {booking.status === "confirmed" && (
                <View style={styles.qrSection}>
                  <Text style={styles.qrText}>Entry QR Code</Text>
                  {booking.entry_qr ? (
                    <View style={styles.qrGenerated}>
                      <Ionicons name="qr-code" size={48} color="#10B981" />
                      <Text style={styles.qrGeneratedText}>
                        Entry QR Generated
                      </Text>
                      <TouchableOpacity
                        style={styles.viewQrButton}
                        onPress={() =>
                          showQRCode(
                            booking.entry_qr,
                            "Show this QR code at parking entrance"
                          )
                        }
                      >
                        <Text style={styles.viewQrButtonText}>
                          View QR Code
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.qrPlaceholder}>
                      <Ionicons
                        name="qr-code-outline"
                        size={48}
                        color="#6B7280"
                      />
                      <Text style={styles.qrPlaceholderText}>
                        Generate entry QR code below
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {booking.status === "active" && booking.entry_qr && (
                <View style={styles.qrSection}>
                  <Text style={styles.qrText}>Entry QR Used</Text>
                  <View style={styles.qrUsed}>
                    <Ionicons
                      name="checkmark-circle"
                      size={48}
                      color="#10B981"
                    />
                    <Text style={styles.qrUsedText}>
                      Successfully entered parking
                    </Text>
                  </View>
                </View>
              )}

              {booking.exit_qr && (
                <View style={styles.qrSection}>
                  <Text style={styles.qrText}>Exit QR Code</Text>
                  <View style={styles.qrGenerated}>
                    <Ionicons name="qr-code" size={48} color="#F59E0B" />
                    <Text style={styles.qrGeneratedText}>
                      Exit QR Generated
                    </Text>
                    <TouchableOpacity
                      style={styles.viewQrButton}
                      onPress={() =>
                        showQRCode(
                          booking.exit_qr,
                          "Show this QR code at parking exit"
                        )
                      }
                    >
                      <Text style={styles.viewQrButtonText}>View QR Code</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Status Instructions */}
        <View style={styles.section}>
          <View style={styles.instructionCard}>
            <Ionicons name="information-circle" size={24} color="#3B82F6" />
            <Text style={styles.instructionText}>
              {getStatusMessage(booking.status)}
            </Text>
          </View>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        {booking.status === "pending" && (
          <>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancel}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.payButton}
              onPress={handlePayment}
              disabled={confirmLoading}
            >
              <LinearGradient
                colors={["#FF9A62", "#FE7A3A"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.payGradient}
              >
                {confirmLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.payButtonText}>Pay Now</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </>
        )}

        {booking.status === "confirmed" && (
          <>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancel}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.payButton}
              onPress={handleGenerateEntryQR}
              disabled={qrLoading}
            >
              <LinearGradient
                colors={["#10B981", "#059669"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.payGradient}
              >
                {qrLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Ionicons name="qr-code" size={20} color="#FFFFFF" />
                    <Text style={[styles.payButtonText, { marginLeft: 8 }]}>
                      {booking.entry_qr ? "Regenerate QR" : "Generate Entry QR"}
                    </Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </>
        )}

        {booking.status === "active" && (
          <TouchableOpacity style={styles.fullWidthButton}>
            <LinearGradient
              colors={["#3B82F6", "#2563EB"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.payGradient}
            >
              <Ionicons name="car" size={20} color="#FFFFFF" />
              <Text style={[styles.payButtonText, { marginLeft: 8 }]}>
                Currently Parked
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {booking.status === "completed" && (
          <TouchableOpacity style={styles.fullWidthButton}>
            <LinearGradient
              colors={["#6B7280", "#4B5563"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.payGradient}
            >
              <Ionicons name="checkmark-done" size={20} color="#FFFFFF" />
              <Text style={[styles.payButtonText, { marginLeft: 8 }]}>
                Parking Completed
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>

      {/* QR Code Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={qrModalVisible}
        onRequestClose={closeQRModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>QR Code</Text>
              <TouchableOpacity
                onPress={closeQRModal}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {currentQRData && (
              <View style={styles.qrModalBody}>
                <Text style={styles.qrInstructions}>
                  {currentQRData.instructions}
                </Text>

                <View style={styles.qrCodeContainer}>
                  <QRCode
                    value={currentQRData.qrCode}
                    size={250}
                    backgroundColor="white"
                    color="black"
                  />
                </View>

                <View style={styles.qrDetails}>
                  <Text style={styles.qrDetailLabel}>Booking ID:</Text>
                  <Text style={styles.qrDetailValue}>
                    #{booking?._id?.slice(-8)}
                  </Text>
                </View>

                <View style={styles.qrDetails}>
                  <Text style={styles.qrDetailLabel}>Vehicle Type:</Text>
                  <Text style={styles.qrDetailValue}>
                    {booking?.vehicle_type?.charAt(0).toUpperCase() +
                      booking?.vehicle_type?.slice(1)}
                  </Text>
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.shareButton}
                    onPress={() => {
                      // Implement share functionality if needed
                      Alert.alert("QR Code", "QR Code ready to scan!");
                    }}
                  >
                    <Ionicons name="share-outline" size={20} color="#FFFFFF" />
                    <Text style={styles.shareButtonText}>Share QR</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.doneButton}
                    onPress={closeQRModal}
                  >
                    <Text style={styles.doneButtonText}>Done</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
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
  refreshButton: {
    padding: 5,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  statusCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginTop: 20,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statusHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  statusText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    marginLeft: 8,
  },
  statusBody: {
    padding: 16,
  },
  bookingId: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E3A8A",
    marginBottom: 4,
  },
  bookingDate: {
    fontSize: 14,
    color: "#6B7280",
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E3A8A",
    marginBottom: 12,
  },
  parkingCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  parkingImage: {
    width: "100%",
    height: 150,
    resizeMode: "cover",
  },
  parkingInfo: {
    padding: 16,
  },
  parkingName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E3A8A",
    marginBottom: 8,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  parkingAddress: {
    fontSize: 14,
    color: "#6B7280",
    marginLeft: 6,
    flex: 1,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  rating: {
    fontSize: 14,
    color: "#6B7280",
    marginLeft: 4,
  },
  detailsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  detailIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFF5F0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E3A8A",
  },
  costCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  costRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  costLabel: {
    fontSize: 14,
    color: "#6B7280",
  },
  costValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E3A8A",
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    marginTop: 8,
    paddingTop: 16,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E3A8A",
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FE7A3A",
  },
  qrCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  qrText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 16,
  },
  qrPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#E5E7EB",
    borderStyle: "dashed",
  },
  qrPlaceholderText: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 8,
    textAlign: "center",
  },
  bottomSpacing: {
    height: 100,
  },
  bottomActions: {
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    padding: 20,
    paddingBottom: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 10,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: "center",
    marginRight: 10,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6B7280",
  },
  payButton: {
    flex: 2,
    marginLeft: 10,
  },
  fullWidthButton: {
    flex: 1,
  },
  payGradient: {
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  payButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  retryButton: {
    backgroundColor: "#FE7A3A",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  retryButtonText: {
    color: "white",
    fontWeight: "600",
  },
  qrSection: {
    marginBottom: 20,
  },
  qrGenerated: {
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#10B981",
  },
  qrGeneratedText: {
    fontSize: 14,
    color: "#059669",
    fontWeight: "600",
    marginTop: 8,
    marginBottom: 12,
  },
  qrUsed: {
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#10B981",
  },
  qrUsedText: {
    fontSize: 14,
    color: "#059669",
    fontWeight: "600",
    marginTop: 8,
  },
  viewQrButton: {
    backgroundColor: "#10B981",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  viewQrButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  instructionCard: {
    backgroundColor: "#EFF6FF",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },
  instructionText: {
    fontSize: 14,
    color: "#1E40AF",
    marginLeft: 12,
    flex: 1,
    fontWeight: "500",
  },
  // QR Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    margin: 20,
    maxHeight: "80%",
    width: Dimensions.get("window").width - 40,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1E3A8A",
  },
  closeButton: {
    padding: 5,
    borderRadius: 15,
    backgroundColor: "#F3F4F6",
  },
  qrModalBody: {
    alignItems: "center",
  },
  qrInstructions: {
    fontSize: 16,
    color: "#374151",
    textAlign: "center",
    marginBottom: 25,
    lineHeight: 22,
  },
  qrCodeContainer: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 25,
  },
  qrDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingVertical: 8,
    paddingHorizontal: 20,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    marginBottom: 8,
  },
  qrDetailLabel: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  qrDetailValue: {
    fontSize: 14,
    color: "#1E3A8A",
    fontWeight: "600",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 25,
  },
  shareButton: {
    backgroundColor: "#3B82F6",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 10,
    justifyContent: "center",
  },
  shareButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    marginLeft: 8,
  },
  doneButton: {
    backgroundColor: "#10B981",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    flex: 1,
    marginLeft: 10,
    alignItems: "center",
  },
  doneButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },
});
