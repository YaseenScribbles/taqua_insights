import React, { useState } from "react";
import { PageProps } from "@inertiajs/core";
import Header from "@/Components/Header";
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    MenuItem,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
    useMediaQuery,
    useTheme,
} from "@mui/material";
import CustomMenu from "@/Components/Menu";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { Controller, useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    addUserApi,
    deleteUserApi,
    getUsers,
    updateUserApi,
    CreateUser as User,
    User as UserInfo,
} from "@/Api/Users";
import { Close, Delete, Edit } from "@mui/icons-material";

interface UsersProps extends PageProps {}

const schema = yup.object({
    id: yup.number().when("isEdit", {
        is: false,
        then(schema) {
            return schema.notRequired();
        },
        otherwise(schema) {
            return schema.required();
        },
    }),
    name: yup.string().required("Name is required"),
    email: yup.string().email("Invalid email").required("Email is required"),
    password: yup
        .string()
        .nullable()
        .when("isEdit", {
            is: false,
            then: (schema) =>
                schema
                    .required("Password is required")
                    .min(5, "Min 5 characters"),
            otherwise: (schema) => schema.notRequired(),
        }),
    password_confirmation: yup
        .string()
        .nullable()
        .when("password", {
            is: (val: string) => !!val,
            then: (schema) =>
                schema
                    .required("Confirm your password")
                    .oneOf([yup.ref("password")], "Passwords must match"),
            otherwise: (schema) => schema.notRequired(),
        }),
    role: yup
        .string()
        .oneOf(["admin", "user"], "Invalid role")
        .required("Role is required"),
    isEdit: yup.boolean().default(false),
});

const Users: React.FC<UsersProps> = ({ auth }) => {
    const theme = useTheme();
    const queryClient = useQueryClient();
    const [editId, setEditId] = useState<number | null>(null);
    const [showModal, setShowModal] = useState(false);
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
        control,
    } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            name: "",
            email: "",
            password: "",
            password_confirmation: "",
            role: "user",
            isEdit: false,
        },
    });

    const {
        data: users,
        isLoading: isUsersLoading,
        isError: isUsersError,
    } = useQuery({
        queryKey: ["users"],
        queryFn: getUsers,
    });

    const {
        mutate: addUser,
        isPending: isAddPending,
        isError: isAddError,
    } = useMutation({
        mutationFn: addUserApi,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["users"] });
            reset();
        },
    });

    const {
        mutate: updateUser,
        isPending: isUpdatePending,
        isError: isUpdateError,
    } = useMutation({
        mutationFn: (data: { id: number; user: User }) =>
            updateUserApi(data.user, data.id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["users"] });
            reset();
        },
    });

    const {
        mutate: deleteUser,
        isPending: isDeletePending,
        isError: isDeleteError,
    } = useMutation({
        mutationFn: (id: number) => deleteUserApi(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["users"] });
            reset();
        },
    });

    const handleEdit = (user: UserInfo) => {
        setShowModal(true);
        setEditId(user.id);
        reset({
            id: user.id,
            name: user.name,
            email: user.email,
            password: "",
            password_confirmation: "",
            role: user.role,
            isEdit: true,
        });
    };

    const onSubmit = (formData: User) => {
        if (editId) {
            updateUser({ id: editId, user: formData });
        } else {
            addUser(formData);
        }
    };

    return (
        <>
            <Box
                position="sticky"
                top="0"
                zIndex={1}
                sx={{
                    backgroundColor: theme.palette.background.default,
                    boxShadow: 1,
                }}
                paddingBlockEnd={2}
            >
                <Header
                    name="User"
                    addBtn
                    addBtnFn={() => {
                        setEditId(null);
                        reset({
                            email: "",
                            name: "",
                            role: "user",
                            isEdit: false,
                        });
                        setShowModal(true);
                    }}
                />
            </Box>
            <Dialog
                open={showModal}
                onClose={() => setShowModal(!showModal)}
                fullScreen={isMobile}
            >
                <DialogTitle sx={{ m: 0, p: 1 }} align="center">
                    Create User
                    <IconButton
                        sx={{
                            position: "absolute",
                            right: 8,
                            top: 5,
                            color: (theme) => theme.palette.secondary.main,
                        }}
                        onClick={() => setShowModal(false)}
                    >
                        <Close />
                    </IconButton>
                </DialogTitle>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <DialogContent sx={{ padding: 0 }}>
                        <Box
                            display={"flex"}
                            flexDirection={"column"}
                            gap={2}
                            padding={2}
                            sx={{ minWidth: 300 }}
                        >
                            <TextField
                                error={!!errors.name}
                                helperText={errors.name?.message}
                                id="name"
                                label="Name"
                                variant="filled"
                                {...register("name")}
                                autoFocus
                            />
                            <TextField
                                error={!!errors.email}
                                helperText={errors.email?.message}
                                id="email"
                                label="Email"
                                variant="filled"
                                {...register("email")}
                            />
                            <TextField
                                error={!!errors.password}
                                helperText={errors.password?.message}
                                id="password"
                                label="Password"
                                variant="filled"
                                {...register("password")}
                                type="password"
                            />
                            <TextField
                                error={!!errors.password_confirmation}
                                helperText={
                                    errors.password_confirmation?.message
                                }
                                id="confirm_password"
                                label="Confirm Password"
                                variant="filled"
                                {...register("password_confirmation")}
                                type="password"
                            />
                            <Controller
                                name="role"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        select
                                        error={!!errors.role}
                                        helperText={errors.role?.message}
                                        id="role"
                                        label="Role"
                                        variant="filled"
                                        {...field}
                                        value={field.value || "user"}
                                    >
                                        <MenuItem value={"admin"}>
                                            Administrator
                                        </MenuItem>
                                        <MenuItem value={"user"}>User</MenuItem>
                                    </TextField>
                                )}
                            />
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Box
                            display="flex"
                            gap={2}
                            paddingInline={2}
                            marginBottom={1}
                        >
                            <Button
                                type="submit"
                                variant="outlined"
                                disabled={isAddPending || isUpdatePending}
                                loading={isAddPending || isUpdatePending}
                            >
                                Save
                            </Button>
                            <Button
                                type="reset"
                                variant="outlined"
                                color="secondary"
                                onClick={() => {
                                    setEditId(null);
                                    reset({
                                        email: "",
                                        name: "",
                                        role: "user",
                                        isEdit: false,
                                    });
                                }}
                            >
                                Reset
                            </Button>
                        </Box>
                    </DialogActions>
                </form>
            </Dialog>
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>S. No</TableCell>
                            <TableCell>Name</TableCell>
                            <TableCell>Email</TableCell>
                            <TableCell>Role</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {users &&
                            users.length > 0 &&
                            users.map((user: UserInfo, index) => (
                                <TableRow key={user.email}>
                                    <TableCell>{index + 1}</TableCell>
                                    <TableCell>
                                        {user.name.toUpperCase()}
                                    </TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>
                                        {user.role.toUpperCase()}
                                    </TableCell>
                                    <TableCell>
                                        <Box display={"flex"}>
                                            <IconButton
                                                onClick={() => handleEdit(user)}
                                            >
                                                <Edit />
                                            </IconButton>
                                            <IconButton>
                                                <Delete />
                                            </IconButton>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))}
                    </TableBody>
                </Table>
            </TableContainer>
            <CustomMenu role={auth.user.role} />
        </>
    );
};

export default Users;
