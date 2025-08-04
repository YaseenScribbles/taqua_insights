import React from "react";
import { DataGrid, GridRowsProp, GridColDef } from "@mui/x-data-grid";

interface GridProps {
    rows: GridRowsProp;
    columns: GridColDef[];
}

const Grid: React.FC<GridProps> = ({ rows, columns }) => {
    return <DataGrid rows={rows} columns={columns} />;
};

export default Grid;
