import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  StatusBar,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import * as Location from "expo-location";
import { gql, useQuery } from "@apollo/client";
import { LinearGradient } from "expo-linear-gradient";

const SEARCH_PARKING = gql`
  query SearchParking($query: String!, $latitude: Float, $longitude: Float) {
    searchParkingSpots(
      query: $query
      latitude: $latitude
      longitude: $longitude
    ) {
      id
      name
      address
      latitude
      longitude
      availableSpots
      pricePerHour
      distance
      rating
      totalReviews
    }
  }
`;

export default function SearchParkingScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { initialLocation } = route.params || {};

  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useState(initialLocation);
  const [selectedParking, setSelectedParking] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  const [parkingSpots, setParkingSpots] = useState([]);

  useEffect(() => {
    if (!location) {
      (async () => {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          console.error("Location permission denied");
          return;
        }

        try {
          const currentLocation = await Location.getCurrentPositionAsync({});
          setLocation({
            latitude: currentLocation.coords.latitude,
            longitude: currentLocation.coords.longitude,
          });
        } catch (error) {
          console.error("Error getting location:", error);
        }
      })();
    }
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);

    try {
      // Simulasi API call (ganti dengan pemanggilan GraphQL yang sebenarnya)
      // Dalam kasus nyata, ini adalah tempat untuk memanggil query SEARCH_PARKING
      setTimeout(() => {
        const mockResults = [
          {
            id: "1",
            name: "Mall Parking",
            address: "Jl. Raya Mall No. 123",
            latitude: location.latitude + 0.002,
            longitude: location.longitude + 0.002,
            availableSpots: 25,
            pricePerHour: 10000,
            distance: 0.5,
            rating: 4.5,
            totalReviews: 120,
          },
          {
            id: "2",
            name: "Office Parking",
            address: "Jl. Raya Kantor No. 456",
            latitude: location.latitude - 0.001,
            longitude: location.longitude + 0.001,
            availableSpots: 10,
            pricePerHour: 8000,
            distance: 0.8,
            rating: 4.2,
            totalReviews: 85,
          },
          {
            id: "3",
            name: "Public Parking",
            address: "Jl. Umum No. 789",
            latitude: location.latitude + 0.001,
            longitude: location.longitude - 0.002,
            availableSpots: 50,
            pricePerHour: 5000,
            distance: 1.2,
            rating: 3.8,
            totalReviews: 230,
          },
        ];

        setParkingSpots(mockResults);
        setIsSearching(false);
      }, 1500);
    } catch (error) {
      console.error("Error searching parking spots:", error);
      setIsSearching(false);
    }
  };

  const handleSelectParking = (parking) => {
    setSelectedParking(parking);
  };

  const handleBookParking = () => {
    if (selectedParking) {
      navigation.navigate("ParkingDetailScreen", {
        parkingId: selectedParking.id,
        parkingData: selectedParking,
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header with Gradient */}
      <LinearGradient
        colors={["#FE7A3A", "#FF9A62"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Find Parking</Text>
          <View style={{ width: 24 }} /> {/* Empty view for layout balance */}
        </View>

        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#6B7280" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search area or place name..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
              onSubmitEditing={handleSearch}
              placeholderTextColor="#9CA3AF"
            />
          </View>
          <TouchableOpacity style={styles.filterButton}>
            <Ionicons name="options-outline" size={20} color="#FE7A3A" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View style={styles.mapContainer}>
        {location ? (
          <MapView
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            region={{
              latitude: selectedParking
                ? selectedParking.latitude
                : location.latitude,
              longitude: selectedParking
                ? selectedParking.longitude
                : location.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            showsUserLocation={true}
            showsMyLocationButton={true}
          >
            {/* Current location marker */}
            <Marker
              coordinate={{
                latitude: location.latitude,
                longitude: location.longitude,
              }}
              title="Your location"
              pinColor="#1E3A8A"
            >
              <View style={styles.customMarker}>
                <View style={styles.markerDot} />
                <View style={styles.markerRing} />
              </View>
            </Marker>

            {/* Parking spots markers */}
            {parkingSpots.map((spot) => (
              <Marker
                key={spot.id}
                coordinate={{
                  latitude: spot.latitude,
                  longitude: spot.longitude,
                }}
                title={spot.name}
                description={`${spot.availableSpots} spots • Rp${spot.pricePerHour}/hour`}
                onPress={() => handleSelectParking(spot)}
              >
                <View
                  style={[
                    styles.parkingMarker,
                    selectedParking?.id === spot.id
                      ? styles.selectedParkingMarker
                      : {},
                  ]}
                >
                  <Ionicons
                    name="car"
                    size={14}
                    color={
                      selectedParking?.id === spot.id ? "#FFFFFF" : "#FE7A3A"
                    }
                  />
                </View>
              </Marker>
            ))}
          </MapView>
        ) : (
          <View style={[styles.map, styles.loadingContainer]}>
            <ActivityIndicator size="large" color="#FE7A3A" />
          </View>
        )}
      </View>

      <View style={styles.resultsContainer}>
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsTitle}>
            {isSearching
              ? "Searching..."
              : parkingSpots.length > 0
              ? `${parkingSpots.length} Parking Spots Found`
              : "Search for parking spots"}
          </Text>

          {parkingSpots.length > 0 && (
            <TouchableOpacity style={styles.sortButton}>
              <Ionicons name="filter-outline" size={16} color="#6B7280" />
              <Text style={styles.sortButtonText}>Sort</Text>
            </TouchableOpacity>
          )}
        </View>

        {isSearching ? (
          <ActivityIndicator style={styles.loadingIndicator} color="#FE7A3A" />
        ) : (
          <FlatList
            data={parkingSpots}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.parkingItem,
                  selectedParking?.id === item.id && styles.selectedParkingItem,
                ]}
                onPress={() => handleSelectParking(item)}
              >
                <View style={styles.parkingImageContainer}>
                  <View style={styles.parkingAvailability}>
                    <Text style={styles.availabilityText}>
                      {item.availableSpots}
                    </Text>
                  </View>
                  <Image
                    source={{
                      uri: `https://source.unsplash.com/random/100x100/?parking,${item.id}`,
                    }}
                    style={styles.parkingItemImage}
                  />
                </View>

                <View style={styles.parkingInfo}>
                  <Text style={styles.parkingName}>{item.name}</Text>
                  <Text style={styles.parkingAddress}>{item.address}</Text>
                  <View style={styles.parkingDetails}>
                    <View style={styles.detailItem}>
                      <Ionicons name="star" size={16} color="#F59E0B" />
                      <Text style={styles.detailText}>
                        {item.rating} ({item.totalReviews})
                      </Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Ionicons name="location" size={16} color="#6B7280" />
                      <Text style={styles.detailText}>{item.distance} km</Text>
                    </View>
                  </View>
                  <View style={styles.parkingPrice}>
                    <Text style={styles.priceValue}>Rp{item.pricePerHour}</Text>
                    <Text style={styles.priceUnit}>/hour</Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              !isSearching && (
                <View style={styles.emptyState}>
                  <Ionicons name="car-outline" size={60} color="#E5E7EB" />
                  <Text style={styles.emptyStateText}>
                    No parking spots found
                  </Text>
                  <Text style={styles.emptyStateSubtext}>
                    Try another search term or location
                  </Text>
                  <TouchableOpacity
                    style={styles.searchNearbyButton}
                    onPress={() => handleSearch()}
                  >
                    <Text style={styles.searchNearbyText}>Search Nearby</Text>
                  </TouchableOpacity>
                </View>
              )
            }
            contentContainerStyle={
              parkingSpots.length === 0 ? { flex: 1 } : { paddingBottom: 100 }
            }
          />
        )}
      </View>

      {selectedParking && (
        <View style={styles.bookingContainer}>
          <View style={styles.selectedParkingInfo}>
            <View>
              <Text style={styles.selectedParkingName}>
                {selectedParking.name}
              </Text>
              <View style={styles.selectedParkingDetails}>
                <Ionicons name="car-outline" size={14} color="#6B7280" />
                <Text style={styles.selectedDetailText}>
                  {selectedParking.availableSpots} spots
                </Text>
                <View style={styles.detailSeparator} />
                <Ionicons name="star" size={14} color="#F59E0B" />
                <Text style={styles.selectedDetailText}>
                  {selectedParking.rating}
                </Text>
              </View>
            </View>
            <View style={styles.selectedPriceContainer}>
              <Text style={styles.selectedPriceValue}>
                Rp{selectedParking.pricePerHour}
              </Text>
              <Text style={styles.selectedPriceUnit}>/hour</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.bookButton}
            onPress={handleBookParking}
          >
            <LinearGradient
              colors={["#FE7A3A", "#FF9A62"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.bookButtonGradient}
            >
              <Text style={styles.bookButtonText}>Book Now</Text>
              <Ionicons
                name="arrow-forward"
                size={18}
                color="#FFFFFF"
                style={styles.bookButtonIcon}
              />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  headerGradient: {
    paddingTop: 40,
    paddingBottom: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15,
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
  searchContainer: {
    flexDirection: "row",
    paddingHorizontal: 15,
    alignItems: "center",
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginRight: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: "#374151",
  },
  filterButton: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mapContainer: {
    height: 280,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  map: {
    width: "100%",
    height: "100%",
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
  },
  customMarker: {
    alignItems: "center",
    justifyContent: "center",
  },
  markerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#1E3A8A",
    borderWidth: 2,
    borderColor: "white",
  },
  markerRing: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(30, 58, 138, 0.15)",
    position: "absolute",
  },
  parkingMarker: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 2,
    borderColor: "#FE7A3A",
  },
  selectedParkingMarker: {
    backgroundColor: "#FE7A3A",
    transform: [{ scale: 1.1 }],
    zIndex: 999,
  },
  resultsContainer: {
    flex: 1,
    backgroundColor: "white",
    paddingHorizontal: 15,
    paddingTop: 20,
  },
  resultsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
  },
  sortButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  sortButtonText: {
    marginLeft: 4,
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  loadingIndicator: {
    marginVertical: 30,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#6B7280",
    marginTop: 15,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#9CA3AF",
    marginTop: 5,
    marginBottom: 20,
  },
  searchNearbyButton: {
    backgroundColor: "#F3F4F6",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  searchNearbyText: {
    color: "#1E3A8A",
    fontWeight: "600",
  },
  parkingItem: {
    flexDirection: "row",
    borderRadius: 16,
    backgroundColor: "white",
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    overflow: "hidden",
  },
  selectedParkingItem: {
    borderColor: "#FE7A3A",
    backgroundColor: "#FFF8F5",
  },
  parkingImageContainer: {
    width: 100,
    height: 120,
    position: "relative",
  },
  parkingItemImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  parkingAvailability: {
    position: "absolute",
    bottom: 8,
    left: 8,
    backgroundColor: "rgba(30, 58, 138, 0.8)",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 12,
    zIndex: 1,
  },
  availabilityText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  parkingInfo: {
    flex: 1,
    padding: 12,
    justifyContent: "space-between",
  },
  parkingName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E3A8A",
    marginBottom: 4,
  },
  parkingAddress: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 8,
  },
  parkingDetails: {
    flexDirection: "row",
    marginBottom: 10,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 15,
  },
  detailText: {
    fontSize: 13,
    color: "#6B7280",
    marginLeft: 5,
  },
  parkingPrice: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  priceValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FE7A3A",
  },
  priceUnit: {
    fontSize: 12,
    color: "#9CA3AF",
    marginLeft: 2,
  },
  bookingContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "white",
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 10,
  },
  selectedParkingInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  selectedParkingName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E3A8A",
    marginBottom: 5,
  },
  selectedParkingDetails: {
    flexDirection: "row",
    alignItems: "center",
  },
  selectedDetailText: {
    fontSize: 13,
    color: "#6B7280",
    marginLeft: 5,
  },
  detailSeparator: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "#D1D5DB",
    marginHorizontal: 8,
  },
  selectedPriceContainer: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  selectedPriceValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FE7A3A",
  },
  selectedPriceUnit: {
    fontSize: 13,
    color: "#9CA3AF",
    marginLeft: 2,
  },
  bookButton: {
    overflow: "hidden",
    borderRadius: 12,
    shadowColor: "#FE7A3A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  bookButtonGradient: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
  },
  bookButtonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 16,
  },
  bookButtonIcon: {
    marginLeft: 5,
  },
});
