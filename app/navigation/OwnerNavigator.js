import { createNativeStackNavigator } from "@react-navigation/native-stack";
import DashboardScreen from "../screens/LandOwnerDashboard";

const Stack = createNativeStackNavigator();

export default function OwnerNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="DashboardScreen"
        component={DashboardScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
