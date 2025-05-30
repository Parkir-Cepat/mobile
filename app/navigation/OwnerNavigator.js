import { createNativeStackNavigator } from "@react-navigation/native-stack";
import DashboardScreen from "../screens/LandOwnerDashboard";
import AddNewLandScreen from "../screens/AddNewLandScreen";
import ParkingDetailScreen from "../screens/ParkingDetailScreen";

const Stack = createNativeStackNavigator();

export default function OwnerNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="DashboardScreen"
        component={DashboardScreen}
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
    </Stack.Navigator>
  );
}
