import { PersonAddAlt } from "@mui/icons-material";
import { Box, IconButton, Typography, useTheme } from "@mui/material";
import React from "react";

interface HeaderProps {
    name: string;
    addBtn?: boolean;
    addBtnFn?: () => void;
}

const Header: React.FC<HeaderProps> = ({ name, addBtn, addBtnFn }) => {
    return (
        <Box display={"flex"} justifyContent={"center"}>
            <Typography
                variant="h4"
                align="center"
                fontFamily={"Limelight"}
                marginBlock={1}
            >
                {name.toUpperCase()}
            </Typography>
            {addBtn && (
                <IconButton onClick={addBtnFn} sx={{ marginInlineStart: 1 }}>
                    <PersonAddAlt />
                </IconButton>
            )}
        </Box>
    );
};

export default Header;
