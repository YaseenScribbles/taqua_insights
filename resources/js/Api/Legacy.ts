export type Legacy = {
    supplier: string;
    product: string;
    purchase: number;
    sales: number;
};

export async function getLegacy(
    supplier = "",
    product = ""
): Promise<Legacy[]> {
    if (!supplier && !product) {
        return [];
    }

    const {
        data: { data },
    } = await window.axios.get(
        route("legacy.report", {
            supplier,
            product,
        })
    );
    return data;
}
