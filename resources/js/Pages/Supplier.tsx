import Header from "@/Components/Header";
import {
    Autocomplete,
    Box,
    LinearProgress,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableFooter,
    TableHead,
    TableRow,
    TextField,
    Typography,
    useMediaQuery,
    useTheme,
} from "@mui/material";
import React, {  useState } from "react";
import { PageProps } from "@inertiajs/core";
import CustomMenu from "@/Components/Menu";
import { useQuery } from "@tanstack/react-query";
import { getSupplierProducts, SupplierProduct } from "@/Api/Supplier";
import { DataGrid, GridColDef, GridFooterContainer } from "@mui/x-data-grid";
import CustomLoadingOverlay from "@/Components/CustomLoadingOverlay";

type Supplier = {
    id: string;
    name: string;
};

interface SupplierPageProps extends PageProps {
    suppliers: Supplier[];
}

const columns: GridColDef[] = [
    {
        field: "location",
        headerName: "Location",
        flex: 1,
    },
    {
        field: "product",
        headerName: "Product",
        flex: 1,
    },
    {
        field: "purchase",
        headerName: "Purchase",
        type: "number",
        flex: 1,
        align: "right",
        headerAlign: "right",
    },
    {
        field: "sales",
        headerName: "Sales",
        type: "number",
        flex: 1,
        align: "right",
        headerAlign: "right",
    },
    {
        field: "stock",
        headerName: "Stock",
        type: "number",
        flex: 1,
        align: "right",
        headerAlign: "right",
    },
];

const Supplier: React.FC<SupplierPageProps> = ({ suppliers, auth }) => {
    const theme = useTheme();
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(
        null
    );
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
    const offsetHeight = 195;

    const { data, isLoading, isError } = useQuery({
        queryKey: ["supplierproducts", selectedSupplier?.id],
        queryFn: () => getSupplierProducts(+selectedSupplier!.id),
        enabled: !!selectedSupplier,
        refetchOnWindowFocus: false,
    });

    const totalPurchase =
        data?.reduce((acc, curr) => acc + +curr.purchase, 0) ?? 0;
    const totalSales = data?.reduce((acc, curr) => acc + +curr.sales, 0) ?? 0;
    const totalStock = data?.reduce((acc, curr) => acc + +curr.stock, 0) ?? 0;
    const salePercentage = (totalSales / totalPurchase) * 100;

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
                    name={`Supplier ${
                        isNaN(salePercentage)
                            ? ""
                            : `(${salePercentage.toFixed(2)}%)`
                    }`}
                />
                <Autocomplete
                    disablePortal
                    options={suppliers}
                    renderInput={(params) => (
                        <TextField {...params} label="Supplier" />
                    )}
                    getOptionLabel={(option: Supplier) => option.name}
                    isOptionEqualToValue={(option, value) =>
                        option.id === value.id
                    }
                    getOptionKey={(option) => option.id}
                    sx={{
                        width: 300,
                        marginInline: "auto",
                    }}
                    value={selectedSupplier}
                    onChange={(_, value) => {
                        setSelectedSupplier(value);
                    }}
                />
            </Box>
            {isMobile ? (
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Location</TableCell>
                                <TableCell>Product</TableCell>
                                <TableCell>
                                    <Box display="flex" flexDirection="column">
                                        <Typography
                                            variant="inherit"
                                            align="right"
                                        >
                                            Purchase
                                        </Typography>
                                        <Typography
                                            variant="inherit"
                                            align="right"
                                        >
                                            Sales
                                        </Typography>
                                        <Typography
                                            variant="inherit"
                                            align="right"
                                        >
                                            Stock
                                        </Typography>
                                    </Box>
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {isLoading && (
                                <TableRow>
                                    <TableCell colSpan={isMobile ? 3 : 5}>
                                        <LinearProgress />
                                    </TableCell>
                                </TableRow>
                            )}
                            {data &&
                                data.length > 0 &&
                                data.map((i, index) => (
                                    <TableRow key={index}>
                                        <TableCell>{i.location}</TableCell>
                                        <TableCell>{i.product}</TableCell>
                                        <TableCell>
                                            <Box
                                                display="flex"
                                                flexDirection="column"
                                            >
                                                <Typography
                                                    variant="inherit"
                                                    align="right"
                                                >
                                                    {i.purchase}
                                                </Typography>
                                                <Typography
                                                    variant="inherit"
                                                    align="right"
                                                >
                                                    {i.sales}
                                                </Typography>
                                                <Typography
                                                    variant="inherit"
                                                    align="right"
                                                >
                                                    {i.stock}
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ))}
                        </TableBody>
                        <TableFooter>
                            <TableRow>
                                <TableCell colSpan={2}>Summary</TableCell>
                                <TableCell>
                                    <Box display="flex" flexDirection="column">
                                        <Typography
                                            variant="inherit"
                                            align="right"
                                        >
                                            {totalPurchase}
                                        </Typography>
                                        <Typography
                                            variant="inherit"
                                            align="right"
                                        >
                                            {totalSales}
                                        </Typography>
                                        <Typography
                                            variant="inherit"
                                            align="right"
                                        >
                                            {totalStock}
                                        </Typography>
                                    </Box>
                                </TableCell>
                            </TableRow>
                        </TableFooter>
                    </Table>
                </TableContainer>
            ) : (
                <Box
                    height={`calc(100dvh - ${offsetHeight}px)`}
                    overflow={"auto"}
                >
                    <DataGrid
                        rows={data || []}
                        columns={columns}
                        getRowId={(row: SupplierProduct) =>
                            `${row.location}-${row.product}`
                        }
                        loading={isLoading}
                        slots={{
                            loadingOverlay: CustomLoadingOverlay,
                            footer: () => (
                                <GridFooterContainer>
                                    <Box
                                        width="100%"
                                        display="flex"
                                        justifyContent="space-between"
                                        px={2}
                                        py={1}
                                    >
                                        <Typography
                                            variant="body1"
                                            fontWeight="bold"
                                            flexGrow={2}
                                        >
                                            Summary
                                        </Typography>
                                        <Typography flexGrow={1} align="right">
                                            Purchase: {totalPurchase}
                                        </Typography>
                                        <Typography flexGrow={1} align="right">
                                            Sales: {totalSales}
                                        </Typography>
                                        <Typography flexGrow={1} align="right">
                                            Stock: {totalStock}
                                        </Typography>
                                    </Box>
                                </GridFooterContainer>
                            ),
                        }}
                    />
                </Box>
            )}

            <CustomMenu role={auth.user.role} />
        </>
    );
};

export default Supplier;
