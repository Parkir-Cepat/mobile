import { NavigationContainer } from "@react-navigation/native";
import { ApolloProvider } from "@apollo/client";
import client from "./config/appolo";
import AppNavigator from "./navigation/AppNavigator";
import AuthProvider from "./context/authContext";

export default function App() {
  return (
    <AuthProvider>
      <ApolloProvider client={client}>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </ApolloProvider>
    </AuthProvider>
  );
}
