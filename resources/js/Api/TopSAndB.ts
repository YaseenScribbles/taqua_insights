type Suppliers = {
    product: string;
    supplier: string;
    sold: number;
    product_rank: number;
    supplier_rank: number;
    total_sales: number;
};

type Brands = {
    product: string;
    brand: string;
    sold: number;
    product_rank: number;
    brand_rank: number;
    total_sales: number;
};

export const getTopSuppliers = async (
    n: number,
    from: string,
    to: string
): Promise<Suppliers[]> => {
    try {
        const {
            data: { data },
        } = await window.axios.get(
            route("topNSupplierForEachProducts", { n, from, to })
        );
        return data;
    } catch (error) {
        console.log(error);
        return [];
    }
};

export const getTopBrands = async (
    n: number,
    from: string,
    to: string
): Promise<Brands[]> => {
    try {
        const {
            data: { data },
        } = await window.axios.get(
            route("topNBrandsForEachProducts", { n, from, to })
        );
        return data;
    } catch (error) {
        console.log(error);
        return [];
    }
};
