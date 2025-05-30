import React, { useState, useEffect, useContext } from "react";
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  FlatList,
  Dimensions,
  Button,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import * as Location from "expo-location";
import { gql, useQuery } from "@apollo/client";
import * as SecureStore from "expo-secure-store";
import { LinearGradient } from "expo-linear-gradient";
import { authContext } from "../context/authContext";

const GET_USER_PROFILE = gql`
  query GetUserProfile {
    getUserProfile {
      name
      email
      saldo
      role
    }
  }
`;

// Dummy data untuk nearby parking spots
const DUMMY_NEARBY_PARKING = [
  {
    id: "1",
    name: "Grand Mall Parking",
    address: "Jl. Raya Mall No. 123",
    distance: 0.5,
    availableSpots: 25,
    pricePerHour: 10000,
    rating: 4.5,
    image:
      "https://images.unsplash.com/photo-1545179605-1296651e9d43?q=80&w=400",
  },
  {
    id: "2",
    name: "Office Building Parking",
    address: "Jl. Raya Kantor No. 456",
    distance: 0.8,
    availableSpots: 10,
    pricePerHour: 8000,
    rating: 4.2,
    image:
      "https://images.unsplash.com/photo-1470224114660-3f6686c562eb?q=80&w=400",
  },
  {
    id: "3",
    name: "Public Park Parking",
    address: "Jl. Umum No. 789",
    distance: 1.2,
    availableSpots: 50,
    pricePerHour: 5000,
    rating: 3.8,
    image:
      "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?q=80&w=400",
  },
  {
    id: "4",
    name: "Central Plaza Parking",
    address: "Jl. Plaza Utama No. 15",
    distance: 1.5,
    availableSpots: 30,
    pricePerHour: 12000,
    rating: 4.7,
    image:
      "https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?q=80&w=400",
  },
];

// Dummy data untuk active bookings
const DUMMY_ACTIVE_BOOKINGS = [
  {
    id: "booking1",
    parkingName: "Grand Mall Parking",
    entryTime: "2023-11-15T10:30:00",
    vehicleNo: "B 1234 CD",
    status: "active",
  },
];

