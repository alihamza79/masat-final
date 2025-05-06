'use client';
import { Menu, MenuItem, Typography } from '@mui/material';
import { IconPencil, IconTrash } from '@tabler/icons-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  
  return (
    <Menu
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
      onClose={onClose}
    >
      <MenuItem onClick={onEditClick}>
        <IconPencil size={20} />
        <Typography sx={{ ml: 1 }}>{t('expenses.list.edit')}</Typography>
      </MenuItem>
      <MenuItem onClick={onDeleteClick} sx={{ color: 'error.main' }}>
        <IconTrash size={20} />
        <Typography sx={{ ml: 1 }}>{t('expenses.list.delete')}</Typography>
      </MenuItem>
    </Menu>
  );
};

export default ExpenseActionsMenu; 