// polyfills must load before anything uses crypto / URL (supabase-js needs both)
import "react-native-get-random-values";
import "react-native-url-polyfill/auto";

import { registerRootComponent } from "expo";
import App from "./App";

registerRootComponent(App);
