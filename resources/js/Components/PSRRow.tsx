import { InvoiceProducts } from "@/Api/PSR";
import { ArrowDropDown, ArrowDropUp } from "@mui/icons-material";
import {
    Collapse,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
} from "@mui/material";
import React, { useState } from "react";

interface PSRRowProps {
    data: InvoiceProducts;
}

const PSRRow: React.FC<PSRRowProps> = ({ data }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
                <TableCell>
                    <IconButton onClick={() => setIsOpen(!isOpen)} size="small">
                        {isOpen ? <ArrowDropUp /> : <ArrowDropDown />}
                    </IconButton>
                </TableCell>
                <TableCell align="right">{data.product}</TableCell>
                <TableCell align="right">{data.purchase}</TableCell>
                <TableCell align="right">
                    {data.l2sales + data.l4sales}
                </TableCell>
                <TableCell align="right">
                    {data.l2stock + data.l4stock + data.whstock}
                </TableCell>
            </TableRow>
            <TableRow>
                <TableCell sx={{ paddingBlock: 0 }} colSpan={5}>
                    <Collapse in={isOpen} timeout="auto" unmountOnExit>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>L2 S.</TableCell>
                                    <TableCell>L2 St.</TableCell>
                                    <TableCell>L4 S.</TableCell>
                                    <TableCell>L4 St.</TableCell>
                                    <TableCell>PR</TableCell>
                                    <TableCell>WH St.</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                <TableRow>
                                    <TableCell>{data.l2sales}</TableCell>
                                    <TableCell>{data.l2stock}</TableCell>
                                    <TableCell>{data.l4sales}</TableCell>
                                    <TableCell>{data.l4stock}</TableCell>
                                    <TableCell>{data.partyreturn}</TableCell>
                                    <TableCell>{data.whstock}</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </Collapse>
                </TableCell>
            </TableRow>
        </>
    );
};

export default PSRRow;
