import { createBrowserRouter } from "react-router";
import { LoadingScreen } from "./components/LoadingScreen";
import { Home } from "./components/Home";
import { Qibla } from "./components/Qibla";
import { Settings } from "./components/Settings";
import { Layout } from "./components/Layout";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <LoadingScreen />,
  },
  {
    element: <Layout />,
    children: [
      { path: "/home", element: <Home /> },
      { path: "/qibla", element: <Qibla /> },
      { path: "/settings", element: <Settings /> },
    ],
  },
]);
