import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Typography,
  CircularProgress,
  useTheme
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Notification } from '@/lib/hooks/useNotifications';
import NotificationRow from './NotificationRow';

interface NotificationTableProps {
  notifications: Notification[];
  totalCount: number;
  page: number;
  rowsPerPage: number;
  isLoading: boolean;
  onPageChange: (event: unknown, newPage: number) => void;
  onRowsPerPageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onNotificationView: (notification: Notification) => void;
  onNotificationDelete: (notification: Notification) => void;
  onNotificationClick: (notification: Notification) => void;
}

const NotificationTable = ({
  notifications,
  totalCount,
  page,
  rowsPerPage,
  isLoading,
  onPageChange,
  onRowsPerPageChange,
  onNotificationView,
  onNotificationDelete,
  onNotificationClick
}: NotificationTableProps) => {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <Paper elevation={1} sx={{ width: '100%', overflow: 'hidden', borderRadius: 1, boxShadow: theme.shadows[1] }}>
      <TableContainer sx={{ maxHeight: 'none' }}>
        <Table stickyHeader aria-label="notifications table">
          <TableHead>
            <TableRow>
              <TableCell width="60px">{t('notifications.table.type')}</TableCell>
              <TableCell>{t('notifications.table.message')}</TableCell>
              <TableCell width="200px">{t('notifications.table.date')}</TableCell>
              <TableCell align="right" width="100px">{t('notifications.table.actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ height: 300 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : notifications.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ height: 200 }}>
                  <Typography variant="body1" color="textSecondary">
                    {t('notifications.table.noNotifications')}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              notifications.map((notification) => (
                <NotificationRow
                  key={notification._id}
                  notification={notification}
                  onView={onNotificationView}
                  onDelete={onNotificationDelete}
                  onClick={onNotificationClick}
                />
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      
      {/* Pagination */}
      {!isLoading && notifications.length > 0 && (
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={onPageChange}
          onRowsPerPageChange={onRowsPerPageChange}
        />
      )}
    </Paper>
  );
};

export default NotificationTable; 