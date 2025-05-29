import { useNavigation } from "@react-navigation/native";

import { Button, StyleSheet, Text, View } from "react-native";

export default function HomeScreen() {
  const navigation = useNavigation();
  return (
    <View style={styles.container}>
      <Text>Welcome to the Home Screen</Text>
      <Text onPress={() => navigation.navigate("LoginScreen")}>Logout</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
