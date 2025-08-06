import React, { useState } from "react";
import { PageProps } from "@inertiajs/core";
import { Invoice } from "@/Api/PSR";
import Header from "@/Components/Header";
import {
    Box,
    Autocomplete,
    TextField,
    useTheme,
    useMediaQuery,
    TableContainer,
    TableHead,
    TableRow,
    TableCell,
    Table,
    TableBody,
    LinearProgress,
    TableFooter,
    Typography,
} from "@mui/material";
import CustomMenu from "@/Components/Menu";
import { useQuery } from "@tanstack/react-query";
import { getLegacy } from "@/Api/Legacy";

interface LegacyProps extends PageProps {
    suppliers: string[];
    products: string[];
}

const Legacy: React.FC<LegacyProps> = ({ auth, products, suppliers }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
    const [selectedSupplier, setSelectedSupplier] = useState("");
    const [selectedProduct, setSelectedProduct] = useState("");

    const { data, isLoading } = useQuery({
        queryKey: ["legacy", selectedSupplier, selectedProduct],
        queryFn: () => getLegacy(selectedSupplier, selectedProduct),
        enabled: !!selectedSupplier || !!selectedProduct,
    });

    const totalPurchase =
        data?.reduce((acc, curr) => acc + +curr.purchase, 0) ?? 0;
    const totalSales = data?.reduce((acc, curr) => acc + +curr.sales, 0) ?? 0;

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
                    name={`Legacy ${
                        isNaN(salePercentage)
                            ? ""
                            : `(${salePercentage.toFixed(2)}%)`
                    }`}
                />
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
                        getOptionLabel={(option: string) => option}
                        sx={{
                            width: isMobile ? 300 : 400,
                        }}
                        value={selectedSupplier}
                        onChange={(_, value) => {
                            setSelectedSupplier(value ?? "");
                        }}
                    />
                    <Autocomplete
                        disablePortal
                        options={products}
                        renderInput={(params) => (
                            <TextField {...params} label="Product" />
                        )}
                        getOptionLabel={(option: string) => option}
                        sx={{
                            width: isMobile ? 300 : 400,
                        }}
                        value={selectedProduct}
                        onChange={(_, value) => {
                            setSelectedProduct(value ?? "");
                        }}
                    />
                </Box>
            </Box>
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Supplier</TableCell>
                            <TableCell>Product</TableCell>
                            {isMobile ? (
                                <TableCell>
                                    <Box
                                        display={"flex"}
                                        flexDirection={"column"}
                                    >
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
                                    </Box>
                                </TableCell>
                            ) : (
                                <>
                                    <TableCell align="right">
                                        Purchase
                                    </TableCell>
                                    <TableCell align="right">Sales</TableCell>
                                </>
                            )}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {isLoading && (
                            <TableRow>
                                <TableCell colSpan={isMobile ? 3 : 4}>
                                    <LinearProgress />
                                </TableCell>
                            </TableRow>
                        )}
                        {data &&
                            data.length > 0 &&
                            data.map((legacy) => (
                                <TableRow
                                    key={`${legacy.product}-${legacy.supplier}`}
                                >
                                    <TableCell>{legacy.supplier}</TableCell>
                                    <TableCell>{legacy.product}</TableCell>
                                    {isMobile ? (
                                        <TableCell align="right">
                                            <Box
                                                display={"flex"}
                                                flexDirection={"column"}
                                            >
                                                <Typography variant="inherit">
                                                    {legacy.purchase}
                                                </Typography>
                                                <Typography variant="inherit">
                                                    {legacy.sales}
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                    ) : (
                                        <>
                                            <TableCell align="right">
                                                {legacy.purchase}
                                            </TableCell>
                                            <TableCell align="right">
                                                {legacy.sales}
                                            </TableCell>
                                        </>
                                    )}
                                </TableRow>
                            ))}
                    </TableBody>
                    <TableFooter>
                        <TableRow>
                            <TableCell colSpan={2}>Summary</TableCell>
                            {isMobile ? (
                                <TableCell align="right">
                                    <Box
                                        display={"flex"}
                                        flexDirection={"column"}
                                    >
                                        <Typography variant="inherit">
                                            {totalPurchase}
                                        </Typography>
                                        <Typography variant="inherit">
                                            {totalSales}
                                        </Typography>
                                    </Box>
                                </TableCell>
                            ) : (
                                <>
                                    <TableCell align="right">
                                        {totalPurchase}
                                    </TableCell>
                                    <TableCell align="right">
                                        {totalSales}
                                    </TableCell>
                                </>
                            )}
                        </TableRow>
                    </TableFooter>
                </Table>
            </TableContainer>
            <CustomMenu role={auth.user.role} />
        </>
    );
};

export default Legacy;
