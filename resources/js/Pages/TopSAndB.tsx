import Duration from "@/Components/Duration";
import Header from "@/Components/Header";
import CustomMenu from "@/Components/Menu";
import {
    Box,
    Button,
    ButtonGroup,
    FormControl,
    Grid,
    InputLabel,
    LinearProgress,
    MenuItem,
    Select,
    useTheme,
} from "@mui/material";
import { format, startOfMonth } from "date-fns";
import React, { useMemo, useState } from "react";
import { PageProps } from "@inertiajs/core";
import { useQuery } from "@tanstack/react-query";
import { getTopBrands, getTopSuppliers } from "@/Api/TopSAndB";
import CustomCard from "@/Components/CustomCard";

interface Props extends PageProps {}

const TopSAndB: React.FC<Props> = ({ auth }) => {
    const theme = useTheme();
    const [fromDate, setFromDate] = useState<Date | null>(
        startOfMonth(new Date())
    );
    const [toDate, setToDate] = useState<Date | null>(new Date());
    const [nRows, setNrows] = useState(5);
    const [mode, setMode] = useState<"Supplier" | "Brand">("Supplier");

    const { data: topSuppliers, isLoading: isSuppliersLoading } = useQuery({
        queryKey: [
            `top${nRows}SuppliersForEachProducts`,
            fromDate,
            toDate,
            nRows,
        ],
        queryFn: () =>
            getTopSuppliers(
                nRows,
                format(fromDate!, "yyyy-MM-dd"),
                format(toDate!, "yyyy-MM-dd")
            ),
        enabled: mode === "Supplier",
    });

    const { data: topBrands, isLoading: isBrandsLoading } = useQuery({
        queryKey: [`top${nRows}BrandsForEachProducts`, fromDate, toDate, nRows],
        queryFn: () =>
            getTopBrands(
                nRows,
                format(fromDate!, "yyyy-MM-dd"),
                format(toDate!, "yyyy-MM-dd")
            ),
        enabled: mode === "Brand",
    });

    const groupedBrands = useMemo(() => {
        type BrandGroup = {
            product: string;
            product_rank: number;
            total_sales: number;
            brands: Array<{
                name: string;
                sold: number;
                rank: number;
            }>;
        };

        const grouped: { [product: string]: BrandGroup } = {};

        topBrands?.forEach((brand) => {
            if (!grouped[brand.product]) {
                grouped[brand.product] = {
                    product: brand.product,
                    product_rank: brand.product_rank,
                    total_sales: +(+brand.total_sales).toFixed(2),
                    brands: [],
                };
            }
            grouped[brand.product].brands.push({
                name: brand.brand,
                sold: +(+brand.sold).toFixed(2),
                rank: brand.brand_rank,
            });
        });

        // Sort by product_rank
        return Object.values(grouped).sort(
            (a, b) => a.product_rank - b.product_rank
        );
    }, [topBrands]);

    const groupedSuppliers = useMemo(() => {
        type SupplierGroup = {
            product: string;
            product_rank: number;
            total_sales: number;
            suppliers: Array<{
                name: string;
                sold: number;
                rank: number;
            }>;
        };

        const grouped: { [product: string]: SupplierGroup } = {};

        topSuppliers?.forEach((supplier) => {
            if (!grouped[supplier.product]) {
                grouped[supplier.product] = {
                    product: supplier.product,
                    product_rank: supplier.product_rank,
                    total_sales: +(+supplier.total_sales).toFixed(2),
                    suppliers: [],
                };
            }
            grouped[supplier.product].suppliers.push({
                name: supplier.supplier,
                sold: +(+supplier.sold).toFixed(2),
                rank: supplier.supplier_rank,
            });
        });

        // Sort by product_rank
        return Object.values(grouped).sort(
            (a, b) => a.product_rank - b.product_rank
        );
    }, [topSuppliers]);

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
                <Header name="Product Rankings" />
                <Box
                    display={"flex"}
                    flexWrap={{ xs: "wrap", sm: "nowrap" }}
                    justifyContent={"center"}
                    gap={1}
                >
                    <Duration
                        fromDate={fromDate}
                        onFromDateChange={setFromDate}
                        toDate={toDate}
                        onToDateChange={setToDate}
                    />
                    <FormControl>
                        <InputLabel id="n-rows">Rows</InputLabel>
                        <Select
                            labelId="n-rows"
                            id="rows"
                            value={nRows}
                            onChange={(e) => setNrows(e.target.value)}
                            label="Rows"
                        >
                            <MenuItem value={5}>5</MenuItem>
                            <MenuItem value={10}>10</MenuItem>
                            <MenuItem value={15}>15</MenuItem>
                            <MenuItem value={20}>20</MenuItem>
                        </Select>
                    </FormControl>
                    <ButtonGroup>
                        <Button
                            variant={
                                mode === "Supplier" ? "contained" : "outlined"
                            }
                            onClick={() => setMode("Supplier")}
                        >
                            Suppliers
                        </Button>
                        <Button
                            variant={
                                mode === "Brand" ? "contained" : "outlined"
                            }
                            onClick={() => setMode("Brand")}
                        >
                            Brands
                        </Button>
                    </ButtonGroup>
                </Box>
            </Box>
            {isSuppliersLoading || isBrandsLoading ? (
                <Box width="100%" padding={2}>
                    <LinearProgress />
                </Box>
            ) : (
                <Grid
                    container
                    spacing={2}
                    justifyContent={"center"}
                    padding={1}
                >
                    {(mode === "Supplier"
                        ? groupedSuppliers
                        : groupedBrands
                    ).map((i) => (
                        <Grid size={{ xs: 12, md: 6, lg: 4 }} boxShadow={2}>
                            <CustomCard key={i.product} data={i} type={mode} />
                        </Grid>
                    ))}
                </Grid>
            )}
            <CustomMenu role={auth.user.role} />
        </>
    );
};

export default TopSAndB;
