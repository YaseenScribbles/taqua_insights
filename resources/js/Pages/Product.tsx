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
import React, { useEffect, useRef, useState } from "react";
import { PageProps } from "@inertiajs/core";
import CustomMenu from "@/Components/Menu";
import { useQuery } from "@tanstack/react-query";
import { getProductSuppliers, ProductSupplier } from "@/Api/Product";
import { DataGrid, GridColDef, GridFooterContainer } from "@mui/x-data-grid";
import CustomLoadingOverlay from "@/Components/CustomLoadingOverlay";

type Product = {
    id: string;
    name: string;
};

interface ProductPageProps extends PageProps {
    products: Product[];
}

const Product: React.FC<ProductPageProps> = ({ products, auth }) => {
    const theme = useTheme();
    const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
    const productId = selectedProducts.map((product) => product.id).join(",");
    const offsetHeight = 80;
    const [headerHeight, setHeaderHeight] = useState(0);
    const headerRef = useRef<HTMLDivElement>(null);

    const { data, isLoading, isError } = useQuery({
        queryKey: ["productsuppliers", productId],
        queryFn: () => getProductSuppliers(productId),
        enabled: !!productId,
        refetchOnWindowFocus: false,
    });

    const totalPurchase =
        data?.reduce((acc, curr) => acc + +curr.purchase, 0) ?? 0;
    const totalSales = data?.reduce((acc, curr) => acc + +curr.sales, 0) ?? 0;
    const totalStock = data?.reduce((acc, curr) => acc + +curr.stock, 0) ?? 0;
    const salePercentage = (totalSales / totalPurchase) * 100;

    const columns: GridColDef[] = [
        {
            field: "supplier",
            headerName: "Supplier",
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

    useEffect(() => {
        const headerElement = headerRef.current;
        if (!headerElement) return;

        const observer = new ResizeObserver(entries => {
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
                <Header
                    name={`Product ${
                        isNaN(salePercentage)
                            ? ""
                            : `(${salePercentage.toFixed(2)}%)`
                    }`}
                />
                <Autocomplete
                    multiple
                    disablePortal
                    options={products}
                    renderInput={(params) => (
                        <TextField {...params} label="Product" />
                    )}
                    getOptionLabel={(option: Product) => option.name}
                    isOptionEqualToValue={(option, value) =>
                        option.id === value.id
                    }
                    getOptionKey={(option) => option.id}
                    sx={{
                        width: isMobile ? 300 : 500,
                        marginInline: "auto",
                    }}
                    value={selectedProducts}
                    onChange={(_, value) => {
                        setSelectedProducts(value);
                    }}
                />
            </Box>
            {isMobile ? (
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Supplier</TableCell>
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
                                    <TableCell colSpan={isMobile ? 2 : 4}>
                                        <LinearProgress />
                                    </TableCell>
                                </TableRow>
                            )}
                            {data &&
                                data.length > 0 &&
                                data.map((i, index) => (
                                    <TableRow key={index}>
                                        <TableCell>{i.supplier}</TableCell>
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
                                <TableCell>Summary</TableCell>
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
                    height={`calc(100dvh - ${offsetHeight + headerHeight}px)`}
                    overflow={"auto"}
                >
                    <DataGrid
                        columns={columns}
                        rows={data || []}
                        getRowId={(row: ProductSupplier) => `${row.supplier}`}
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
                                        >
                                            Summary
                                        </Typography>
                                        <Typography align="right">
                                            Purchase: {totalPurchase}
                                        </Typography>
                                        <Typography align="right">
                                            Sales: {totalSales}
                                        </Typography>
                                        <Typography align="right">
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

export default Product;
