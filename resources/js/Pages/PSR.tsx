import Header from "@/Components/Header";
import {
    Box,
    Autocomplete,
    TextField,
    useTheme,
    useMediaQuery,
    Typography,
    TableContainer,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    LinearProgress,
    TableFooter,
    Table,
} from "@mui/material";
import React, { useEffect, useRef, useState } from "react";
import { PageProps } from "@inertiajs/core";
import CustomMenu from "@/Components/Menu";
import { useQuery } from "@tanstack/react-query";
import {
    getInvoiceProducts,
    getInvoices,
    Invoice,
    InvoiceProducts,
} from "@/Api/PSR";
import { DataGrid, GridColDef, GridFooterContainer } from "@mui/x-data-grid";
import CustomLoadingOverlay from "@/Components/CustomLoadingOverlay";
import PSRRow from "@/Components/PSRRow";

type Supplier = {
    id: number;
    name: string;
};

type InvoiceProps = PageProps & {
    suppliers: Supplier[];
};

const columns: GridColDef[] = [
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
        field: "l2sales",
        headerName: "L2 Sales",
        type: "number",
        flex: 1,
        align: "right",
        headerAlign: "right",
    },
    {
        field: "l2stock",
        headerName: "L2 Stock",
        type: "number",
        flex: 1,
        align: "right",
        headerAlign: "right",
    },
    {
        field: "l4sales",
        headerName: "L4 Sales",
        type: "number",
        flex: 1,
        align: "right",
        headerAlign: "right",
    },
    {
        field: "l4stock",
        headerName: "L4 Stock",
        type: "number",
        flex: 1,
        align: "right",
        headerAlign: "right",
    },
    {
        field: "partyreturn",
        headerName: "Party Return",
        type: "number",
        flex: 1,
        align: "right",
        headerAlign: "right",
    },
    {
        field: "whstock",
        headerName: "WH Stock",
        type: "number",
        flex: 1,
        align: "right",
        headerAlign: "right",
    },
];

const PSR: React.FC<InvoiceProps> = ({ suppliers, auth }) => {
    const theme = useTheme();
    const headerRef = useRef<HTMLDivElement>(null);
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(
        null
    );
    const [selectedInvoices, setSelectedInvoices] = useState<Invoice[]>([]);
    const offsetHeight = 80;
    const [headerHeight, setHeaderHeight] = useState(0);
    const invoiceQuery = selectedInvoices
        .map((invoice) => invoice.id)
        .join(",");

    const { data: invoices, isLoading: isInvoiceLoading } = useQuery({
        queryKey: ["invoices", selectedSupplier?.id],
        queryFn: () => getInvoices(selectedSupplier!.id),
        enabled: !!selectedSupplier,
        refetchOnWindowFocus: false,
    });

    const {
        data: psr,
        isLoading: isPsrLoading,
        isError: isPsrError,
    } = useQuery({
        queryKey: ["psr", selectedSupplier?.id, invoiceQuery],
        queryFn: () => getInvoiceProducts(selectedSupplier!.id, invoiceQuery),
        enabled: !!selectedSupplier,
        refetchOnWindowFocus: false,
    });

    const totalPurchase =
        psr?.reduce((acc, curr) => acc + +curr.purchase, 0) ?? 0;
    const l2Sales = psr?.reduce((acc, curr) => acc + +curr.l2sales, 0) ?? 0;
    const l2Stock = psr?.reduce((acc, curr) => acc + +curr.l2stock, 0) ?? 0;
    const l4Sales = psr?.reduce((acc, curr) => acc + +curr.l4sales, 0) ?? 0;
    const l4Stock = psr?.reduce((acc, curr) => acc + +curr.l4stock, 0) ?? 0;
    const partyReturn =
        psr?.reduce((acc, curr) => acc + +curr.partyreturn, 0) ?? 0;
    const whstock = psr?.reduce((acc, curr) => acc + +curr.whstock, 0) ?? 0;

    const salePercentage = ((l2Sales + l4Sales) / totalPurchase) * 100;

    useEffect(() => {
        const headerElement = headerRef.current;
        if (!headerElement) return;

        const observer = new ResizeObserver((entries) => {
            for (let entry of entries) {
                setHeaderHeight(entry.contentRect.height);
            }
        });

        observer.observe(headerElement);

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
                    name={`P S R ${
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
                        getOptionLabel={(option: Supplier) => option.name}
                        isOptionEqualToValue={(option, value) =>
                            option.id === value.id
                        }
                        getOptionKey={(option) => option.id}
                        sx={{
                            width: isMobile ? 300 : 400,
                        }}
                        value={selectedSupplier}
                        onChange={(_, value) => {
                            setSelectedSupplier(value);
                        }}
                    />
                    <Autocomplete
                        multiple
                        disablePortal
                        options={invoices || []}
                        renderInput={(params) => (
                            <TextField {...params} label="Grn" />
                        )}
                        getOptionLabel={(option: Invoice) => option.grn}
                        isOptionEqualToValue={(option, value) =>
                            option.id === value.id
                        }
                        getOptionKey={(option) => option.id}
                        sx={{
                            width: isMobile ? 300 : 400,
                        }}
                        value={selectedInvoices}
                        onChange={(_, value) => {
                            setSelectedInvoices(value);
                        }}
                        loading={isInvoiceLoading}
                    />
                </Box>
            </Box>
            {isMobile ? (
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell></TableCell>
                                <TableCell>Product</TableCell>
                                <TableCell>Purchase</TableCell>
                                <TableCell>Sales</TableCell>
                                <TableCell>Stock</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {isPsrError && (
                                <TableRow>
                                    <TableCell colSpan={5} align="center">
                                        <Typography variant="body1">
                                            Network Error
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                            {isPsrLoading && (
                                <TableRow>
                                    <TableCell colSpan={5}>
                                        <LinearProgress />
                                    </TableCell>
                                </TableRow>
                            )}
                            {psr &&
                                psr.length > 0 &&
                                psr.map((data: InvoiceProducts) => (
                                    <PSRRow key={data.product} data={data} />
                                ))}
                        </TableBody>
                        <TableFooter>
                            <TableRow>
                                <TableCell colSpan={2}>Summary</TableCell>
                                <TableCell align="right">
                                    {totalPurchase}
                                </TableCell>
                                <TableCell align="right">
                                    {l2Sales + l4Sales}
                                </TableCell>
                                <TableCell align="right">
                                    {l2Stock + l4Stock + whstock}
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
                        rows={psr || []}
                        getRowId={(row: InvoiceProducts) => row.product}
                        loading={isPsrLoading}
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
                                            L2 Sales: {l2Sales}
                                        </Typography>
                                        <Typography align="right">
                                            L2 Stock: {l2Stock}
                                        </Typography>
                                        <Typography align="right">
                                            L4 Sales: {l4Sales}
                                        </Typography>
                                        <Typography align="right">
                                            L4 Stock: {l4Stock}
                                        </Typography>
                                        <Typography align="right">
                                            Return: {partyReturn}
                                        </Typography>
                                        <Typography align="right">
                                            WH Stock: {whstock}
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

export default PSR;
