import { Box } from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import React from "react";

interface DurationProps {
    fromDate: Date | null;
    toDate: Date | null;
    onFromDateChange: (date: Date | null) => void;
    onToDateChange: (date: Date | null) => void;
}

const Duration: React.FC<DurationProps> = ({
    fromDate,
    toDate,
    onFromDateChange,
    onToDateChange,
}) => {
    return (
        <Box
            display={"flex"}
            flexWrap={{ xs: "wrap", sm: "nowrap" }}
            gap={"1rem"}
            justifyContent={"center"}
            padding={"1rem"}
        >
            <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                    label="From"
                    value={fromDate}
                    onChange={onFromDateChange}
                    format="dd/MM/yyyy"
                    sx={{
                        width: "10rem",
                    }}
                />
            </LocalizationProvider>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                    label="To"
                    value={toDate}
                    onChange={onToDateChange}
                    format="dd/MM/yyyy"
                    sx={{
                        width: "10rem",
                    }}
                />
            </LocalizationProvider>
        </Box>
    );
};

export default Duration;
