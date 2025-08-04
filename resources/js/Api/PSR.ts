import axios from "axios";

export type Invoice = {
    id: number;
    grn: string;
};

export type InvoiceProducts = {
    product: string;
    purchase: number;
    l2sales: number;
    l2stock: number;
    l4sales: number;
    l4stock: number;
    partyreturn: number;
    whstock: number;
};

export async function getInvoices(
    supplierId: number
): Promise<Invoice[]> {
    if (!supplierId) return [];
    const {
        data: { data },
    } = await axios.get(route("invoices", { supplier_id: supplierId }));
    return data;
}

export async function getInvoiceProducts(
    supplierId: number,
    invoices = ''
): Promise<InvoiceProducts[]> {
    if (!supplierId) return [];
    const {
        data: { data },
    } = await axios.get(route("InvoiceProducts", { supplier_id: supplierId, invoices: invoices }));
    return data;
}
