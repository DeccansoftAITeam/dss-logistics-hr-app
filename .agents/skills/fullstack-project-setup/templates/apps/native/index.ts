// App entry (package.json `main`). Two jobs: import the NativeWind
// stylesheet once — decision #15 — and register the root component.
import "./global.css";

import { registerRootComponent } from "expo";

import App from "./App";

registerRootComponent(App);