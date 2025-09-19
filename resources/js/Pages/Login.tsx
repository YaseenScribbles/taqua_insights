import React, { useEffect, useRef, useState } from "react";
import { PageProps } from "@inertiajs/core";
import {
    Box,
    Button,
    Collapse,
    Container,
    Grow,
    IconButton,
    InputAdornment,
    TextField,
    Typography,
} from "@mui/material";
import { useForm } from "@inertiajs/react";
import {
    VisibilityOff,
    Visibility,
    Login as LoginIcon,
    AssessmentOutlined,
} from "@mui/icons-material";

const Login: React.FC<PageProps> = ({ auth }) => {
    const { data, setData, post, processing, errors, clearErrors } = useForm({
        email: "",
        password: "",
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showAppName, setShowAppName] = useState(false)

    const handleMouseUpAndDownPassword = (
        event: React.MouseEvent<HTMLButtonElement>
    ) => {
        event.preventDefault();
    };

    const loginUser = () => {
        post("/login");
    };

    useEffect(() => {
        if (Object.keys(errors).length > 0) {
            const timer = setTimeout(() => {
                clearErrors();
            }, 2000);

            return () => clearTimeout(timer);
        }
    }, [errors]);

    useEffect(() => {
        setShowAppName(true)
    }, [
    ])

    return (
        <Container
            sx={{ height: "100dvh", display: "grid", placeItems: "center" }}
        >
            <Box
                sx={{
                    padding: "2rem",
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "center",
                        columnGap: "1rem",
                        flexWrap: {
                            xs: "wrap",
                            sm: "nowrap",
                        },
                        color: "primary.main",
                        marginBlockEnd: "2rem",
                    }}
                >
                    <Collapse
                        in={showAppName}
                        orientation="horizontal"
                        timeout={1000}
                        unmountOnExit
                    >
                        <Typography
                            variant="h4"
                            gutterBottom
                            fontFamily={"Limelight"}
                        >
                            TAQUA
                        </Typography>
                    </Collapse>
                    <Grow in timeout={2000} unmountOnExit>
                        <AssessmentOutlined
                            sx={{
                                fontSize: (theme) =>
                                    theme.typography.h4.fontSize,
                            }}
                        />
                    </Grow>
                    <Collapse
                        in={showAppName}
                        orientation="horizontal"
                        timeout={1000}
                        unmountOnExit
                    >
                        <Typography
                            variant="h4"
                            gutterBottom
                            fontFamily={"Limelight"}
                        >
                            INSIGHTS
                        </Typography>
                    </Collapse>
                </Box>
                <TextField
                    error={!!errors.email}
                    helperText={errors.email || ""}
                    id="email"
                    label="Email"
                    variant="filled"
                    value={data.email}
                    onChange={(e) =>
                        setData((prev) => ({
                            ...prev,
                            email: e.target.value,
                        }))
                    }
                    sx={{ marginBlockEnd: "1rem" }}
                    type="email"
                    required
                    focused
                />
                <TextField
                    error={!!errors.password}
                    helperText={errors.password || ""}
                    id="password"
                    label="Password"
                    variant="filled"
                    value={data.password}
                    onChange={(e) =>
                        setData((prev) => ({
                            ...prev,
                            password: e.target.value,
                        }))
                    }
                    sx={{ marginBlockEnd: "1rem" }}
                    type={showPassword ? "text" : "password"}
                    required
                    slotProps={{
                        input: {
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        aria-label={
                                            showPassword
                                                ? "hide the password"
                                                : "display the password"
                                        }
                                        onClick={() =>
                                            setShowPassword(
                                                (prevState) => !prevState
                                            )
                                        }
                                        onMouseDown={
                                            handleMouseUpAndDownPassword
                                        }
                                        onMouseUp={handleMouseUpAndDownPassword}
                                        edge="end"
                                    >
                                        {showPassword ? (
                                            <VisibilityOff />
                                        ) : (
                                            <Visibility />
                                        )}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        },
                    }}
                />
                <Button
                    variant="outlined"
                    endIcon={<LoginIcon />}
                    sx={{ marginBlockEnd: "2rem" }}
                    onClick={loginUser}
                    loading={processing}
                    loadingPosition="end"
                >
                    Log In
                </Button>
                <Typography variant="caption" align="center">
                    ESSA GARMENTS PRIVATE LIMITED
                </Typography>
                <Typography variant="caption" align="center">
                    COPYRIGHT &copy; {new Date().getFullYear()}
                </Typography>
            </Box>
        </Container>
    );
};

export default Login;