export default function HomeScreen() {
  const navigation = useNavigation();
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [nearbyParking, setNearbyParking] = useState(DUMMY_NEARBY_PARKING);
  const [activeBookings, setActiveBookings] = useState(DUMMY_ACTIVE_BOOKINGS);
  const { setIsSignIn } = useContext(authContext);

  // Get user profile data
  const { loading, error, data, refetch } = useQuery(GET_USER_PROFILE);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("Permission to access location was denied");
        return;
      }

      try {
        let location = await Location.getCurrentPositionAsync({});
        setLocation(location);
      } catch (error) {
        setErrorMsg("Error getting location");
        console.error(error);
      }
    })();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleSearchParking = () => {
    navigation.navigate("SearchParking", {
      initialLocation: location
        ? {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          }
        : null,
    });
  };

  const formatTimeRemaining = (entryTimeString) => {
    const entryTime = new Date(entryTimeString);
    const now = new Date();
    const diffMs = now - entryTime;
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${diffHrs}h ${diffMins}m`;
  };

  const handleScanQR = () => {
    // Navigate to scan QR screen
    navigation.navigate("ScanQRScreen");
  };

  const handleChat = () => {
    // Navigate to chat screen
    navigation.navigate("ChatScreen");
  };

  const handleTopUp = () => {
    // Navigate to topup screen
    navigation.navigate("TopUpScreen");
  };

  const handleBookings = () => {
    // Navigate to bookings screen
    navigation.navigate("BookingsScreen");
  };

  const handleParkingDetail = (parkingId) => {
    const parkingData = nearbyParking.find((spot) => spot.id === parkingId);
    navigation.navigate("ParkingDetailScreen", {
      parkingId,
      parkingData,
    });
  };

  const handleLogout = async () => {
    await SecureStore.deleteItemAsync("access_token");
    await SecureStore.deleteItemAsync("user_role");
    setIsSignIn(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <LinearGradient
          colors={["#FF9A62", "#FE7A3A"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.headerGradient}
        >
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>
                Hello,{" "}
                {loading
                  ? "..."
                  : error
                  ? "User"
                  : data?.getUserProfile?.name || "User"}
              </Text>
              <Text style={styles.tagline}>
                Find available parking near you
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate("ProfileScreen")}
              style={styles.profileButton}
            >
              <Ionicons
                name="person-circle-outline"
                size={40}
                color="#FFFFFF"
              />
            </TouchableOpacity>
          </View>

          {/* Balance Card */}
          <View style={styles.balanceCard}>
            <View>
              <Text style={styles.balanceLabel}>Your Balance</Text>
              <Text style={styles.balanceAmount}>
                {loading
                  ? "Loading..."
                  : error
                  ? "Error"
                  : `Rp ${(data?.getUserProfile?.saldo || 0).toLocaleString()}`}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.topUpButtonSmall}
              onPress={handleTopUp}
            >
              <Ionicons name="add-circle-outline" size={16} color="#FE7A3A" />
              <Text style={styles.topUpButtonSmallText}>Top Up</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Quick Menu */}
        <View style={styles.quickMenu}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleSearchParking}
          >
            <View style={[styles.menuIcon, { backgroundColor: "#E4F3FF" }]}>
              <Ionicons name="search" size={24} color="#1E3A8A" />
            </View>
            <Text style={styles.menuText}>Find Parking</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleScanQR}>
            <View style={[styles.menuIcon, { backgroundColor: "#FFF1E7" }]}>
              <Ionicons name="qr-code-outline" size={24} color="#FE7A3A" />
            </View>
            <Text style={styles.menuText}>Scan QR</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleTopUp}>
            <View style={[styles.menuIcon, { backgroundColor: "#EBF9EB" }]}>
              <Ionicons name="wallet-outline" size={24} color="#37A237" />
            </View>
            <Text style={styles.menuText}>Top Up</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleChat}>
            <View style={[styles.menuIcon, { backgroundColor: "#F3E8FF" }]}>
              <Ionicons name="chatbubble-outline" size={24} color="#9747FF" />
            </View>
            <Text style={styles.menuText}>Chat</Text>
          </TouchableOpacity>
        </View>

        {/* Active Booking Section */}
        {activeBookings.length > 0 && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Active Booking</Text>

            {activeBookings.map((booking) => (
              <TouchableOpacity
                key={booking.id}
                style={styles.activeBookingCard}
                onPress={() =>
                  navigation.navigate("BookingDetailsScreen", {
                    bookingId: booking.id,
                  })
                }
              >
                <View style={styles.activeBookingHeader}>
                  <View style={styles.activeBookingStatus}>
                    <View style={styles.statusDot} />
                    <Text style={styles.statusText}>Active</Text>
                  </View>
                  <Text style={styles.bookingTime}>
                    {formatTimeRemaining(booking.entryTime)}
                  </Text>
                </View>

                <Text style={styles.parkingNameText}>
                  {booking.parkingName}
                </Text>

                <View style={styles.bookingDetails}>
                  <View style={styles.bookingDetail}>
                    <Ionicons name="car-outline" size={18} color="#6B7280" />
                    <Text style={styles.bookingDetailText}>
                      {booking.vehicleNo}
                    </Text>
                  </View>
                  <View style={styles.bookingDetail}>
                    <Ionicons name="time-outline" size={18} color="#6B7280" />
                    <Text style={styles.bookingDetailText}>
                      {new Date(booking.entryTime).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                  </View>
                </View>

                <View style={styles.viewDetailsContainer}>
                  <Text style={styles.viewDetailsText}>View Details</Text>
                  <Ionicons name="chevron-forward" size={16} color="#FE7A3A" />
                </View>
                <Text onPress={handleLogout}> LOGOUT</Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={handleBookings}
            >
              <Text style={styles.viewAllText}>View All Bookings</Text>
              <Ionicons name="arrow-forward" size={16} color="#FE7A3A" />
            </TouchableOpacity>
          </View>
        )}

        {/* Nearby Parking Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Nearby Parking</Text>
            <TouchableOpacity onPress={handleSearchParking}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={nearbyParking}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.nearbyParkingList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.parkingCard}
                onPress={() => handleParkingDetail(item.id)}
              >
                <Image
                  source={{ uri: item.image }}
                  style={styles.parkingImage}
                  defaultSource={require("../assets/logo.png")}
                />
                <View style={styles.parkingCardContent}>
                  <Text style={styles.parkingCardName}>{item.name}</Text>
                  <Text style={styles.parkingCardAddress} numberOfLines={1}>
                    {item.address}
                  </Text>
                  <View style={styles.parkingCardDetails}>
                    <View style={styles.parkingCardDetail}>
                      <Ionicons
                        name="location-outline"
                        size={14}
                        color="#6B7280"
                      />
                      <Text style={styles.parkingCardDetailText}>
                        {item.distance} km
                      </Text>
                    </View>
                    <View style={styles.parkingCardDetail}>
                      <Ionicons name="car-outline" size={14} color="#6B7280" />
                      <Text style={styles.parkingCardDetailText}>
                        {item.availableSpots} spots
                      </Text>
                    </View>
                  </View>
                  <View style={styles.parkingCardPrice}>
                    <Text style={styles.parkingCardPriceValue}>
                      Rp {item.pricePerHour.toLocaleString()}
                    </Text>
                    <Text style={styles.parkingCardPriceUnit}>/hour</Text>
                  </View>
                </View>
                <View style={styles.ratingBadge}>
                  <Ionicons name="star" size={12} color="#FFF" />
                  <Text style={styles.ratingText}>{item.rating}</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionContainer}>
          <TouchableOpacity
            style={[styles.quickAction, styles.findParkingAction]}
            onPress={handleSearchParking}
          >
            <Ionicons name="search" size={24} color="#FFFFFF" />
            <Text style={styles.quickActionText}>Find Parking</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickAction, styles.scanAction]}
            onPress={handleScanQR}
          >
            <Ionicons name="qr-code" size={24} color="#FFFFFF" />
            <Text style={styles.quickActionText}>Scan to Park</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const { width } = Dimensions.get("window");
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  headerGradient: {
    paddingTop: 40,
    paddingBottom: 25,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  greeting: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  tagline: {
    fontSize: 16,
    color: "#FFFFFF",
    marginTop: 4,
    opacity: 0.9,
  },
  profileButton: {
    padding: 5,
  },
  balanceCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  balanceLabel: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 5,
  },
  balanceAmount: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1E3A8A",
  },
  topUpButtonSmall: {
    backgroundColor: "#FFF5F0",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  topUpButtonSmallText: {
    color: "#FE7A3A",
    fontWeight: "600",
    marginLeft: 4,
  },
  quickMenu: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: "white",
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  menuItem: {
    alignItems: "center",
    width: "23%",
  },
  menuIcon: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  menuText: {
    fontSize: 12,
    color: "#4B5563",
    fontWeight: "500",
  },
  sectionContainer: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 5,
    marginBottom: 10,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E3A8A",
  },
  seeAllText: {
    color: "#FE7A3A",
    fontWeight: "600",
    fontSize: 14,
  },
  activeBookingCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
  },
  activeBookingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  activeBookingStatus: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#10B981",
    marginRight: 5,
  },
  statusText: {
    color: "#10B981",
    fontWeight: "600",
    fontSize: 12,
  },
  bookingTime: {
    color: "#6B7280",
    fontSize: 14,
    fontWeight: "600",
  },
  parkingNameText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E3A8A",
    marginBottom: 10,
  },
  bookingDetails: {
    flexDirection: "row",
    marginBottom: 15,
  },
  bookingDetail: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 20,
  },
  bookingDetailText: {
    marginLeft: 5,
    color: "#6B7280",
    fontSize: 14,
  },
  viewDetailsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  viewDetailsText: {
    color: "#FE7A3A",
    fontWeight: "600",
    marginRight: 4,
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },
  viewAllText: {
    color: "#FE7A3A",
    fontWeight: "600",
    fontSize: 14,
    marginRight: 5,
  },
  nearbyParkingList: {
    paddingRight: 20,
    paddingBottom: 15,
  },
  parkingCard: {
    backgroundColor: "white",
    borderRadius: 16,
    width: width * 0.65,
    marginRight: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
    overflow: "hidden",
  },
  parkingImage: {
    width: "100%",
    height: 120,
    resizeMode: "cover",
  },
  parkingCardContent: {
    padding: 12,
  },
  parkingCardName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E3A8A",
    marginBottom: 4,
  },
  parkingCardAddress: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 8,
  },
  parkingCardDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  parkingCardDetail: {
    flexDirection: "row",
    alignItems: "center",
  },
  parkingCardDetailText: {
    fontSize: 12,
    color: "#6B7280",
    marginLeft: 3,
  },
  parkingCardPrice: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  parkingCardPriceValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FE7A3A",
  },
  parkingCardPriceUnit: {
    fontSize: 12,
    color: "#9CA3AF",
    marginLeft: 2,
  },
  ratingBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "#FE7A3A",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: "row",
    alignItems: "center",
  },
  ratingText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 2,
  },
  quickActionContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  quickAction: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 15,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 4,
  },
  findParkingAction: {
    backgroundColor: "#1E3A8A",
    marginRight: 10,
  },
  scanAction: {
    backgroundColor: "#FE7A3A",
    marginLeft: 10,
  },
  quickActionText: {
    color: "white",
    fontWeight: "700",
    fontSize: 14,
    marginLeft: 8,
  },
});
