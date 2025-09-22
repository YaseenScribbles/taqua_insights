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
    Button,
} from "@mui/material";
import React, { useEffect, useRef, useState } from "react";
import { PageProps } from "@inertiajs/core";
import CustomMenu from "@/Components/Menu";
import CustomLoadingOverlay from "@/Components/CustomLoadingOverlay";
import {
    DataGrid,
    GridColDef,
    GridRenderCellParams,
    GridRowModel,
    GridRowSelectionModel,
} from "@mui/x-data-grid";
import { router } from "@inertiajs/react";
import { GridColumnVisibilityModel } from "@mui/x-data-grid";
import { Cached, Update } from "@mui/icons-material";
import { GridRowId } from "@mui/x-data-grid";
import { useNotification } from "@/Context/NotificationContext";

type Option = {
    id: number;
    name: string;
};

type ReorderLevel = {
    id: number;
    supplier_id:number;
    supplier_name: string;
    product_id: number;
    product_name: string;
    brand_id: number;
    brand_name: string;
    size_id: number;
    size_name: string;
    reorder_level: number;
};

interface Props extends PageProps {
    products: Option[];
    brands: Option[];
    suppliers: Option[];
    reorderLevels: ReorderLevel[];
}

const List: React.FC<Props> = ({
    brands,
    products,
    suppliers,
    reorderLevels,
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
    const [disableButton, setDisableButton] = useState(false);
    const [selectionModel, setSelectionModel] = useState<GridRowSelectionModel>(
        {
            type: "include",
            ids: new Set<GridRowId>(),
        }
    );
    const [editedRows, setEditedRows] = useState<Record<string, GridRowModel>>(
        {}
    );
    const [disableBulkUpdateButton, setDisableBulkUpdateButton] =
        useState(false);

    const isMounting = useRef(true);
    const { showNotification } = useNotification();

    const reorderLevelColumns: GridColDef[] = [
        // 🔒 Hidden ID columns
        { field: "product_id", headerName: "Product ID" },
        { field: "brand_id", headerName: "Brand ID" },
        { field: "size_id", headerName: "Size ID" },
        { field: "supplier_id", headerName: "Supplier ID" },

        // 🏷 Visible columns
        {
            field: "supplier_name",
            headerName: "Supplier",
            flex: 1,
            minWidth: 150,
        },
        {
            field: "product_name",
            headerName: "Product",
            flex: 1,
            minWidth: 150,
        },
        {
            field: "brand_name",
            headerName: "Brand",
            flex: 1,
            minWidth: 150,
        },
        {
            field: "size_name",
            headerName: "Size",
            flex: 0.5,
            minWidth: 100,
        },
        {
            field: "reorder_level",
            headerName: "Reorder Level",
            type: "number",
            flex: 0.5,
            minWidth: 100,
            headerAlign: "center",
            align: "right",
            editable: true, // allow inline editing if desired
        },

        // ⚙ Action column
        {
            field: "actions",
            headerName: "Actions",
            width: 120,
            sortable: false,
            filterable: false,
            renderCell: (params: GridRenderCellParams) => (
                <Button
                    variant="contained"
                    size="small"
                    onClick={() => handleEdit(params.row)}
                    disabled={disableButton || selectionModel.ids.size > 1}
                >
                    Update
                </Button>
            ),
        },
    ];

    const columnVisibilityModel: GridColumnVisibilityModel = {
        product_id: false,
        brand_id: false,
        size_id: false,
        supplier_id: false,
    };

    const processRowUpdate = (
        newRow: GridRowModel,
        oldRow: ReorderLevel,
        params: { rowId: GridRowId }
    ): ReorderLevel => {
        // Merge edits and ensure numeric reorder_level
        const updatedRow: ReorderLevel = {
            ...oldRow,
            ...newRow,
            reorder_level: Number(newRow.reorder_level), // keep type consistent
        };

        // Store the updated row in state for bulk update
        setEditedRows((prev) => ({
            ...prev,
            [params.rowId as string]: updatedRow,
        }));

        // ✅ Automatically select the edited row
        setSelectionModel((prev) => {
            const ids = new Set(prev.ids);
            ids.add(params.rowId);
            return { ...prev, ids }; // keep same type but update ids
        });

        return updatedRow; // DataGrid expects the updated row to render
    };

    const handleBulkUpdate = () => {
        const rowsToUpdate = Array.from(selectionModel.ids).map(
            (id: GridRowId) => {
                const edited = editedRows[id];
                return edited ?? reorderLevels.find((r) => r.id === id);
            }
        );

        // console.log(rowsToUpdate);

        if (rowsToUpdate.length === 0) {
            alert("No rows selected or edited.");
            return;
        }

        router.post(
            route("reorder-level.bulk-update"),
            { rows: rowsToUpdate },
            {
                preserveScroll: true,
                preserveState: true,
                onStart: () => setDisableBulkUpdateButton(true),
                onFinish: () => {
                    setDisableBulkUpdateButton(false);
                    setEditedRows({});
                    setSelectionModel({
                        type: "include",
                        ids: new Set<GridRowId>(),
                    });
                },
                onSuccess: () => {
                    showNotification("Update successful", "success");
                },
                onError: (errors) => {
                    console.error(errors);
                    Object.values(errors).forEach((msg) => {
                        showNotification(msg as string, "error");
                    });
                },
            }
        );
    };

    function handleEdit(row: ReorderLevel) {
        try {
            router.put(
                route("reorder-level.update", { reorderLevel: row.id }),
                {
                    reorder_level: row.reorder_level,
                },
                {
                    preserveScroll: true,
                    preserveState: true,
                    onStart: () => setDisableButton(true),
                    onSuccess: () => {
                        showNotification("Update successful", "success");
                    },
                    onFinish: () => {
                        setDisableButton(false);
                    },
                    onError: (errors) => {
                        console.error(errors);
                        Object.values(errors).forEach((msg) => {
                            showNotification(msg as string, "error");
                        });
                    },
                }
            );
        } catch (error) {
            console.error(error);
        }
    }

    function syncItems() {
        setIsLoading(true);
        setIsError(false);
        showNotification(
            "Sync started, you'll be notified when it's done.",
            "info"
        );
        fetch("/reorder-level/sync-items")
            .then((response) => {
                if (!response.ok) {
                    throw new Error("Network response was not ok");
                }
                return response.json();
            })
            .then((data) => {
                console.log("Sync successful", data);

                setIsError(false);
            })
            .catch((error) => {
                console.error("Sync failed", error);
                setIsError(true);
                Object.values(error).forEach((msg) => {
                    showNotification(msg as string, "error");
                });
            })
            .finally(() => {
                setIsLoading(false);
            });
    }

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
            route("reorder-level"),
            {
                product_id: selectedProduct ? selectedProduct.id : undefined,
                brand_id: selectedBrand ? selectedBrand.id : undefined,
                supplier_id: selectedSupplier ? selectedSupplier.id : undefined,
            },
            {
                preserveState: true,
                replace: true,
                only: ["reorderLevels"],
                onError: (errors) => {
                    console.error(errors);
                    Object.values(errors).forEach((msg) => {
                        showNotification(msg as string, "error");
                    });
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
                <Header name={"Reorder Level"} />
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
                        <>
                            <Button
                                color="primary"
                                variant="contained"
                                onClick={syncItems}
                                endIcon={<Cached />}
                                disabled={isLoading}
                            >
                                Sync Items
                            </Button>
                            <Button
                                color="secondary"
                                variant="contained"
                                onClick={handleBulkUpdate}
                                endIcon={<Update />}
                                disabled={
                                    selectionModel.ids.size < 2 ||
                                    disableBulkUpdateButton
                                }
                            >
                                Update
                            </Button>
                        </>
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
                                <TableCell>Reorder Level</TableCell>
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
                            {reorderLevels &&
                                reorderLevels.length > 0 &&
                                reorderLevels.map((row) => (
                                    <TableRow key={row.id}>
                                        <TableCell>{row.supplier_name}</TableCell>
                                        <TableCell>
                                            {row.product_name}
                                        </TableCell>
                                        <TableCell>{row.brand_name}</TableCell>
                                        <TableCell>{row.size_name}</TableCell>
                                        <TableCell align="right">
                                            {row.reorder_level}
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
                    <DataGrid<ReorderLevel>
                        columns={reorderLevelColumns}
                        rows={reorderLevels || []}
                        columnVisibilityModel={columnVisibilityModel}
                        getRowId={(row: ReorderLevel) => row.id}
                        loading={isLoading}
                        slots={{
                            loadingOverlay: CustomLoadingOverlay,
                        }}
                        checkboxSelection
                        rowSelectionModel={selectionModel}
                        disableRowSelectionOnClick
                        processRowUpdate={processRowUpdate}
                        onRowSelectionModelChange={(newSelection) => {
                            setSelectionModel(newSelection);
                        }}
                    />
                </Box>
            )}
            <CustomMenu role={auth.user.role} />
        </>
    );
};

export default List;
