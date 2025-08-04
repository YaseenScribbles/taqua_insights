import { Box, BoxProps } from "@mui/material";
import React, { ReactNode } from "react";

type CenterBoxProps = BoxProps & {
    children: ReactNode;
};

const CenterBox: React.FC<CenterBoxProps> = ({ children, ...props }) => {
    return (
        <Box
            display={"flex"}
            justifyContent={"center"}
            alignItems={"center"}
            height={"100%"}
            width={"100%"}
            {...props}
        >
            {children}
        </Box>
    );
};

export default CenterBox;
