import React, { useEffect, useState } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

// Import screens
import LoginScreen from "../screens/LoginScreens";
import HomeScreen from "../screens/HomeScreen";
import SearchParkingScreen from "../screens/SearchParkingScreen";
// import ProfileScreen from "../screens/ProfileScreen";
// import TopUpScreen from "../screens/TopUpScreen";
// import ParkingHistoryScreen from "../screens/ParkingHistoryScreen";
// import ParkingDetailScreen from "../screens/ParkingDetailScreen";
import RegisterScreen from "../screens/RegisterScreen";
import * as SecureStore from "expo-secure-store";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function BottomTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#1E3A8A",
        tabBarInactiveTintColor: "#9CA3AF",
        tabBarStyle: {
          backgroundColor: "white",
          borderTopWidth: 0,
          elevation: 10,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.1,
          shadowRadius: 5,
          height: 60,
          paddingBottom: 5,
          paddingTop: 5,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchParkingScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="search-outline" size={size} color={color} />
          ),
        }}
      />
      {/* <Tab.Screen
        name="History"
        component={ParkingHistoryScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="time-outline" size={size} color={color} />
          ),
        }}
      /> */}
      {/* <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      /> */}
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const [isSignIn, setIsSignIn] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = () => {
    const token = SecureStore.getItemAsync("access_token");
    if (token) {
      setIsSignIn(true);
    } else {
      setIsSignIn(false);
    }
  };

  return isSignIn ? (
    <BottomTabNavigator />
  ) : (
    <Stack.Navigator
      initialRouteName="LoginScreen"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="LoginScreen" component={LoginScreen} />
      <Stack.Screen name="RegisterScreen" component={RegisterScreen} />
      <Stack.Screen name="HomeScreen" component={BottomTabNavigator} />
      <Stack.Screen name="SearchParking" component={SearchParkingScreen} />
      {/* <Stack.Screen name="TopUpScreen" component={TopUpScreen} /> */}
      {/* <Stack.Screen
      name="ParkingDetailScreen"
      component={ParkingDetailScreen}
    /> */}
    </Stack.Navigator>
  );
}

export default AppNavigator;
