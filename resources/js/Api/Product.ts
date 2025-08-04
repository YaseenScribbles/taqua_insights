export type ProductSupplier = {
    supplier:string;
    purchase: number;
    sales: number;
    stock: number;
};

export async function getProductSuppliers(
    productId: string
): Promise<ProductSupplier[]> {
    if (!productId) return [];

    const {
        data: { data },
    } = await window.axios.get(
        route("ProductSuppliers", { product_id: productId })
    );
    return data;
}
