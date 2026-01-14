import React from 'react';
import MuiTable from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

interface Column<T> {
  key: string;
  header: string;
  render: (item: T) => React.ReactNode;
  width?: string;
}

interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
}

export function Table<T extends { id: string }>({
  data,
  columns,
  onRowClick,
  emptyMessage = '暫無資料',
}: TableProps<T>) {
  return (
    <TableContainer component={Paper}>
      <MuiTable>
        <TableHead>
          <TableRow>
            {columns.map((column) => (
              <TableCell
                key={column.key}
                sx={{ width: column.width, fontWeight: 600 }}
              >
                {column.header}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} align="center">
                <Box py={6}>
                  <Typography variant="body1" color="text.secondary">
                    {emptyMessage}
                  </Typography>
                </Box>
              </TableCell>
            </TableRow>
          ) : (
            data.map((item) => (
              <TableRow
                key={item.id}
                onClick={() => onRowClick && onRowClick(item)}
                sx={{
                  cursor: onRowClick ? 'pointer' : 'default',
                  '&:hover': onRowClick
                    ? { backgroundColor: 'action.hover' }
                    : {},
                }}
              >
                {columns.map((column) => (
                  <TableCell key={column.key}>
                    {column.render(item)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </MuiTable>
    </TableContainer>
  );
}
