import React, { useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  Animated,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

const ParkingCard = ({ item, onPress, formatDistance }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.95,
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 0.3,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <Animated.View
      style={[
        styles.parkingCard,
        {
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        <View style={styles.imageContainer}>
          <Image
            source={{
              uri:
                item.images?.[0] ||
                "https://via.placeholder.com/400x200?text=Parking",
            }}
            style={styles.parkingImage}
          />
          <Animated.View
            style={[
              styles.imageOverlay,
              {
                opacity: overlayOpacity,
              },
            ]}
          />
        </View>

        <View style={styles.parkingCardContent}>
          <Text style={styles.parkingCardName}>{item.name}</Text>
          <Text style={styles.parkingCardAddress} numberOfLines={1}>
            {item.address}
          </Text>
          <View style={styles.parkingCardDetails}>
            <View style={styles.parkingCardDetail}>
              <Ionicons name="location-outline" size={14} color="#6B7280" />
              <Text style={styles.parkingCardDetailText}>
                {formatDistance(item.calculatedDistance)}
              </Text>
            </View>
            <View style={styles.parkingCardDetail}>
              <Ionicons name="car-outline" size={14} color="#6B7280" />
              <Text style={styles.parkingCardDetailText}>
                {(item.capacity?.car || 0) - (item.available?.car || 0)}/
                {item.capacity?.car || 0} cars
              </Text>
            </View>
          </View>
          <View style={styles.parkingCardDetails}>
            <View style={styles.parkingCardDetail}>
              <Ionicons name="time-outline" size={14} color="#6B7280" />
              <Text style={styles.parkingCardDetailText}>
                {item.operational_hours?.open || "00:00"} -{" "}
                {item.operational_hours?.close || "23:59"}
              </Text>
            </View>
            <View style={styles.parkingCardDetail}>
              <Ionicons name="bicycle-outline" size={14} color="#6B7280" />
              <Text style={styles.parkingCardDetailText}>
                {(item.capacity?.motorcycle || 0) -
                  (item.available?.motorcycle || 0)}
                /{item.capacity?.motorcycle || 0} bikes
              </Text>
            </View>
          </View>
          <View style={styles.parkingCardPrice}>
            <Text style={styles.parkingCardPriceValue}>
              Rp {(item.rates?.car || 0).toLocaleString()}
            </Text>
            <Text style={styles.parkingCardPriceUnit}>/hour</Text>
          </View>
        </View>

        <View style={styles.ratingBadge}>
          <Ionicons name="star" size={12} color="#FFF" />
          <Text style={styles.ratingText}>{item.rating || "0.0"}</Text>
        </View>

        {item.calculatedDistance < 1 && (
          <View style={styles.nearBadge}>
            <Text style={styles.nearBadgeText}>Near</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
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
  imageContainer: {
    position: "relative",
  },
  parkingImage: {
    width: "100%",
    height: 120,
    resizeMode: "cover",
  },
  imageOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#000000",
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
  nearBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "#10B981",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  nearBadgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "600",
  },
});

export default ParkingCard;
