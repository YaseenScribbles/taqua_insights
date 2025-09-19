import CustomLoadingOverlay from "@/Components/CustomLoadingOverlay";
import Header from "@/Components/Header";
import CustomMenu from "@/Components/Menu";
import { useNotification } from "@/Context/NotificationContext";
import { PageProps } from "@inertiajs/core";
import { Link, router } from "@inertiajs/react";
import {
    Autocomplete,
    Box,
    Table,
    TableContainer,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    Typography,
    TextField,
    useMediaQuery,
    useTheme,
    LinearProgress,
} from "@mui/material";
import { DataGrid, GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import React, { useEffect, useRef, useState } from "react";

type Option = {
    id: number;
    name: string;
};

type Summary = {
    supplier_id: number;
    supplier_name: string;
    product_id: number;
    product_name: string;
    brand_id: number;
    brand_name: string;
    reorder: number;
    "transfer-stock": number;
    "over-stock": number;
    sufficient: number;
};

type Status = "reorder" | "transfer-stock" | "over-stock" | "sufficient";

interface Props extends PageProps {
    products: Option[];
    brands: Option[];
    suppliers: Option[];
    summary: Summary[];
}

const Summary: React.FC<Props> = ({
    auth,
    brands,
    products,
    summary,
    suppliers,
}) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
    const [selectedProduct, setSelectedProduct] = useState<Option | null>(null);
    const [selectedBrand, setSelectedBrand] = useState<Option | null>(null);
    const [selectedSupplier, setSelectedSupplier] = useState<Option | null>(
        null
    );
    const offsetHeight = 80;
    const [headerHeight, setHeaderHeight] = useState(0);
    const headerRef = useRef<HTMLDivElement>(null);
    const [isError, setIsError] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const isMounting = useRef(true);
    const { showNotification } = useNotification();
    const makeLink = (row: Summary, status: Status) =>
        route("reorder-level.status", {
            supplier_id: row.supplier_id,
            product_id: row.product_id,
            brand_id: row.brand_id,
            status,
        });

    const columns: GridColDef[] = [
        { field: "supplier_name", headerName: "Supplier", flex: 1 },
        { field: "product_name", headerName: "Product", flex: 1 },
        { field: "brand_name", headerName: "Brand", flex: 1 },
        {
            field: "reorder",
            headerName: "Reorder",
            flex: 0.7,
            renderCell: (params: GridRenderCellParams) => (
                <Link
                    style={{
                        color: "#FED32C",
                        textAlign: "right",
                        display: "block",
                        fontSize: 16,
                    }}
                    href={makeLink(params.row, "reorder")}
                    preserveState
                    preserveScroll
                >
                    {params.value}
                </Link>
            ),
        },
        {
            field: "transfer-stock",
            headerName: "Transfer Stock",
            flex: 0.7,
            renderCell: (params: GridRenderCellParams) => (
                <Link
                    style={{
                        color: "#FED32C",
                        textAlign: "right",
                        display: "block",
                        fontSize: 16,
                    }}
                    href={makeLink(params.row, "transfer-stock")}
                    preserveState
                    preserveScroll
                >
                    {params.value}
                </Link>
            ),
        },
        {
            field: "over-stock",
            headerName: "Over Stock",
            flex: 0.7,
            renderCell: (params: GridRenderCellParams) => (
                <Link
                    style={{
                        color: "#FED32C",
                        textAlign: "right",
                        display: "block",
                        fontSize: 16,
                    }}
                    href={makeLink(params.row, "over-stock")}
                    preserveState
                    preserveScroll
                >
                    {params.value}
                </Link>
            ),
        },
        {
            field: "sufficient",
            headerName: "Sufficient",
            flex: 0.7,
            renderCell: (params: GridRenderCellParams) => (
                <Link
                    style={{
                        color: "#FED32C",
                        textAlign: "right",
                        display: "block",
                        fontSize: 16,
                    }}
                    href={makeLink(params.row, "sufficient")}
                    preserveState
                    preserveScroll
                >
                    {params.value}
                </Link>
            ),
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
            route("reorder-level.status-summary"),
            {
                product_id: selectedProduct ? selectedProduct.id : undefined,
                brand_id: selectedBrand ? selectedBrand.id : undefined,
                supplier_id: selectedSupplier ? selectedSupplier.id : undefined,
            },
            {
                preserveState: true,
                replace: true,
                onError: (errors) => {
                    console.error(errors);
                },
            }
        );
    }, [selectedProduct, selectedBrand, selectedSupplier]);

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
                <Header name={"Reorder Status - Summary"} />
                <Box
                    display={"flex"}
                    flexWrap={"wrap"}
                    justifyContent={"center"}
                    gap={1}
                >
                    <Autocomplete
                        disablePortal
                        options={suppliers}
                        renderInput={(params) => (
                            <TextField {...params} label="Supplier" />
                        )}
                        getOptionLabel={(option: Option) => option.name}
                        isOptionEqualToValue={(option, value) =>
                            option.id === value.id
                        }
                        getOptionKey={(option) => option.id}
                        sx={{
                            width: 300,
                        }}
                        value={selectedSupplier}
                        onChange={(_, value) => {
                            setSelectedSupplier(value);
                        }}
                    />
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
                            width: 300,
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
                            width: 300,
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
                            {summary &&
                                summary.length > 0 &&
                                summary.map((row) => (
                                    <TableRow
                                        key={`${row.product_id}-${row.brand_id}-${row.supplier_id}`}
                                    >
                                        <TableCell>
                                            {row.supplier_name}
                                        </TableCell>
                                        <TableCell>
                                            {row.product_name}
                                        </TableCell>
                                        <TableCell>{row.brand_name}</TableCell>
                                        <TableCell align="right">
                                            {row.reorder}
                                        </TableCell>
                                        <TableCell align="right">
                                            {row["transfer-stock"]}
                                        </TableCell>
                                        <TableCell align="right">
                                            {row["over-stock"]}
                                        </TableCell>
                                        <TableCell align="right">
                                            {row.sufficient}
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
                    <DataGrid<Summary>
                        columns={columns}
                        rows={summary || []}
                        getRowId={(row: Summary) =>
                            `${row.product_id}-${row.brand_id}-${row.supplier_id}`
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

export default Summary;
