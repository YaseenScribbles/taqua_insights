import "../css/app.css";
import "./bootstrap";

import { createInertiaApp } from "@inertiajs/react";
import { resolvePageComponent } from "laravel-vite-plugin/inertia-helpers";
import { createRoot } from "react-dom/client";
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { configureEcho } from "@laravel/echo-react";
import Pusher from "pusher-js";
import ReorderSyncListener from "./Pages/ReorderLevel/ReorderSyncListener";
import { NotificationProvider } from "./Context/NotificationContext";

configureEcho({
    broadcaster: "pusher",
    key: import.meta.env.VITE_PUSHER_APP_KEY,
    cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER,
    forceTLS: false,
    encrypted: false,
    Pusher,
});

const queryClient = new QueryClient();

const theme = createTheme({
    palette: {
        mode: "dark",
        primary: {
            main: "#FED32C", // bright, warm yellow-gold
        },
        secondary: {
            main: "#FF6F61", // soft coral/red-orange
        },
    },
});

const appName = import.meta.env.VITE_APP_NAME || "Laravel";

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.tsx`,
            import.meta.glob("./Pages/**/*.tsx")
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <>
                <QueryClientProvider client={queryClient}>
                    <NotificationProvider>
                        <ThemeProvider theme={theme}>
                            <CssBaseline />
                            <ReorderSyncListener />
                            <App {...props} />
                        </ThemeProvider>
                    </NotificationProvider>
                </QueryClientProvider>
            </>
        );
    },
    progress: {
        color: "#FED32C",
    },
});
