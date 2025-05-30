import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  Alert,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { gql, useQuery } from "@apollo/client";

const { width } = Dimensions.get("window");

const GET_PARKING_DETAIL = gql`
  query GetParking($getParkingId: ID!) {
    getParking(id: $getParkingId) {
      _id
      name
      address
      location {
        type
        coordinates
      }
      owner_id
      owner {
        email
        name
        role
        saldo
      }
      capacity {
        car
        motorcycle
      }
      available {
        car
        motorcycle
      }
      rates {
        car
        motorcycle
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
      created_at
      updated_at
    }
  }
`;

export default function ParkingDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { parkingId, parkingName } = route.params;
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const { data, loading, error, refetch } = useQuery(GET_PARKING_DETAIL, {
    variables: { getParkingId: parkingId },
    fetchPolicy: "cache-and-network",
  });

  const formatCurrency = (amount) => {
    return `Rp ${amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
  };

  const formatTime = (time) => {
    if (!time) return "-";
    return time.substring(0, 5); // Format HH:MM
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#1E3A8A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Parking Details</Text>
          <View style={styles.headerRight} />
        </View>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FE7A3A" />
          <Text style={styles.loadingText}>Loading parking details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#1E3A8A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Parking Details</Text>
          <View style={styles.headerRight} />
        </View>

        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={60} color="#EF4444" />
          <Text style={styles.errorTitle}>Error Loading Details</Text>
          <Text style={styles.errorMessage}>{error.message}</Text>
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

  const parking = data?.getParking;
  if (!parking) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#1E3A8A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Parking Details</Text>
          <View style={styles.headerRight} />
        </View>

        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={60} color="#EF4444" />
          <Text style={styles.errorTitle}>Parking Not Found</Text>
          <Text style={styles.errorMessage}>
            The parking space you're looking for doesn't exist.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const images =
    parking.images && parking.images.length > 0
      ? parking.images
      : ["https://via.placeholder.com/400x200"];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1E3A8A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {parking.name}
        </Text>
        <TouchableOpacity style={styles.editButton}>
          <Ionicons name="create-outline" size={24} color="#1E3A8A" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Image Gallery */}
        <View style={styles.imageSection}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(event) => {
              const index = Math.round(
                event.nativeEvent.contentOffset.x / width
              );
              setSelectedImageIndex(index);
            }}
          >
            {images.map((image, index) => (
              <Image
                key={index}
                source={{ uri: image }}
                style={styles.parkingImage}
                defaultSource={require("../assets/logo.png")}
              />
            ))}
          </ScrollView>

          {/* Image Indicators */}
          {images.length > 1 && (
            <View style={styles.imageIndicators}>
              {images.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.indicator,
                    selectedImageIndex === index && styles.activeIndicator,
                  ]}
                />
              ))}
            </View>
          )}

          {/* Status Badge */}
          <View
            style={[
              styles.statusBadge,
              parking.status === "active"
                ? styles.activeBadge
                : styles.inactiveBadge,
            ]}
          >
            <Text style={styles.statusText}>
              {parking.status === "active" ? "Active" : "Inactive"}
            </Text>
          </View>
        </View>

        {/* Parking Info */}
        <View style={styles.infoSection}>
          <View style={styles.titleSection}>
            <Text style={styles.parkingName}>{parking.name}</Text>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={16} color="#F59E0B" />
              <Text style={styles.rating}>{parking.rating || "0.0"}</Text>
              <Text style={styles.reviewCount}>
                ({parking.review_count || 0} reviews)
              </Text>
            </View>
          </View>

          <View style={styles.locationSection}>
            <Ionicons name="location-outline" size={20} color="#6B7280" />
            <Text style={styles.address}>{parking.address}</Text>
          </View>

          {/* Owner Info */}
          {parking.owner && (
            <View style={styles.ownerSection}>
              <Text style={styles.sectionTitle}>Owner Information</Text>
              <View style={styles.ownerCard}>
                <View style={styles.ownerInfo}>
                  <Text style={styles.ownerName}>{parking.owner.name}</Text>
                  <Text style={styles.ownerEmail}>{parking.owner.email}</Text>
                  <View style={styles.ownerRole}>
                    <Ionicons
                      name="business-outline"
                      size={14}
                      color="#6B7280"
                    />
                    <Text style={styles.ownerRoleText}>
                      {parking.owner.role}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Capacity & Availability */}
          <View style={styles.capacitySection}>
            <Text style={styles.sectionTitle}>Capacity & Availability</Text>
            <View style={styles.capacityCards}>
              <View style={styles.capacityCard}>
                <Ionicons name="car-outline" size={24} color="#3B82F6" />
                <Text style={styles.capacityLabel}>Cars</Text>
                <Text style={styles.capacityValue}>
                  {parking.available?.car || 0}/{parking.capacity?.car || 0}
                </Text>
                <Text style={styles.capacitySubtext}>Available</Text>
              </View>
              <View style={styles.capacityCard}>
                <Ionicons name="bicycle-outline" size={24} color="#059669" />
                <Text style={styles.capacityLabel}>Motorcycles</Text>
                <Text style={styles.capacityValue}>
                  {parking.available?.motorcycle || 0}/
                  {parking.capacity?.motorcycle || 0}
                </Text>
                <Text style={styles.capacitySubtext}>Available</Text>
              </View>
            </View>
          </View>

          {/* Rates */}
          <View style={styles.ratesSection}>
            <Text style={styles.sectionTitle}>Rates</Text>
            <View style={styles.rateCards}>
              <View style={styles.rateCard}>
                <Ionicons name="car-outline" size={20} color="#3B82F6" />
                <Text style={styles.rateLabel}>Car</Text>
                <Text style={styles.rateValue}>
                  {formatCurrency(parking.rates?.car || 0)}/hour
                </Text>
              </View>
              <View style={styles.rateCard}>
                <Ionicons name="bicycle-outline" size={20} color="#059669" />
                <Text style={styles.rateLabel}>Motorcycle</Text>
                <Text style={styles.rateValue}>
                  {formatCurrency(parking.rates?.motorcycle || 0)}/hour
                </Text>
              </View>
            </View>
          </View>

          {/* Operational Hours */}
          <View style={styles.hoursSection}>
            <Text style={styles.sectionTitle}>Operational Hours</Text>
            <View style={styles.hoursCard}>
              <View style={styles.hourItem}>
                <Ionicons name="time-outline" size={20} color="#6B7280" />
                <Text style={styles.hourLabel}>Open</Text>
                <Text style={styles.hourValue}>
                  {formatTime(parking.operational_hours?.open)}
                </Text>
              </View>
              <View style={styles.hourItem}>
                <Ionicons name="time-outline" size={20} color="#6B7280" />
                <Text style={styles.hourLabel}>Close</Text>
                <Text style={styles.hourValue}>
                  {formatTime(parking.operational_hours?.close)}
                </Text>
              </View>
            </View>
          </View>

          {/* Facilities */}
          {parking.facilities && parking.facilities.length > 0 && (
            <View style={styles.facilitiesSection}>
              <Text style={styles.sectionTitle}>Facilities</Text>
              <View style={styles.facilitiesList}>
                {parking.facilities.map((facility, index) => (
                  <View key={index} style={styles.facilityItem}>
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color="#059669"
                    />
                    <Text style={styles.facilityText}>{facility}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.editActionButton}>
          <Ionicons name="create-outline" size={20} color="#FFF" />
          <Text style={styles.editActionText}>Edit Parking</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.viewStatsButton}>
          <Ionicons name="stats-chart-outline" size={20} color="#FE7A3A" />
          <Text style={styles.viewStatsText}>View Stats</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    color: "#1E3A8A",
    textAlign: "center",
    marginHorizontal: 10,
  },
  editButton: {
    padding: 8,
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  imageSection: {
    position: "relative",
  },
  parkingImage: {
    width: width,
    height: 250,
    resizeMode: "cover",
  },
  imageIndicators: {
    position: "absolute",
    bottom: 15,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    marginHorizontal: 4,
  },
  activeIndicator: {
    backgroundColor: "#FFF",
  },
  statusBadge: {
    position: "absolute",
    top: 15,
    right: 15,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  activeBadge: {
    backgroundColor: "rgba(16, 185, 129, 0.9)",
  },
  inactiveBadge: {
    backgroundColor: "rgba(156, 163, 175, 0.9)",
  },
  statusText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "600",
  },
  infoSection: {
    backgroundColor: "#FFF",
    padding: 20,
    marginTop: -20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  titleSection: {
    marginBottom: 15,
  },
  parkingName: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1E3A8A",
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  rating: {
    fontSize: 16,
    fontWeight: "600",
    color: "#F59E0B",
    marginLeft: 4,
  },
  reviewCount: {
    fontSize: 14,
    color: "#6B7280",
    marginLeft: 8,
  },
  locationSection: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  address: {
    flex: 1,
    fontSize: 16,
    color: "#6B7280",
    marginLeft: 8,
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E3A8A",
    marginBottom: 15,
  },
  ownerSection: {
    marginBottom: 25,
  },
  ownerCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  ownerInfo: {
    flex: 1,
  },
  ownerName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E3A8A",
    marginBottom: 4,
  },
  ownerEmail: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 8,
  },
  ownerRole: {
    flexDirection: "row",
    alignItems: "center",
  },
  ownerRoleText: {
    fontSize: 12,
    color: "#6B7280",
    marginLeft: 4,
    textTransform: "capitalize",
  },
  capacitySection: {
    marginBottom: 25,
  },
  capacityCards: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  capacityCard: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 15,
    alignItems: "center",
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  capacityLabel: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 8,
    marginBottom: 4,
  },
  capacityValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1E3A8A",
  },
  capacitySubtext: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  ratesSection: {
    marginBottom: 25,
  },
  rateCards: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  rateCard: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 15,
    alignItems: "center",
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  rateLabel: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 8,
    marginBottom: 4,
  },
  rateValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#059669",
    textAlign: "center",
  },
  hoursSection: {
    marginBottom: 25,
  },
  hoursCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  hourItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  hourLabel: {
    fontSize: 14,
    color: "#6B7280",
    marginLeft: 10,
    flex: 1,
  },
  hourValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E3A8A",
  },
  facilitiesSection: {
    marginBottom: 25,
  },
  facilitiesList: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  facilityItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  facilityText: {
    fontSize: 14,
    color: "#374151",
    marginLeft: 8,
  },
  actionButtons: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#FFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  editActionButton: {
    flex: 1,
    backgroundColor: "#FE7A3A",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    borderRadius: 12,
    marginRight: 8,
  },
  editActionText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  viewStatsButton: {
    flex: 1,
    backgroundColor: "#FFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    borderRadius: 12,
    marginLeft: 8,
    borderWidth: 2,
    borderColor: "#FE7A3A",
  },
  viewStatsText: {
    color: "#FE7A3A",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#6B7280",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1E3A8A",
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: "#FE7A3A",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  retryButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
