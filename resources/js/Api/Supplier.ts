export type SupplierProduct = {
    location: string;
    product: string;
    purchase: number;
    sales: number;
    stock: number;
};

export async function getSupplierProducts(
    supplierId: number
): Promise<SupplierProduct[]> {
    if (!supplierId) return [];

    const {
        data: { data },
    } = await window.axios.get(
        route("SupplierProducts", { supplier_id: supplierId })
    );
    return data;
}
