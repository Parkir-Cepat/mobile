import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { gql, useQuery } from "@apollo/client";
import { format } from "date-fns";

const GET_PARKING_BOOKINGS = gql`
  query GetParkingBookings(
    $parkingId: ID!
    $status: String
    $limit: Int
    $offset: Int
  ) {
    getParkingBookings(
      parkingId: $parkingId
      status: $status
      limit: $limit
      offset: $offset
    ) {
      bookings {
        _id
        user {
          email
          name
        }
        parking {
          name
          address
          location {
            type
            coordinates
          }
        }
        vehicle_type
        start_time
        duration
        cost
        status
        created_at
      }
      total
      hasMore
      stats {
        totalBookings
        pendingCount
        confirmedCount
        activeCount
        completedCount
        cancelledCount
        totalRevenue
        todayBookings
      }
    }
  }
`;

const STATUS_OPTIONS = [
  { value: "all", label: "All", color: "#6B7280" },
  { value: "pending", label: "Pending", color: "#F59E0B" },
  { value: "confirmed", label: "Confirmed", color: "#3B82F6" },
  { value: "active", label: "Active", color: "#10B981" },
  { value: "completed", label: "Completed", color: "#059669" },
  { value: "cancelled", label: "Cancelled", color: "#EF4444" },
];

