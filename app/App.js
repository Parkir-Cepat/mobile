import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ApolloProvider } from "@apollo/client";
import client from "./config/appolo";
import Navigators from "./navigators/Navigators";


export default function App() {
  return (
    <ApolloProvider client={client}>
      <NavigationContainer>
        <Navigators />
      </NavigationContainer>
    </ApolloProvider>
  );
}
