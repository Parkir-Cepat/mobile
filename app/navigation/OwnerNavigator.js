import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AddNewLandScreen from "../screens/AddNewLandScreen";
import ParkingDetailScreen from "../screens/ParkingDetailScreen";
import LandOwnerDashboard from "../screens/LandOwnerDashboard";
import EditParkingScreen from "../screens/EditParkingScreen";
import BookingManagementScreen from "../screens/BookingManagementScreen";

const Stack = createNativeStackNavigator();

export default function OwnerNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="DashboardScreen"
        component={LandOwnerDashboard}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ParkingDetailsScreen"
        component={ParkingDetailScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AddNewLandScreen"
        component={AddNewLandScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="EditParkingScreen"
        component={EditParkingScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="BookingManagementScreen"
        component={BookingManagementScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
