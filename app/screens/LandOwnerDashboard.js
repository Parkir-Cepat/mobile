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
  FlatList,
  Modal,
  Alert,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";

// Dummy data untuk owner
const OWNER_DATA = {
  name: "John Doe",
  profilePic: "https://randomuser.me/api/portraits/men/32.jpg",
  balance: 3250000,
  totalParkingSpots: 48,
  totalTransactions: 320,
  rating: 4.8,
};

// Dummy data untuk lahan parkir
const DUMMY_LANDS = [
  {
    id: "1",
    name: "Central Business District Parking",
    address: "Jl. Sudirman No. 123, Jakarta",
    totalSpots: 25,
    availableSpots: 10,
    hourlyRate: 15000,
    income: 2150000,
    rating: 4.7,
    image: "https://images.unsplash.com/photo-1470224114660-3f6686c562eb?w=600",
    status: "active",
    transactions: 145,
    lastUpdated: "2023-11-15T10:30:00",
  },
  {
    id: "2",
    name: "Mall Parking Area",
    address: "Jl. Thamrin No. 45, Jakarta",
    totalSpots: 15,
    availableSpots: 5,
    hourlyRate: 10000,
    income: 850000,
    rating: 4.5,
    image: "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=600",
    status: "active",
    transactions: 85,
    lastUpdated: "2023-11-14T08:45:00",
  },
  {
    id: "3",
    name: "Office Complex Parking",
    address: "Jl. Gatot Subroto No. 72, Jakarta",
    totalSpots: 8,
    availableSpots: 0,
    hourlyRate: 12000,
    income: 250000,
    rating: 4.3,
    image: "https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?w=600",
    status: "inactive",
    transactions: 32,
    lastUpdated: "2023-11-10T14:20:00",
  },
];

