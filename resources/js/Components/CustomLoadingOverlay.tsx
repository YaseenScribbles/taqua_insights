import { Box, LinearProgress } from "@mui/material";
import { GridOverlay } from "@mui/x-data-grid";
import React from "react";

const CustomLoadingOverlay: React.FC = () => {
    return (
        <GridOverlay>
            <Box width="100%" padding={2}>
                <LinearProgress />
            </Box>
        </GridOverlay>
    );
};

export default CustomLoadingOverlay;
