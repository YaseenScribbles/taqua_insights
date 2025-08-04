type top10Products = {
    product: string;
    qty: string;
    amount: string;
};

type top10Suppliers = {
    product: string;
    qty: string;
    amount: string;
};

export const getTop10Products = async (
    from_date: string,
    to_date: string,
    order_by: string
): Promise<top10Products[]> => {
    const {
        data: { data },
    } = await window.axios.get(
        route("top10Products", { from_date, to_date, order_by })
    );

    return data;
};

export const getTop10Suppliers = async (
    from_date: string,
    to_date: string,
    order_by: string
): Promise<top10Suppliers[]> => {
    const {
        data: { data },
    } = await window.axios.get(
        route("top10Suppliers", { from_date, to_date, order_by })
    );
    return data;
};

export function valueFormatterForColumns(num: number | null) {
    if (!num) {
        num = 0;
    }
    if (num >= 10000000) return `₹${(num / 1_00_00_000).toFixed(2)}Cr`;
    if (num >= 100000) return `₹${(num / 1_00_000).toFixed(2)}L`;
    if (num >= 1000) return `₹${(num / 1_000).toFixed(2)}K`;
    return `₹${num.toFixed(2)}`;
}

export function valueFormatterForLabels(num: number | null) {
    if (!num) {
        num = 0;
    }
    if (num >= 10000000) return `₹${(num / 1_00_00_000).toFixed(0)}Cr`;
    if (num >= 100000) return `₹${(num / 1_00_000).toFixed(0)}L`;
    if (num >= 1000) return `₹${(num / 1_000).toFixed(0)}K`;
    return `₹${num.toFixed(2)}`;
}
