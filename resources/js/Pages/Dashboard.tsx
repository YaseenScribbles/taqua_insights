import {
    getTop10Products,
    getTop10Suppliers,
    valueFormatterForColumns,
    valueFormatterForLabels,
} from "@/Api/Dashboard";
import Duration from "@/Components/Duration";
import Header from "@/Components/Header";
import CustomMenu from "@/Components/Menu";
import {
    Box,
    CircularProgress,
    Grid,
    Typography,
    useTheme,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { format, startOfMonth } from "date-fns";
import React, { useState } from "react";
import { BarChart, ChartsXAxisProps } from "@mui/x-charts";
import CenterBox from "@/Components/CenterBox";
import { PageProps } from '@inertiajs/core'

const xAxisSettings: ChartsXAxisProps = {
    tickLabelPlacement: "middle",
    tickPlacement: "middle",
    tickLabelStyle: {
        fontSize: "11",
        textAnchor: "end",
        angle: -45,
        textAlign: "left",
        display:"block"
    },
};

interface DashboardProps extends PageProps {}

const Dashboard: React.FC<DashboardProps> = ({auth}) => {
    const [fromDate, setFromDate] = useState<Date | null>(
        startOfMonth(new Date())
    );
    const [toDate, setToDate] = useState<Date | null>(new Date());
    const theme = useTheme();

    const {
        data: top10ProductsByQty,
        isLoading: isTop10ProductsByQtyLoading,
        isError: isTop10ProductsByQtyError,
    } = useQuery({
        queryKey: ["top10ProductsByQty", { fromDate, toDate }],
        queryFn: () =>
            getTop10Products(
                format(fromDate!, "yyyy-MM-dd"),
                format(toDate!, "yyyy-MM-dd"),
                "qty"
            ),
        refetchOnWindowFocus: false,
    });

    const {
        data: top10ProductsByAmount,
        isLoading: istop10ProductsByAmountLoading,
        isError: isTop10ProductsByAmountError,
    } = useQuery({
        queryKey: ["top10ProductsByAmount", { fromDate, toDate }],
        queryFn: () =>
            getTop10Products(
                format(fromDate!, "yyyy-MM-dd"),
                format(toDate!, "yyyy-MM-dd"),
                "amount"
            ),
        refetchOnWindowFocus: false,
    });

    const {
        data: top10SuppliersByQty,
        isLoading: isTop10SuppliersByQtyLoading,
        isError: isTop10SuppliersByQtyError,
    } = useQuery({
        queryKey: ["top10SuppliersByQty", { fromDate, toDate }],
        queryFn: () =>
            getTop10Suppliers(
                format(fromDate!, "yyyy-MM-dd"),
                format(toDate!, "yyyy-MM-dd"),
                "qty"
            ),
        refetchOnWindowFocus: false,
    });

    const {
        data: top10SuppliersByAmount,
        isLoading: istop10SuppliersByAmountLoading,
        isError: isTop10SuppliersByAmountError,
    } = useQuery({
        queryKey: ["top10SuppliersByAmount", { fromDate, toDate }],
        queryFn: () =>
            getTop10Suppliers(
                format(fromDate!, "yyyy-MM-dd"),
                format(toDate!, "yyyy-MM-dd"),
                "amount"
            ),
        refetchOnWindowFocus: false,
    });

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
            >
                <Header name="Dashboard" />
                <Duration
                    fromDate={fromDate}
                    onFromDateChange={setFromDate}
                    toDate={toDate}
                    onToDateChange={setToDate}
                />
            </Box>
            <Grid
                container
                spacing={2}
                justifyContent={"center"}
                paddingBlock={1}
            >
                <Grid size={{ xs: 12, md: 6 }} minHeight={350} boxShadow={2}>
                    <Box
                        justifyContent="center"
                        display="flex"
                        flexDirection="column"
                        columnGap="10"
                    >
                        <Typography variant="h5" align="center">
                            Top 10 Products - Qty
                        </Typography>
                        {top10ProductsByQty ? (
                            <BarChart
                                dataset={top10ProductsByQty}
                                xAxis={[
                                    {
                                        dataKey: "product",
                                        ...xAxisSettings,
                                        height: 80,
                                    },
                                ]}
                                series={[
                                    {
                                        dataKey: "qty",
                                        label: "Qty",
                                    },
                                ]}
                                yAxis={[
                                    {
                                        width: 45,
                                    },
                                ]}
                                height={350}
                                hideLegend
                            />
                        ) : (
                            <CenterBox minHeight={350}>
                                <CircularProgress color="secondary" />
                            </CenterBox>
                        )}
                    </Box>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }} minHeight={350} boxShadow={2}>
                    <Box
                        display="flex"
                        flexDirection="column"
                        justifyContent="center"
                        columnGap="10"
                    >
                        <Typography variant="h5" align="center">
                            Top 10 Products - Amount
                        </Typography>
                        {top10ProductsByAmount ? (
                            <BarChart
                                dataset={top10ProductsByAmount}
                                xAxis={[
                                    {
                                        dataKey: "product",
                                        ...xAxisSettings,
                                        height: 80,
                                    },
                                ]}
                                series={[
                                    {
                                        dataKey: "amount",
                                        label: "Amount",
                                        valueFormatter:
                                            valueFormatterForColumns,
                                        color: theme.palette.primary.main,
                                    },
                                ]}
                                yAxis={[
                                    {
                                        valueFormatter: valueFormatterForLabels,
                                        width: 45,
                                    },
                                ]}
                                height={350}
                                hideLegend
                            />
                        ) : (
                            <CenterBox minHeight={350}>
                                <CircularProgress color="secondary" />
                            </CenterBox>
                        )}
                    </Box>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }} minHeight={350} boxShadow={2}>
                    <Box
                        display="flex"
                        justifyContent="center"
                        flexDirection="column"
                        columnGap="10"
                    >
                        <Typography variant="h5" align="center">
                            Top 10 Suppliers - Qty
                        </Typography>
                        {top10SuppliersByQty ? (
                            <BarChart
                                dataset={top10SuppliersByQty}
                                xAxis={[
                                    {
                                        dataKey: "supplier",
                                        ...xAxisSettings,
                                        height: 80,
                                    },
                                ]}
                                series={[
                                    {
                                        dataKey: "qty",
                                        label: "Qty",
                                        color: theme.palette.secondary.main,
                                    },
                                ]}
                                yAxis={[
                                    {
                                        width: 45,
                                    },
                                ]}
                                height={350}
                                hideLegend
                            />
                        ) : (
                            <CenterBox minHeight={350}>
                                <CircularProgress color="secondary" />
                            </CenterBox>
                        )}
                    </Box>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }} minHeight={350} boxShadow={2}>
                    <Box
                        display="flex"
                        flexDirection="column"
                        justifyContent="center"
                        columnGap="10"
                    >
                        <Typography variant="h5" align="center">
                            Top 10 Suppliers - Amount
                        </Typography>
                        {top10SuppliersByAmount ? (
                            <BarChart
                                dataset={top10SuppliersByAmount}
                                xAxis={[
                                    {
                                        dataKey: "supplier",
                                        ...xAxisSettings,
                                        height: 80,
                                    },
                                ]}
                                series={[
                                    {
                                        dataKey: "amount",
                                        label: "Amount",
                                        valueFormatter:
                                            valueFormatterForColumns,
                                        color: theme.palette.success.main,
                                    },
                                ]}
                                yAxis={[
                                    {
                                        valueFormatter: valueFormatterForLabels,
                                        width: 45,
                                    },
                                ]}
                                height={350}
                                hideLegend
                            />
                        ) : (
                            <CenterBox minHeight={350}>
                                <CircularProgress color="secondary" />
                            </CenterBox>
                        )}
                    </Box>
                </Grid>
            </Grid>
            <CustomMenu role={auth.user.role} />
        </>
    );
};

export default Dashboard;
