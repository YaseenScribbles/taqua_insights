import {
    AppBar,
    Box,
    Divider,
    Drawer,
    Fab,
    IconButton,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    styled,
    Toolbar,
} from "@mui/material";
import {
    BarChart,
    LocalShipping,
    Category,
    MoreVert,
    Article,
    People,
    History,
    Logout,
} from "@mui/icons-material";
import React, { SetStateAction, useState } from "react";
import { router } from "@inertiajs/react";

const StyledFab = styled(Fab)({
    position: "absolute",
    zIndex: 1,
    top: -30,
    left: 0,
    right: 0,
    margin: "0 auto",
});

type Anchor = "top" | "left" | "bottom" | "right";

interface DrawerProps {
    open: boolean;
    setOpen: React.Dispatch<SetStateAction<boolean>>;
    anchor: Anchor;
    role: string;
}

const CustomDrawer: React.FC<DrawerProps> = ({
    open,
    setOpen,
    anchor,
    role,
}) => {
    const toggleDrawer =
        (anchor: Anchor, open: boolean) =>
        (event: React.KeyboardEvent | React.MouseEvent) => {
            if (
                event.type === "keydown" &&
                ((event as React.KeyboardEvent).key === "Tab" ||
                    (event as React.KeyboardEvent).key === "Shift")
            ) {
                return;
            }

            setOpen(open);
        };

    const list = (anchor: Anchor) => (
        <Box
            sx={{
                width: anchor === "top" || anchor === "bottom" ? "auto" : 250,
            }}
            role="presentation"
            onClick={toggleDrawer(anchor, false)}
            onKeyDown={toggleDrawer(anchor, false)}
        >
            <List>
                <ListItem disablePadding>
                    <ListItemButton
                        onClick={() => router.visit(route("supplier"))}
                    >
                        <ListItemIcon>
                            <LocalShipping />
                        </ListItemIcon>
                        <ListItemText primary={"Supplier"} />
                    </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                    <ListItemButton
                        onClick={() => router.visit(route("product"))}
                    >
                        <ListItemIcon>
                            <Category />
                        </ListItemIcon>
                        <ListItemText primary={"Product"} />
                    </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                    <ListItemButton onClick={() => router.visit(route("psr"))}>
                        <ListItemIcon>
                            <Article />
                        </ListItemIcon>
                        <ListItemText primary={"GRN"} />
                    </ListItemButton>
                </ListItem>
                {role === "admin" && (
                    <ListItem disablePadding>
                        <ListItemButton
                            onClick={() => router.visit(route("UserPage"))}
                        >
                            <ListItemIcon>
                                <People />
                            </ListItemIcon>
                            <ListItemText primary={"Users"} />
                        </ListItemButton>
                    </ListItem>
                )}
            </List>
            <Divider />
            <List>
                {role === "admin" && (
                    <ListItem disablePadding>
                        <ListItemButton>
                            <ListItemIcon>
                                <History />
                            </ListItemIcon>
                            <ListItemText primary={"Legacy"} />
                        </ListItemButton>
                    </ListItem>
                )}
                <ListItem disablePadding>
                    <ListItemButton
                        onClick={() => router.post(route("logout"))}
                    >
                        <ListItemIcon>
                            <Logout />
                        </ListItemIcon>
                        <ListItemText primary={"Logout"} />
                    </ListItemButton>
                </ListItem>
            </List>
        </Box>
    );

    return (
        <Drawer
            anchor={anchor}
            open={true}
            onClose={toggleDrawer(anchor, false)}
        >
            {list(anchor)}
        </Drawer>
    );
};

interface CustomMenuProps {
    role: string;
}

const CustomMenu: React.FC<CustomMenuProps> = ({ role }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <AppBar
                position="fixed"
                color="primary"
                sx={{ top: "auto", bottom: 0 }}
            >
                <Toolbar
                    sx={{ display: "flex", justifyContent: "space-around" }}
                >
                    <IconButton
                        color={route().current() === 'supplier' ? "primary" :  "inherit"}
                        onClick={() => router.visit(route("supplier"))}
                    >
                        <LocalShipping />
                    </IconButton>
                    <IconButton
                        color={route().current() === 'product' ? "primary" :  "inherit"}
                        onClick={() => router.visit(route("product"))}
                    >
                        <Category />
                    </IconButton>
                    <StyledFab
                        color={route().current() === 'dashboard' ? "primary" :  "secondary"}
                        onClick={() => router.visit(route("dashboard"))}
                    >
                        <BarChart />
                    </StyledFab>
                    <IconButton
                        color={route().current() === 'psr' ? "primary" :  "inherit"}
                        onClick={() => router.visit(route("psr"))}
                    >
                        <Article />
                    </IconButton>
                    <IconButton color="inherit" onClick={() => setIsOpen(true)}>
                        <MoreVert />
                    </IconButton>
                </Toolbar>
            </AppBar>
            <Toolbar />
            {isOpen && (
                <CustomDrawer
                    open={isOpen}
                    setOpen={setIsOpen}
                    anchor="right"
                    role={role}
                />
            )}
        </>
    );
};

export default CustomMenu;