export default function LandOwnerDashboard() {
  const navigation = useNavigation();
  const [lands, setLands] = useState(DUMMY_LANDS);
  const [refreshing, setRefreshing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedLand, setSelectedLand] = useState(null);
  const [statsView, setStatsView] = useState("income"); // 'income' or 'traffic'

  useEffect(() => {
    // This would be replaced with an actual API call
    // to fetch land owner data and their parking lands
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    // This would typically be an API call to refresh data
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  };

  const handleDeleteLand = (land) => {
    setSelectedLand(land);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    const updatedLands = lands.filter((land) => land.id !== selectedLand.id);
    setLands(updatedLands);
    setShowDeleteConfirm(false);
    Alert.alert("Success", `"${selectedLand.name}" has been deleted`);
    setSelectedLand(null);
  };

  const handleAddNewLand = () => {
    navigation.navigate("AddNewLandScreen");
  };

  const handleEditLand = (land) => {
    navigation.navigate("EditLandScreen", { landId: land.id });
  };

  const handleViewDetails = (land) => {
    navigation.navigate("LandDetailScreen", { landId: land.id });
  };

  const formatCurrency = (amount) => {
    return `Rp ${amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
  };

  const getTotalIncome = () => {
    return lands.reduce((sum, land) => sum + land.income, 0);
  };

  const getTotalTransactions = () => {
    return lands.reduce((sum, land) => sum + land.transactions, 0);
  };

  const renderLandItem = ({ item }) => (
    <View style={styles.landCard}>
      <TouchableOpacity
        style={styles.landCardInner}
        onPress={() => handleViewDetails(item)}
        activeOpacity={0.7}
      >
        <Image
          source={{ uri: item.image }}
          style={styles.landImage}
          defaultSource={require("../assets/logo.png")}
        />

        <View
          style={[
            styles.statusBadge,
            item.status === "active"
              ? styles.activeBadge
              : styles.inactiveBadge,
          ]}
        >
          <Text style={styles.statusText}>
            {item.status === "active" ? "Active" : "Inactive"}
          </Text>
        </View>

        <View style={styles.landContent}>
          <Text style={styles.landName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.landAddress} numberOfLines={1}>
            {item.address}
          </Text>

          <View style={styles.landStats}>
            <View style={styles.landStat}>
              <Ionicons name="car-outline" size={14} color="#4B5563" />
              <Text style={styles.landStatText}>
                {item.availableSpots}/{item.totalSpots} spots
              </Text>
            </View>
            <View style={styles.landStat}>
              <Ionicons name="cash-outline" size={14} color="#4B5563" />
              <Text style={styles.landStatText}>
                {formatCurrency(item.hourlyRate)}/h
              </Text>
            </View>
          </View>

          <View style={styles.landFooter}>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={14} color="#F59E0B" />
              <Text style={styles.ratingText}>{item.rating}</Text>
            </View>

            <Text style={styles.incomeText}>{formatCurrency(item.income)}</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Memindahkan action buttons ke bagian bawah card */}
      <View style={styles.cardFooter}>
        <TouchableOpacity
          style={styles.detailsButton}
          onPress={() => handleViewDetails(item)}
        >
          <Ionicons name="eye-outline" size={14} color="#4B5563" />
          <Text style={styles.detailsButtonText}>Details</Text>
        </TouchableOpacity>

        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={() => handleEditLand(item)}
          >
            <Ionicons name="create-outline" size={16} color="#FFF" />
            <Text style={styles.actionButtonText}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDeleteLand(item)}
          >
            <Ionicons name="trash-outline" size={16} color="#FFF" />
            <Text style={styles.actionButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <LinearGradient
        colors={["#FE7A3A", "#FF9A62"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <View style={styles.profileSection}>
          <View style={styles.profileLeft}>
            <Image
              source={{ uri: OWNER_DATA.profilePic }}
              style={styles.profilePic}
            />
            <View>
              <Text style={styles.greeting}>Hello,</Text>
              <Text style={styles.ownerName}>{OWNER_DATA.name}</Text>
              <View style={styles.roleBadge}>
                <Ionicons name="business-outline" size={12} color="#FFF" />
                <Text style={styles.roleText}>Land Owner</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity style={styles.notifButton}>
            <Ionicons name="notifications-outline" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.balanceCard}>
          <View>
            <Text style={styles.balanceLabel}>Total Balance</Text>
            <Text style={styles.balanceAmount}>
              {formatCurrency(OWNER_DATA.balance)}
            </Text>
          </View>
          <TouchableOpacity style={styles.withdrawButton}>
            <Ionicons name="cash-outline" size={18} color="#FE7A3A" />
            <Text style={styles.withdrawText}>Withdraw</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Stats Overview */}
        <View style={styles.statsSection}>
          <View style={styles.statsHeader}>
            <Text style={styles.sectionTitle}>Stats Overview</Text>
            <View style={styles.statsToggle}>
              <TouchableOpacity
                style={[
                  styles.statsToggleButton,
                  statsView === "income" && styles.activeStatsToggle,
                ]}
                onPress={() => setStatsView("income")}
              >
                <Text
                  style={[
                    styles.statsToggleText,
                    statsView === "income" && styles.activeStatsToggleText,
                  ]}
                >
                  Income
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.statsToggleButton,
                  statsView === "traffic" && styles.activeStatsToggle,
                ]}
                onPress={() => setStatsView("traffic")}
              >
                <Text
                  style={[
                    styles.statsToggleText,
                    statsView === "traffic" && styles.activeStatsToggleText,
                  ]}
                >
                  Traffic
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.statsCards}>
            {statsView === "income" ? (
              <>
                <View
                  style={[styles.statsCard, { backgroundColor: "#FFF5F0" }]}
                >
                  <View
                    style={[styles.statsIconBg, { backgroundColor: "#FDDED3" }]}
                  >
                    <Ionicons name="cash-outline" size={24} color="#FE7A3A" />
                  </View>
                  <Text style={styles.statsValue}>
                    {formatCurrency(getTotalIncome())}
                  </Text>
                  <Text style={styles.statsLabel}>Total Income</Text>
                </View>

                <View
                  style={[styles.statsCard, { backgroundColor: "#EDF5FF" }]}
                >
                  <View
                    style={[styles.statsIconBg, { backgroundColor: "#D7E8FF" }]}
                  >
                    <Ionicons name="card-outline" size={24} color="#1E3A8A" />
                  </View>
                  <Text style={styles.statsValue}>
                    {formatCurrency(OWNER_DATA.balance)}
                  </Text>
                  <Text style={styles.statsLabel}>Current Balance</Text>
                </View>
              </>
            ) : (
              <>
                <View
                  style={[styles.statsCard, { backgroundColor: "#F3F9FF" }]}
                >
                  <View
                    style={[styles.statsIconBg, { backgroundColor: "#D9EDFF" }]}
                  >
                    <Ionicons name="car-outline" size={24} color="#2563EB" />
                  </View>
                  <Text style={styles.statsValue}>
                    {getTotalTransactions()}
                  </Text>
                  <Text style={styles.statsLabel}>Total Bookings</Text>
                </View>

                <View
                  style={[styles.statsCard, { backgroundColor: "#F0FFF4" }]}
                >
                  <View
                    style={[styles.statsIconBg, { backgroundColor: "#DBFDE6" }]}
                  >
                    <Ionicons name="star-outline" size={24} color="#059669" />
                  </View>
                  <Text style={styles.statsValue}>{OWNER_DATA.rating}</Text>
                  <Text style={styles.statsLabel}>Average Rating</Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* My Parking Lands */}
        <View style={styles.landsSection}>
          <View style={styles.landsSectionHeader}>
            <Text style={styles.sectionTitle}>My Parking Lands</Text>
            <Text style={styles.landCount}>{lands.length} lands</Text>
          </View>

          <FlatList
            data={lands}
            keyExtractor={(item) => item.id}
            renderItem={renderLandItem}
            scrollEnabled={false}
            contentContainerStyle={styles.landsList}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="car-outline" size={60} color="#D1D5DB" />
                <Text style={styles.emptyStateTitle}>No Parking Lands</Text>
                <Text style={styles.emptyStateDescription}>
                  You haven't added any parking lands yet.
                </Text>
              </View>
            }
          />

          <TouchableOpacity style={styles.addButton} onPress={handleAddNewLand}>
            <LinearGradient
              colors={["#FE7A3A", "#FF9A62"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.addButtonGradient}
            >
              <Ionicons name="add" size={24} color="#FFF" />
              <Text style={styles.addButtonText}>Add New Parking Land</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Delete Confirmation Modal */}
      <Modal visible={showDeleteConfirm} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons name="alert-circle-outline" size={60} color="#EF4444" />
            <Text style={styles.modalTitle}>Delete Parking Land</Text>
            <Text style={styles.modalDescription}>
              Are you sure you want to delete "{selectedLand?.name}"? This
              action cannot be undone.
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowDeleteConfirm(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.deleteConfirmButton]}
                onPress={confirmDelete}
              >
                <Text style={styles.deleteConfirmText}>Delete</Text>
              </TouchableOpacity>
            </View>
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
    paddingTop: 50,
    paddingBottom: 25,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  profileSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  profileLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  profilePic: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  greeting: {
    fontSize: 14,
    color: "#FFFFFF",
    opacity: 0.9,
  },
  ownerName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  roleBadge: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    alignItems: "center",
  },
  roleText: {
    color: "#FFFFFF",
    fontSize: 12,
    marginLeft: 4,
  },
  notifButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  balanceCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
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
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1E3A8A",
  },
  withdrawButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF5F0",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  withdrawText: {
    color: "#FE7A3A",
    fontWeight: "600",
    marginLeft: 6,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  statsSection: {
    marginTop: 25,
    marginBottom: 15,
  },
  statsHeader: {
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
  statsToggle: {
    flexDirection: "row",
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    padding: 2,
  },
  statsToggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  activeStatsToggle: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statsToggleText: {
    color: "#6B7280",
    fontWeight: "500",
    fontSize: 13,
  },
  activeStatsToggleText: {
    color: "#1E3A8A",
    fontWeight: "600",
  },
  statsCards: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statsCard: {
    width: "48%",
    borderRadius: 16,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statsIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  statsValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 4,
  },
  statsLabel: {
    fontSize: 13,
    color: "#6B7280",
  },
  landsSection: {
    marginTop: 10,
    paddingBottom: 30,
  },
  landsSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  landCount: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  landsList: {
    paddingBottom: 10,
  },
  landCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
    overflow: "hidden",
  },
  landCardInner: {
    flexDirection: "row",
  },
  landImage: {
    width: 100,
    height: 100, // Sesuaikan tinggi gambar
    borderTopLeftRadius: 16,
  },
  statusBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    zIndex: 10,
  },
  activeBadge: {
    backgroundColor: "rgba(16, 185, 129, 0.8)",
  },
  inactiveBadge: {
    backgroundColor: "rgba(156, 163, 175, 0.8)",
  },
  statusText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "600",
  },
  landContent: {
    flex: 1,
    padding: 12,
    justifyContent: "space-between",
  },
  landName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E3A8A",
    marginBottom: 4,
  },
  landAddress: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 8,
  },
  landStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  landStat: {
    flexDirection: "row",
    alignItems: "center",
  },
  landStatText: {
    fontSize: 12,
    color: "#6B7280",
    marginLeft: 4,
  },
  landFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#D97706",
    marginLeft: 2,
  },
  incomeText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#059669",
  },
  // Gaya baru untuk footer card
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  detailsButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  detailsButtonText: {
    color: "#4B5563",
    fontSize: 12,
    fontWeight: "500",
    marginLeft: 4,
  },
  actionButtonsContainer: {
    flexDirection: "row",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginLeft: 8,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
    marginLeft: 4,
  },
  editButton: {
    backgroundColor: "#3B82F6",
  },
  deleteButton: {
    backgroundColor: "#EF4444",
  },
  addButton: {
    shadowColor: "#FE7A3A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 5,
  },
  addButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
    marginLeft: 8,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    borderStyle: "dashed",
    borderRadius: 16,
    marginBottom: 20,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#4B5563",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateDescription: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
    paddingHorizontal: 30,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1E293B",
    marginTop: 16,
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  modalButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: "#F3F4F6",
    marginRight: 8,
  },
  deleteConfirmButton: {
    backgroundColor: "#EF4444",
    marginLeft: 8,
  },
  cancelButtonText: {
    color: "#4B5563",
    fontWeight: "600",
    fontSize: 16,
  },
  deleteConfirmText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },
});
