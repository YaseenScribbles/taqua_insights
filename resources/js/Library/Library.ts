import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

type ReorderLevelStatus = {
    Supplier: string;
    Product: string;
    Brand: string;
    Size: string;
    L4Stock: number;
    WHStock: number;
    ReorderLevel: number;
    Status: string;
};

export const handleDownload = (data: ReorderLevelStatus[]) => {
    try {
        const worksheet = XLSX.utils.json_to_sheet(data);

        const colWidths = Object.keys(data[0] || {}).map((key) => ({
            wch:
                Math.max(
                    key.length,
                    ...data.map(
                        (row) => `${row[key as keyof typeof row]}`.length
                    )
                ) + 2,
        }));
        worksheet["!cols"] = colWidths;

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Reorder Levels");

        const excelBuffer = XLSX.write(workbook, {
            bookType: "xlsx",
            type: "array",
        });
        const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
        saveAs(blob, "reorder_levels.xlsx");
    } catch (error) {
        throw error
    }
};
