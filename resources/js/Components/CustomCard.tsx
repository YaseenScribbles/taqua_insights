import { Box, Card, CardHeader, CardContent, Typography, Avatar, Collapse, IconButton } from "@mui/material";
import { ExpandMore, TrendingUp } from "@mui/icons-material";
import React, { useState } from "react";

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

interface Props {
    type: "Supplier" | "Brand";
    data: SupplierGroup | BrandGroup;
}

const CustomCard: React.FC<Props> = ({ type, data }) => {
    const [expanded, setExpanded] = useState(true); // Changed to true

    const items = type === "Supplier"
        ? (data as SupplierGroup).suppliers
        : (data as BrandGroup).brands;

    return (
        <Card
            sx={{
                bgcolor: '#18181b',
                border: '1px solid #27272a',
                '&:hover': {
                    borderColor: 'rgba(254, 211, 44, 0.5)',
                },
                transition: 'all 0.3s',
                mb: 2
            }}
        >
            <CardHeader
                avatar={
                    <Avatar
                        sx={{
                            bgcolor: 'rgba(254, 211, 44, 0.2)',
                            color: 'primary.main',
                            border: '2px solid rgba(254, 211, 44, 0.4)',
                            fontWeight: 'bold'
                        }}
                    >
                        {data.product_rank}
                    </Avatar>
                }
                action={
                    <IconButton
                        onClick={() => setExpanded(!expanded)}
                        sx={{
                            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.3s',
                            color: 'text.secondary'
                        }}
                    >
                        <ExpandMore />
                    </IconButton>
                }
                title={
                    <Typography variant="h6" color="white" fontWeight={600}>
                        {data.product}
                    </Typography>
                }
                subheader={
                    <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                        <TrendingUp sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                            Total Sales:{' '}
                            <span style={{ color: '#FED32C', fontWeight: 600 }}>
                                {data.total_sales.toLocaleString()}
                            </span>{' '}
                            Pcs
                        </Typography>
                    </Box>
                }
            />

            <Collapse in={expanded} timeout="auto" unmountOnExit>
                <CardContent sx={{ pt: 1, bgcolor: 'rgba(24, 24, 27, 0.5)' }}>
                    <Typography
                        variant="subtitle2"
                        color="text.secondary"
                        sx={{ mb: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}
                    >
                        Top {items?.length || 0} {type === 'Supplier' ? 'Suppliers' : 'Brands'}
                    </Typography>

                    {items?.map((item) => (
                        <Card
                            key={item.name}
                            sx={{
                                bgcolor: 'rgba(39, 39, 42, 0.5)',
                                border: '1px solid rgba(63, 63, 70, 0.5)',
                                '&:hover': {
                                    borderColor: 'rgba(254, 211, 44, 0.5)',
                                },
                                mb: 1.5
                            }}
                        >
                            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                                <Box display="flex" alignItems="center" justifyContent="space-between">
                                    <Box display="flex" alignItems="center" gap={2}>
                                        <Avatar
                                            sx={{
                                                width: 32,
                                                height: 32,
                                                bgcolor: 'rgba(255, 111, 97, 0.2)',
                                                color: 'secondary.main',
                                                fontSize: '0.875rem',
                                                fontWeight: 'bold',
                                                border: '2px solid rgba(255, 111, 97, 0.4)'
                                            }}
                                        >
                                            {item.rank}
                                        </Avatar>
                                        <Typography variant="body1" fontWeight={500} color="white">
                                            {item.name}
                                        </Typography>
                                    </Box>
                                    <Box textAlign="right">
                                        <Typography variant="h6" color="secondary" fontWeight="bold">
                                            {item.sold.toLocaleString()}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            pcs sold
                                        </Typography>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    ))}
                </CardContent>
            </Collapse>
        </Card>
    );
};

export default CustomCard;
