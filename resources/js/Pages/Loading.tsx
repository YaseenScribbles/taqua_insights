import { router } from "@inertiajs/react";
import { Box, CircularProgress } from "@mui/material";
import React, { useEffect, useState } from "react";

const Loading: React.FC = () => {
    const [progress, setProgress] = useState(0);

    if (progress === 75) {
        router.visit(route('login'));
    }

    useEffect(() => {
        const interval = setInterval(() => {
            setProgress((prevState) => prevState + 5);
        }, 100);

        return () => clearInterval(interval);
    }, []);

    return (
        <Box sx={{ placeItems: "center" }} height={"100dvh"} display={"grid"}>
            <CircularProgress variant="determinate" value={progress} size="5rem" />
        </Box>
    );
};

export default Loading;
