import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Platform,
  KeyboardAvoidingView,
  Alert,
  ActivityIndicator,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { gql, useMutation } from "@apollo/client";

// This would normally be a real mutation
const ADD_PARKING_MUTATION = gql`
  mutation AddParking($input: ParkingInput!) {
    addParking(input: $input) {
      id
      name
    }
  }
`;

export default function AddNewLandScreen() {
  const navigation = useNavigation();

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState([]);
  const [startHour, setStartHour] = useState(new Date());
  const [endHour, setEndHour] = useState(new Date());
  const [location, setLocation] = useState({
    latitude: -6.2088, // Default to Jakarta
    longitude: 106.8456,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const [totalSlots, setTotalSlots] = useState("");
  const [tariff, setTariff] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // UI state
  const [errors, setErrors] = useState({});
  const [isStartTimePickerVisible, setStartTimePickerVisible] = useState(false);
  const [isEndTimePickerVisible, setEndTimePickerVisible] = useState(false);
  const [isMapModalVisible, setMapModalVisible] = useState(false);

  // Mock mutation - would be replaced with actual Apollo mutation
  const [addParking] = useMutation(ADD_PARKING_MUTATION);

  // Request permissions on component mount
  useEffect(() => {
    (async () => {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Sorry, we need camera roll permissions to add images!"
        );
      }
    })();
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const handleStartTimeConfirm = (time) => {
    setStartHour(time);
    setStartTimePickerVisible(false);
  };

  const handleEndTimeConfirm = (time) => {
    setEndHour(time);
    setEndTimePickerVisible(false);
  };

  const handleMapConfirm = () => {
    setMapModalVisible(false);
  };

  const pickImage = async () => {
    // Don't allow more than 5 images
    if (images.length >= 5) {
      Alert.alert("Limit Reached", "Maximum 5 images allowed");
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets[0]) {
      setImages([...images, result.assets[0].uri]);
    }
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!name.trim()) newErrors.name = "Name is required";
    if (!description.trim()) newErrors.description = "Description is required";
    if (images.length === 0)
      newErrors.images = "At least one image is required";

    // Check if total_slots is a positive number
    const totalSlotsNum = parseInt(totalSlots);
    if (isNaN(totalSlotsNum) || totalSlotsNum <= 0) {
      newErrors.totalSlots = "Total slots must be a positive number";
    }

    // Check if tariff is a positive number
    const tariffNum = parseFloat(tariff);
    if (isNaN(tariffNum) || tariffNum <= 0) {
      newErrors.tariff = "Tariff must be a positive number";
    }

    // Make sure end time is after start time
    if (endHour <= startHour) {
      newErrors.hours = "End time must be after start time";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      // This would be replaced with actual image upload logic
      const imageUrls = images; // Placeholder for real upload logic

      // Format the input for the GraphQL mutation
      const input = {
        name,
        description,
        images: imageUrls,
        operationalHoursStart: formatTime(startHour),
        operationalHoursEnd: formatTime(endHour),
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
        },
        totalSlots: parseInt(totalSlots),
        availableSlots: parseInt(totalSlots), // Initially all spots are available
        tariff: parseFloat(tariff),
      };

      // For now, let's just simulate an API call
      setTimeout(() => {
        // This would be the real mutation call
        // await addParking({ variables: { input } });

        setIsLoading(false);
        Alert.alert("Success", "Parking land added successfully!", [
          { text: "OK", onPress: () => navigation.goBack() },
        ]);
      }, 2000);
    } catch (error) {
      setIsLoading(false);
      Alert.alert("Error", error.message || "Failed to add parking land");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
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
            <Text style={styles.headerTitle}>Add New Parking Land</Text>
            <View style={{ width: 24 }} />
          </View>
        </LinearGradient>

        <ScrollView
          style={styles.formContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.formContent}
        >
          {/* Name Field */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={[styles.input, errors.name && styles.inputError]}
              placeholder="Enter parking name"
              value={name}
              onChangeText={setName}
            />
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
          </View>

          {/* Description Field */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                errors.description && styles.inputError,
              ]}
              placeholder="Enter description"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            {errors.description && (
              <Text style={styles.errorText}>{errors.description}</Text>
            )}
          </View>

          {/* Images Field */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Images (Max 5)</Text>
            <View style={styles.imagesContainer}>
              {images.map((img, index) => (
                <View key={index} style={styles.imageWrapper}>
                  <Image source={{ uri: img }} style={styles.imageThumbnail} />
                  <TouchableOpacity
                    style={styles.removeImageBtn}
                    onPress={() => removeImage(index)}
                  >
                    <Ionicons name="close-circle" size={22} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))}

              <TouchableOpacity
                style={[
                  styles.addImageBtn,
                  images.length >= 5 && styles.disabledBtn,
                ]}
                onPress={pickImage}
                disabled={images.length >= 5}
              >
                <Ionicons name="add" size={40} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
            {errors.images && (
              <Text style={styles.errorText}>{errors.images}</Text>
            )}
          </View>

          {/* Operating Hours */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Operating Hours</Text>
            <View style={styles.timeInputRow}>
              <TouchableOpacity
                style={styles.timeInput}
                onPress={() => setStartTimePickerVisible(true)}
              >
                <Ionicons
                  name="time-outline"
                  size={20}
                  color="#6B7280"
                  style={styles.inputIcon}
                />
                <Text style={styles.timeText}>{formatTime(startHour)}</Text>
              </TouchableOpacity>

              <Text style={styles.toText}>to</Text>

              <TouchableOpacity
                style={styles.timeInput}
                onPress={() => setEndTimePickerVisible(true)}
              >
                <Ionicons
                  name="time-outline"
                  size={20}
                  color="#6B7280"
                  style={styles.inputIcon}
                />
                <Text style={styles.timeText}>{formatTime(endHour)}</Text>
              </TouchableOpacity>
            </View>
            {errors.hours && (
              <Text style={styles.errorText}>{errors.hours}</Text>
            )}

            <DateTimePickerModal
              isVisible={isStartTimePickerVisible}
              mode="time"
              onConfirm={handleStartTimeConfirm}
              onCancel={() => setStartTimePickerVisible(false)}
            />

            <DateTimePickerModal
              isVisible={isEndTimePickerVisible}
              mode="time"
              onConfirm={handleEndTimeConfirm}
              onCancel={() => setEndTimePickerVisible(false)}
            />
          </View>

          {/* Location Field */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Location</Text>
            <TouchableOpacity
              style={styles.mapPreview}
              onPress={() => setMapModalVisible(true)}
            >
              <MapView
                provider={PROVIDER_GOOGLE}
                style={styles.mapPreviewInner}
                region={location}
                scrollEnabled={false}
                zoomEnabled={false}
                pitchEnabled={false}
                rotateEnabled={false}
              >
                <Marker
                  coordinate={{
                    latitude: location.latitude,
                    longitude: location.longitude,
                  }}
                />
              </MapView>

              <View style={styles.mapOverlay}>
                <Text style={styles.mapOverlayText}>
                  Tap to Select Location
                </Text>
              </View>
            </TouchableOpacity>

            <View style={styles.locationInfo}>
              <View style={styles.locationDetail}>
                <Text style={styles.locationLabel}>Latitude</Text>
                <Text style={styles.locationValue}>
                  {location.latitude.toFixed(6)}
                </Text>
              </View>
              <View style={styles.locationDetail}>
                <Text style={styles.locationLabel}>Longitude</Text>
                <Text style={styles.locationValue}>
                  {location.longitude.toFixed(6)}
                </Text>
              </View>
            </View>
          </View>

          {/* Total Slots Field */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Total Parking Slots</Text>
            <TextInput
              style={[styles.input, errors.totalSlots && styles.inputError]}
              placeholder="Enter total number of parking slots"
              value={totalSlots}
              onChangeText={setTotalSlots}
              keyboardType="numeric"
            />
            {errors.totalSlots && (
              <Text style={styles.errorText}>{errors.totalSlots}</Text>
            )}
          </View>

          {/* Tariff Field */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Hourly Rate (Rp)</Text>
            <TextInput
              style={[styles.input, errors.tariff && styles.inputError]}
              placeholder="Enter hourly rate"
              value={tariff}
              onChangeText={setTariff}
              keyboardType="numeric"
            />
            {errors.tariff && (
              <Text style={styles.errorText}>{errors.tariff}</Text>
            )}
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <>
                <Text style={styles.submitButtonText}>Add Parking Land</Text>
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color="#FFF"
                  style={{ marginLeft: 8 }}
                />
              </>
            )}
          </TouchableOpacity>
        </ScrollView>

        {/* Map Modal */}
        <Modal
          visible={isMapModalVisible}
          animationType="slide"
          onRequestClose={() => setMapModalVisible(false)}
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setMapModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="#1E293B" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Select Location</Text>
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={handleMapConfirm}
              >
                <Text style={styles.modalConfirmText}>Confirm</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <MapView
                provider={PROVIDER_GOOGLE}
                style={styles.map}
                initialRegion={location}
                onRegionChangeComplete={setLocation}
              >
                <Marker
                  coordinate={{
                    latitude: location.latitude,
                    longitude: location.longitude,
                  }}
                  draggable
                  onDragEnd={(e) => {
                    setLocation({
                      ...location,
                      latitude: e.nativeEvent.coordinate.latitude,
                      longitude: e.nativeEvent.coordinate.longitude,
                    });
                  }}
                />
              </MapView>

              <View style={styles.mapPin}>
                <Ionicons name="location" size={40} color="#FE7A3A" />
              </View>

              <View style={styles.mapHelperText}>
                <Text style={styles.mapHelperTextContent}>
                  Drag the map to position the marker at your parking location
                </Text>
              </View>
            </View>
          </SafeAreaView>
        </Modal>
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
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  formContent: {
    paddingTop: 20,
    paddingBottom: 30,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E3A8A",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: "#1E293B",
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  inputError: {
    borderColor: "#EF4444",
  },
  errorText: {
    color: "#EF4444",
    fontSize: 12,
    marginTop: 5,
    textAlign: "center",
  },
  imagesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 5,
  },
  imageWrapper: {
    width: 80,
    height: 80,
    marginRight: 10,
    marginBottom: 10,
    borderRadius: 8,
    overflow: "hidden",
    position: "relative",
  },
  imageThumbnail: {
    width: "100%",
    height: "100%",
  },
  removeImageBtn: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 12,
  },
  addImageBtn: {
    width: 80,
    height: 80,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderStyle: "dashed",
    borderRadius: 8,
    backgroundColor: "#F9FAFB",
  },
  disabledBtn: {
    opacity: 0.5,
  },
  timeInputRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  timeInput: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  timeText: {
    fontSize: 16,
    color: "#1E293B",
  },
  toText: {
    marginHorizontal: 10,
    fontSize: 16,
    color: "#6B7280",
  },
  mapPreview: {
    height: 150,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
  },
  mapPreviewInner: {
    ...StyleSheet.absoluteFillObject,
  },
  mapOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  mapOverlayText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  locationInfo: {
    flexDirection: "row",
    marginTop: 8,
  },
  locationDetail: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 12,
    color: "#6B7280",
  },
  locationValue: {
    fontSize: 14,
    color: "#1E293B",
    fontWeight: "500",
  },
  submitButton: {
    backgroundColor: "#FE7A3A",
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    shadowColor: "#FE7A3A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 10 : 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  modalCloseButton: {
    padding: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1E293B",
  },
  modalConfirmButton: {
    padding: 8,
  },
  modalConfirmText: {
    color: "#FE7A3A",
    fontWeight: "600",
    fontSize: 16,
  },
  modalBody: {
    flex: 1,
    position: "relative",
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapPin: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginLeft: -20,
    marginTop: -40,
  },
  mapHelperText: {
    position: "absolute",
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    borderRadius: 12,
    padding: 12,
  },
  mapHelperTextContent: {
    color: "#FFFFFF",
    textAlign: "center",
  },
});