export default function BookingManagementScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { parkingId, parkingName, shouldRefresh, refreshTimestamp } =
    route.params;

  const [selectedStatus, setSelectedStatus] = useState("all");
  const [refreshing, setRefreshing] = useState(false);

  const { data, loading, error, refetch, fetchMore } = useQuery(
    GET_PARKING_BOOKINGS,
    {
      variables: {
        parkingId,
        status: selectedStatus === "all" ? null : selectedStatus,
        limit: 10,
        offset: 0,
      },
      fetchPolicy: "cache-and-network",
      notifyOnNetworkStatusChange: true,
    }
  );

  // ✅ ADD: Auto refresh when coming from successful scan
  React.useEffect(() => {
    if (shouldRefresh && refreshTimestamp) {
      console.log("🔄 Auto refreshing booking list after successful scan");
      handleRefresh();
    }
  }, [shouldRefresh, refreshTimestamp]);

  // ✅ ADD: Handle manual refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch({
        parkingId,
        status: selectedStatus === "all" ? null : selectedStatus,
        limit: 10,
        offset: 0,
      });
    } catch (error) {
      console.error("Refresh error:", error);
    } finally {
      setRefreshing(false);
    }
  };

  // ✅ UPDATE: Handle status filter change with refetch
  const handleStatusFilter = async (status) => {
    setSelectedStatus(status);
    setRefreshing(true);
    try {
      await refetch({
        parkingId,
        status: status === "all" ? null : status,
        limit: 10,
        offset: 0,
      });
    } catch (error) {
      console.error("Filter error:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const loadMore = () => {
    if (data?.getParkingBookings?.hasMore && !loading) {
      fetchMore({
        variables: {
          offset: data.getParkingBookings.bookings.length,
        },
        updateQuery: (prev, { fetchMoreResult }) => {
          if (!fetchMoreResult) return prev;

          return {
            getParkingBookings: {
              ...fetchMoreResult.getParkingBookings,
              bookings: [
                ...prev.getParkingBookings.bookings,
                ...fetchMoreResult.getParkingBookings.bookings,
              ],
            },
          };
        },
      });
    }
  };

  const formatCurrency = (amount) => {
    return `Rp ${amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
  };

  const formatDate = (dateString) => {
    try {
      // ✅ FIXED: Handle timestamp string or ISO string
      let date;

      // Check if it's a timestamp (number as string)
      if (/^\d+$/.test(dateString)) {
        // Convert timestamp to number and create date
        date = new Date(parseInt(dateString));
      } else {
        // Handle ISO string or other date formats
        date = new Date(dateString);
      }

      // Check if date is valid
      if (isNaN(date.getTime())) {
        return "Invalid date";
      }

      return format(date, "dd MMM yyyy, HH:mm");
    } catch (error) {
      console.error("Date formatting error:", error, "Input:", dateString);
      return "Invalid date";
    }
  };

  const getStatusStyle = (status) => {
    const statusOption = STATUS_OPTIONS.find((opt) => opt.value === status);
    return {
      backgroundColor: `${statusOption?.color}20`,
      borderColor: statusOption?.color,
      color: statusOption?.color,
    };
  };

  const renderBookingItem = ({ item }) => (
    <View style={styles.bookingCard}>
      <View style={styles.bookingHeader}>
        <View style={styles.userInfo}>
          <View style={styles.userAvatar}>
            <Text style={styles.userInitial}>
              {item.user?.name?.charAt(0)?.toUpperCase() || "?"}
            </Text>
          </View>
          <View>
            <Text style={styles.userName}>
              {item.user?.name || "Unknown User"}
            </Text>
            <Text style={styles.userEmail}>{item.user?.email}</Text>
          </View>
        </View>

        <View style={[styles.statusBadge, getStatusStyle(item.status)]}>
          <Text
            style={[
              styles.statusText,
              { color: getStatusStyle(item.status).color },
            ]}
          >
            {item.status}
          </Text>
        </View>
      </View>

      <View style={styles.bookingDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="car-outline" size={16} color="#6B7280" />
          <Text style={styles.detailText}>
            {item.vehicle_type?.charAt(0)?.toUpperCase() +
              item.vehicle_type?.slice(1)}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Ionicons name="time-outline" size={16} color="#6B7280" />
          <Text style={styles.detailText}>
            {formatDate(item.start_time)} ({item.duration}h)
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Ionicons name="cash-outline" size={16} color="#6B7280" />
          <Text style={styles.detailText}>{formatCurrency(item.cost)}</Text>
        </View>

        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={16} color="#6B7280" />
          <Text style={styles.detailText}>
            Booked: {formatDate(item.created_at)}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.viewDetailsButton}
        onPress={() => {
          // ✅ Pass current parkingId and parkingName
          navigation.navigate("BookingDetailsScreen", {
            booking: item,
            parkingName: parkingName,
            parkingId: parkingId, // Add this for easier navigation back
          });
        }}
      >
        <Text style={styles.viewDetailsText}>View Details</Text>
        <Ionicons name="chevron-forward-outline" size={16} color="#3B82F6" />
      </TouchableOpacity>
    </View>
  );

  const renderStatsCard = ({ label, value, icon, color }) => (
    <View style={[styles.statsCard, { backgroundColor: `${color}15` }]}>
      <View style={[styles.statsIcon, { backgroundColor: `${color}25` }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={[styles.statsValue, { color }]}>{value}</Text>
      <Text style={styles.statsLabel}>{label}</Text>
    </View>
  );

  const stats = data?.getParkingBookings?.stats;

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={60} color="#EF4444" />
          <Text style={styles.errorText}>Failed to load bookings</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => refetch()}
          >
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={["#10B981", "#059669"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>

          <View style={styles.headerTitle}>
            <Text style={styles.headerMainTitle}>Booking Management</Text>
            <Text style={styles.headerSubtitle}>{parkingName}</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Stats Overview */}
        {stats && (
          <View style={styles.statsSection}>
            <Text style={styles.sectionTitle}>Statistics Overview</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.statsRow}>
                {renderStatsCard({
                  label: "Total Bookings",
                  value: stats.totalBookings,
                  icon: "list-outline",
                  color: "#6B7280",
                })}
                {renderStatsCard({
                  label: "Total Revenue",
                  value: formatCurrency(stats.totalRevenue),
                  icon: "cash-outline",
                  color: "#059669",
                })}
                {renderStatsCard({
                  label: "Today",
                  value: stats.todayBookings,
                  icon: "today-outline",
                  color: "#3B82F6",
                })}
                {renderStatsCard({
                  label: "Active",
                  value: stats.activeCount,
                  icon: "checkmark-circle-outline",
                  color: "#10B981",
                })}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Status Filter */}
        <View style={styles.filterSection}>
          <Text style={styles.sectionTitle}>Filter by Status</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.filterRow}>
              {STATUS_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.filterButton,
                    selectedStatus === option.value &&
                      styles.activeFilterButton,
                    { borderColor: option.color },
                  ]}
                  onPress={() => handleStatusFilter(option.value)}
                >
                  <Text
                    style={[
                      styles.filterButtonText,
                      selectedStatus === option.value && {
                        color: option.color,
                      },
                    ]}
                  >
                    {option.label}
                  </Text>
                  {stats && (
                    <Text
                      style={[
                        styles.filterCount,
                        selectedStatus === option.value && {
                          color: option.color,
                        },
                      ]}
                    >
                      (
                      {option.value === "all"
                        ? stats.totalBookings
                        : stats[`${option.value}Count`] || 0}
                      )
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Bookings List */}
        <View style={styles.bookingsSection}>
          <Text style={styles.sectionTitle}>
            Bookings ({data?.getParkingBookings?.total || 0})
          </Text>

          {loading && !data ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#10B981" />
              <Text style={styles.loadingText}>Loading bookings...</Text>
            </View>
          ) : (
            <FlatList
              data={data?.getParkingBookings?.bookings || []}
              keyExtractor={(item) => item._id}
              renderItem={renderBookingItem}
              scrollEnabled={false}
              onEndReached={loadMore}
              onEndReachedThreshold={0.1}
              ListFooterComponent={() =>
                loading ? (
                  <ActivityIndicator
                    size="small"
                    color="#10B981"
                    style={styles.loadMoreIndicator}
                  />
                ) : null
              }
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Ionicons
                    name="clipboard-outline"
                    size={60}
                    color="#D1D5DB"
                  />
                  <Text style={styles.emptyStateTitle}>No Bookings Found</Text>
                  <Text style={styles.emptyStateDescription}>
                    No bookings match the selected filter criteria.
                  </Text>
                </View>
              }
            />
          )}
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
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  headerTitle: {
    flex: 1,
  },
  headerMainTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFF",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  statsSection: {
    marginTop: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 15,
  },
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: 5,
  },
  statsCard: {
    padding: 15,
    borderRadius: 12,
    marginRight: 15,
    minWidth: 120,
    alignItems: "center",
  },
  statsIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  statsValue: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  statsLabel: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
  },
  filterSection: {
    marginBottom: 20,
  },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 5,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFF",
    marginRight: 10,
  },
  activeFilterButton: {
    backgroundColor: "#F8FAFC",
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6B7280",
    marginRight: 4,
  },
  filterCount: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  bookingsSection: {
    paddingBottom: 30,
  },
  bookingCard: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  bookingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#10B981",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  userInitial: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 16,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
  },
  userEmail: {
    fontSize: 14,
    color: "#6B7280",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  bookingDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: "#4B5563",
    marginLeft: 8,
    flex: 1,
  },
  viewDetailsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  viewDetailsText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#3B82F6",
    marginRight: 4,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 10,
  },
  loadMoreIndicator: {
    marginVertical: 20,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
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
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#EF4444",
    marginTop: 16,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#EF4444",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: "#FFF",
    fontWeight: "600",
  },
});
