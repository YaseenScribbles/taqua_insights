import Header from "@/Components/Header";
import {
    Box,
    Autocomplete,
    TextField,
    useTheme,
    useMediaQuery,
    LinearProgress,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    Chip,
} from "@mui/material";
import React, { useEffect, useRef, useState } from "react";
import { PageProps } from "@inertiajs/core";
import CustomMenu from "@/Components/Menu";
import CustomLoadingOverlay from "@/Components/CustomLoadingOverlay";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { router } from "@inertiajs/react";

type Option = {
    id: number;
    name: string;
};

type ReorderLevelStatus = {
    id: number;
    product_id: number;
    product_name: string;
    brand_id: number;
    brand_name: string;
    size_id: number;
    size_name: string;
    l4stock: number;
    whstock: number;
    reorder_level: number;
    status: string;
};

interface Props extends PageProps {
    products: Option[];
    brands: Option[];
    status: ReorderLevelStatus[];
}

const Status: React.FC<Props> = ({ brands, products, status, auth }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
    const [selectedProduct, setSelectedProduct] = useState<Option | null>(null);
    const [selectedBrand, setSelectedBrand] = useState<Option | null>(null);
    const offsetHeight = 80;
    const [headerHeight, setHeaderHeight] = useState(0);
    const headerRef = useRef<HTMLDivElement>(null);
    const [isError, setIsError] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const isMounting = useRef(true);

    // Assign colors based on status
    const colorMap: Record<string, string> = {
        "over-stock": "#29B6F680", // 80 = ~50% opacity → lighter appearance
        sufficient: "#66BB6A80",
        "low-stock": "#FFA72680",
        critical: "#F4433680",
    };
    const reorderLevelColumns: GridColDef[] = [
        { field: "product_name", headerName: "Product", flex: 1 },
        { field: "brand_name", headerName: "Brand", flex: 1 },
        { field: "size_name", headerName: "Size", flex: 1 },
        {
            field: "l4stock",
            headerName: "L4 Stock",
            type: "number",
            width: 120,
        },
        {
            field: "whstock",
            headerName: "WH Stock",
            type: "number",
            width: 120,
        },
        {
            field: "reorder_level",
            headerName: "Reorder Level",
            type: "number",
            width: 150,
        },
        {
            field: "status",
            headerName: "Status",
            width: 140,
            renderCell: (params) => {
                const value = params.value as string;

                const colorMap: Record<
                    string,
                    "success" | "info" | "warning" | "error"
                > = {
                    "over-stock": "info",
                    sufficient: "success",
                    "low-stock": "warning",
                    critical: "error",
                };

                const labelMap: Record<string, string> = {
                    "over-stock": "Over Stock",
                    sufficient: "Sufficient",
                    "low-stock": "Low Stock",
                    critical: "Critical",
                };

                return (
                    <Chip
                        label={labelMap[value] || value}
                        color={colorMap[value] || "default"}
                        size="small"
                    />
                );
            },
        },
    ];

    useEffect(() => {
        const headerElement = headerRef.current;
        if (!headerElement) return;

        const observer = new ResizeObserver((entries) => {
            for (let entry of entries) {
                setHeaderHeight(entry.contentRect.height);
            }
        });

        observer.observe(headerElement);

        // Initial set
        setHeaderHeight(headerElement.offsetHeight);

        return () => {
            observer.disconnect();
        };
    }, []);

    useEffect(() => {
        if (isMounting.current) {
            isMounting.current = false;
            return;
        }
        router.get(
            route("reorder-level.status"),
            {
                product_id: selectedProduct ? selectedProduct.id : undefined,
                brand_id: selectedBrand ? selectedBrand.id : undefined,
            },
            {
                preserveState: true,
                replace: true,
                onError: (errors) => {
                    console.error(errors);
                },
            }
        );
    }, [selectedProduct, selectedBrand]);

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
                ref={headerRef}
            >
                <Header name={"Reorder Status"} />
                <Box
                    display={"flex"}
                    flexWrap={"wrap"}
                    justifyContent={"center"}
                    gap={1}
                >
                    <Autocomplete
                        disablePortal
                        options={products}
                        renderInput={(params) => (
                            <TextField {...params} label="Product" />
                        )}
                        getOptionLabel={(option: Option) => option.name}
                        isOptionEqualToValue={(option, value) =>
                            option.id === value.id
                        }
                        getOptionKey={(option) => option.id}
                        sx={{
                            width: isMobile ? 300 : 400,
                        }}
                        value={selectedProduct}
                        onChange={(_, value) => {
                            setSelectedProduct(value);
                        }}
                    />
                    <Autocomplete
                        disablePortal
                        options={brands}
                        renderInput={(params) => (
                            <TextField {...params} label="Brand" />
                        )}
                        getOptionLabel={(option: Option) => option.name}
                        isOptionEqualToValue={(option, value) =>
                            option.id === value.id
                        }
                        getOptionKey={(option) => option.id}
                        sx={{
                            width: isMobile ? 300 : 400,
                        }}
                        value={selectedBrand}
                        onChange={(_, value) => {
                            setSelectedBrand(value);
                        }}
                    />
                </Box>
            </Box>
            {isMobile ? (
                <TableContainer
                    sx={{
                        maxWidth: "100%",
                        overflowX: "auto", // allows horizontal scroll
                        "& td, & th": {
                            p: { xs: 0.5, sm: 1 }, // smaller padding on mobile
                            fontSize: { xs: "0.75rem", sm: "0.875rem" },
                        },
                    }}
                >
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Product</TableCell>
                                <TableCell>Brand</TableCell>
                                <TableCell>Size</TableCell>
                                <TableCell>
                                    <Box
                                        display={"flex"}
                                        flexDirection={"column"}
                                        justifyContent={"center"}
                                    >
                                        <Typography
                                            variant="inherit"
                                            sx={{ borderBottom: 1 }}
                                        >
                                            L4 Stock
                                        </Typography>
                                        <Typography
                                            variant="inherit"
                                            sx={{ borderBottom: 1 }}
                                        >
                                            WH Stock
                                        </Typography>
                                        <Typography
                                            variant="inherit"
                                            sx={{ borderBottom: 1 }}
                                        >
                                            R. Level
                                        </Typography>
                                    </Box>
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {isError && (
                                <TableRow>
                                    <TableCell colSpan={5} align="center">
                                        <Typography variant="body1">
                                            Network Error
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                            {isLoading && (
                                <TableRow>
                                    <TableCell colSpan={5}>
                                        <LinearProgress />
                                    </TableCell>
                                </TableRow>
                            )}
                            {status &&
                                status.length > 0 &&
                                status.map((row) => (
                                    <TableRow
                                        key={`${row.product_id}-${row.brand_id}-${row.size_id}`}
                                        sx={{
                                            backgroundColor:
                                                colorMap[row.status],
                                        }}
                                    >
                                        <TableCell>
                                            {row.product_name}
                                        </TableCell>
                                        <TableCell>{row.brand_name}</TableCell>
                                        <TableCell>{row.size_name}</TableCell>
                                        <TableCell>
                                            <Box
                                                display={"flex"}
                                                flexDirection={"column"}
                                                justifyContent={"center"}
                                            >
                                                <Typography
                                                    variant="inherit"
                                                    align="right"
                                                    sx={{ borderBottom: 1 }}
                                                >
                                                    {row.l4stock}
                                                </Typography>
                                                <Typography
                                                    variant="inherit"
                                                    align="right"
                                                    sx={{ borderBottom: 1 }}
                                                >
                                                    {row.whstock}
                                                </Typography>
                                                <Typography
                                                    variant="inherit"
                                                    align="right"
                                                    sx={{ borderBottom: 1 }}
                                                >
                                                    {row.reorder_level}
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            ) : (
                <Box
                    height={`calc(100dvh - ${offsetHeight + headerHeight}px)`}
                    overflow={"auto"}
                >
                    <DataGrid
                        columns={reorderLevelColumns}
                        rows={status || []}
                        getRowId={(row: ReorderLevelStatus) =>
                            `${row.product_id}-${row.brand_id}-${row.size_id}`
                        }
                        loading={isLoading}
                        slots={{
                            loadingOverlay: CustomLoadingOverlay,
                        }}
                    />
                </Box>
            )}
            <CustomMenu role={auth.user.role} />
        </>
    );
};

export default Status;
