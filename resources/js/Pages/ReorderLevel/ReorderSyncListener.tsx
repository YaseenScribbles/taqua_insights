import { useNotification } from "@/Context/NotificationContext";
import { useEcho } from "@laravel/echo-react";
import { useEffect } from "react";

type Props = {};

const ReorderSyncListener = (props: Props) => {

    const { showNotification } = useNotification()

    const { leaveChannel, stopListening } = useEcho(
        "reorder-sync",
        ".ReorderSyncStatus",
        (payload: { message: string }) => {
            console.log("Sync completed:", payload.message);
            showNotification(payload.message, "info");
        },
        [],
        "public"
    );

    useEffect(() => {
        return () => {
            // Explicit cleanup if component ever unmounts
            stopListening();
            leaveChannel();
        };
    }, [stopListening, leaveChannel]);

    return null;
};

export default ReorderSyncListener;
