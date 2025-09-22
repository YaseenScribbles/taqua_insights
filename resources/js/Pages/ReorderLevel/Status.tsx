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
    IconButton,
    CircularProgress,
} from "@mui/material";
import React, { useEffect, useRef, useState } from "react";
import { PageProps } from "@inertiajs/core";
import CustomMenu from "@/Components/Menu";
import CustomLoadingOverlay from "@/Components/CustomLoadingOverlay";
import {
    DataGrid,
    GridColDef,
    gridFilteredSortedRowIdsSelector,
    useGridApiRef,
} from "@mui/x-data-grid";
import { router } from "@inertiajs/react";
import { FileDownload } from "@mui/icons-material";
import { handleDownload } from "@/Library/Library";
import { useNotification } from "@/Context/NotificationContext";

type Option = {
    id: number;
    name: string;
};

type ReorderLevelStatus = {
    supplier_id: number;
    supplier_name: string;
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
    suppliers: Option[];
    status: ReorderLevelStatus[];
}

const Status: React.FC<Props> = ({
    brands,
    products,
    suppliers,
    status,
    auth,
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
    const apiRef = useGridApiRef();
    const [downloading, setDownloading] = useState(false);

    // Assign colors based on status
    const colorMap: Record<string, string> = {
        "over-stock": "#29B6F680", // 80 = ~50% opacity → lighter appearance
        sufficient: "#66BB6A80",
        "transfer-stock": "#FFA72680",
        reorder: "#F4433680",
    };
    const reorderLevelColumns: GridColDef[] = [
        { field: "supplier_name", headerName: "Supplier", flex: 1 },
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
                    "transfer-stock": "warning",
                    reorder: "error",
                };

                const labelMap: Record<string, string> = {
                    "over-stock": "Over Stock",
                    sufficient: "Sufficient",
                    "transfer-stock": "Transfer",
                    reorder: "Reorder",
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
                <Header name={"Reorder Status"} />
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
                    {!isMobile && (
                        <IconButton
                            onClick={() => {
                                const filteredSortedIds =
                                    gridFilteredSortedRowIdsSelector(apiRef);

                                const filteredData = filteredSortedIds.map(
                                    (id) => {
                                        const row = apiRef.current?.getRow(
                                            id
                                        ) as ReorderLevelStatus;
                                        return {
                                            Supplier: row.supplier_name,
                                            Product: row.product_name,
                                            Brand: row.brand_name,
                                            Size: row.size_name,
                                            L4Stock: row.l4stock,
                                            WHStock: row.whstock,
                                            ReorderLevel: row.reorder_level,
                                            Status: row.status,
                                        };
                                    }
                                );
                                if (filteredData.length === 0) {
                                    showNotification(
                                        "No data to export",
                                        "warning"
                                    );
                                    return;
                                }
                                try {
                                    setDownloading(true);
                                    handleDownload(filteredData);
                                } catch (error) {
                                    showNotification(
                                        "Error downloading the file",
                                        "error"
                                    );
                                } finally {
                                    setDownloading(false);
                                }
                            }}
                            title="Download Excel"
                            size="large"
                            disabled={downloading}
                        >
                            {downloading ? (
                                <CircularProgress color="primary" />
                            ) : (
                                <FileDownload color="primary" />
                            )}
                        </IconButton>
                    )}
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
                                <TableCell>Supplier</TableCell>
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
                                        key={`${row.product_id}-${row.brand_id}-${row.size_id}-${row.supplier_id}`}
                                        sx={{
                                            backgroundColor:
                                                colorMap[row.status],
                                        }}
                                    >
                                        <TableCell>
                                            {row.supplier_name}
                                        </TableCell>
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
                    <DataGrid<ReorderLevelStatus>
                        apiRef={apiRef}
                        columns={reorderLevelColumns}
                        rows={status || []}
                        getRowId={(row: ReorderLevelStatus) =>
                            `${row.product_id}-${row.brand_id}-${row.size_id}-${row.supplier_id}`
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
