'use client';
import { Menu, MenuItem, Typography } from '@mui/material';
import { IconPencil, IconTrash } from '@tabler/icons-react';
import React from 'react';

interface ExpenseActionsMenuProps {
  anchorEl: HTMLElement | null;
  onClose: () => void;
  onEditClick: () => void;
  onDeleteClick: () => void;
}

const ExpenseActionsMenu = ({ 
  anchorEl, 
  onClose, 
  onEditClick, 
  onDeleteClick 
}: ExpenseActionsMenuProps) => {
  return (
    <Menu
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
      onClose={onClose}
    >
      <MenuItem onClick={onEditClick}>
        <IconPencil size={20} />
        <Typography sx={{ ml: 1 }}>Edit</Typography>
      </MenuItem>
      <MenuItem onClick={onDeleteClick} sx={{ color: 'error.main' }}>
        <IconTrash size={20} />
        <Typography sx={{ ml: 1 }}>Delete</Typography>
      </MenuItem>
    </Menu>
  );
};

export default ExpenseActionsMenu; 