import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Box,
  Stack,
  Grid,
  Card,
  Divider,
  useTheme,
  Tabs,
  Tab,
  useMediaQuery
} from '@mui/material';
import { 
  IconX, 
  IconBrandApple, 
  IconDeviceGamepad2, 
  IconShoppingCart, 
  IconBuildingStore,
  IconDots 
} from '@tabler/icons-react';

interface ProductSelectionModalProps {
  open: boolean;
  onClose: () => void;
  selectedProduct: string;
  onSelectProduct: (value: string) => void;
}

export type { ProductSelectionModalProps };

const products = {
  emag: [
    {
      id: 'emag-1',
      name: 'iPhone 14 Pro Max',
      category: 'Smartphones',
      price: '6499.99',
      brand: 'Apple',
      image: '/products/iphone.jpg'
    },
    {
      id: 'emag-2',
      name: 'MacBook Air M2',
      category: 'Laptops',
      price: '7299.99',
      brand: 'Apple',
      image: '/products/macbook.jpg'
    },
    {
      id: 'emag-3',
      name: 'AirPods Pro 2',
      category: 'Audio',
      price: '1299.99',
      brand: 'Apple',
      image: '/products/airpods.jpg'
    },
    {
      id: 'emag-4',
      name: 'iPad Pro 12.9"',
      category: 'Tablets',
      price: '5499.99',
      brand: 'Apple',
      image: '/products/ipad.jpg'
    }
  ],
  created: [
    {
      id: 'created-1',
      name: 'Gaming Mouse RGB',
      category: 'Peripherals',
      price: '249.99',
      brand: 'Razer',
      image: '/products/mouse.jpg'
    },
    {
      id: 'created-2',
      name: 'Mechanical Keyboard',
      category: 'Peripherals',
      price: '499.99',
      brand: 'Corsair',
      image: '/products/keyboard.jpg'
    },
    {
      id: 'created-3',
      name: 'Gaming Headset',
      category: 'Audio',
      price: '349.99',
      brand: 'SteelSeries',
      image: '/products/headset.jpg'
    },
    {
      id: 'created-4',
      name: 'Gaming Monitor 27"',
      category: 'Displays',
      price: '1499.99',
      brand: 'ASUS',
      image: '/products/monitor.jpg'
    }
  ]
};

const ProductSelectionModal: React.FC<ProductSelectionModalProps> = ({
  open,
  onClose,
  selectedProduct,
  onSelectProduct
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [activeTab, setActiveTab] = React.useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const SectionHeader = ({ title, icon, color }: { title: string; icon: React.ReactNode; color: string }) => (
    <Stack spacing={1.5} sx={{ mb: 2 }}>
      <Stack 
        direction="row" 
        spacing={1.5} 
        alignItems="center"
      >
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: '8px',
            bgcolor: `${color}.lighter`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: `${color}.main`,
          }}
        >
          {icon}
        </Box>
        <Box flex={1}>
          <Typography 
            variant="h6"
            sx={{ 
              fontSize: '14px',
              fontWeight: 600,
              color: theme.palette.mode === 'dark' ? 'grey.300' : 'grey.900',
              mb: 0.25
            }}
          >
            {title}
          </Typography>
          <Typography 
            variant="caption" 
            sx={{ 
              fontSize: '10px',
              color: 'text.secondary',
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}
          >
            {title === 'eMAG Products' ? 'Official Store Products' : 'Custom Created Products'}
          </Typography>
        </Box>
      </Stack>
      <Box 
        sx={{ 
          width: '100%', 
          height: '1px', 
          bgcolor: 'divider',
          opacity: 0.5
        }} 
      />
    </Stack>
  );

  const ProductCard = ({ product }: { product: typeof products.emag[0] }) => (
    <Card
      onClick={() => onSelectProduct(product.id)}
      sx={{
        p: 2,
        cursor: 'pointer',
        border: '1px solid',
        borderColor: selectedProduct === product.id ? 'primary.main' : 'divider',
        bgcolor: selectedProduct === product.id ? 'primary.lighter' : 'background.paper',
        transition: 'all 0.2s ease-in-out',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '12px',
        '&:hover': {
          borderColor: 'primary.main',
          bgcolor: 'primary.lighter',
          transform: 'translateY(-2px)',
          boxShadow: theme.shadows[4]
        }
      }}
    >
      <Stack spacing={1.5} height="100%">
        <Box
          sx={{
            width: '100%',
            height: '80px',
            bgcolor: theme.palette.mode === 'dark' ? 'grey.800' : 'grey.50',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Typography 
            variant="h3" 
            color="text.secondary"
            sx={{ opacity: 0.5 }}
          >
            {product.brand === 'Apple' ? (
              <IconBrandApple size={32} />
            ) : (
              <IconDeviceGamepad2 size={32} />
            )}
          </Typography>
        </Box>
        <Stack spacing={1} flex={1}>
          <Box>
            <Typography 
              variant="subtitle1"
              sx={{ 
                fontSize: '13px',
                fontWeight: 600,
                mb: 0.5,
                color: theme.palette.mode === 'dark' ? 'grey.300' : 'grey.900'
              }}
            >
              {product.name}
            </Typography>
            <Stack 
              direction="row" 
              spacing={1} 
              alignItems="center"
              divider={
                <Box 
                  sx={{ 
                    width: '3px', 
                    height: '3px', 
                    borderRadius: '50%', 
                    bgcolor: 'text.disabled' 
                  }} 
                />
              }
            >
              <Typography 
                variant="caption" 
                color="text.secondary"
                sx={{ fontSize: '11px' }}
              >
                {product.brand}
              </Typography>
              <Typography 
                variant="caption" 
                color="text.secondary"
                sx={{ fontSize: '11px' }}
              >
                {product.category}
              </Typography>
            </Stack>
          </Box>
          <Typography 
            variant="body2"
            color="primary.main"
            sx={{ 
              fontSize: '14px',
              fontWeight: 600,
              mt: 'auto'
            }}
          >
            {product.price} RON
          </Typography>
        </Stack>
      </Stack>
    </Card>
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: { xs: 0, sm: 2 },
          maxHeight: { xs: '100vh', sm: '80vh' },
          m: { xs: 0, sm: 3 },
          width: { xs: '100%', sm: 'auto' }
        }
      }}
    >
      <DialogTitle sx={{ px: { xs: 2, sm: 2.5 }, py: 2 }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
        >
          <Typography 
            variant="h6" 
            sx={{ 
              fontSize: { xs: '16px', sm: '18px' },
              fontWeight: 600,
              color: theme.palette.mode === 'dark' ? 'grey.300' : 'grey.900'
            }}
          >
            Select Product
          </Typography>
          <IconButton
            onClick={onClose}
            size="small"
            sx={{
              color: 'text.secondary',
              '&:hover': { color: 'text.primary' }
            }}
          >
            <IconX size={18} />
          </IconButton>
        </Stack>
      </DialogTitle>
      <Divider />

      {/* Mobile Tabs */}
      {isMobile && (
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': {
              fontSize: '13px',
              fontWeight: 600,
              textTransform: 'none',
              minHeight: '48px',
              color: 'text.secondary',
              '&.Mui-selected': {
                color: 'primary.main'
              }
            }
          }}
        >
          <Tab 
            icon={<IconShoppingCart size={18} />}
            iconPosition="start"
            label="eMAG Products" 
          />
          <Tab 
            icon={<IconBuildingStore size={18} />}
            iconPosition="start"
            label="Created Products" 
          />
        </Tabs>
      )}

      <DialogContent sx={{ p: { xs: 2, sm: 2.5 } }}>
        <Stack 
          direction={{ xs: 'column', sm: 'row' }} 
          spacing={{ xs: 3, sm: 0 }}
        >
          {/* eMAG Products */}
          <Box 
            flex={1} 
            sx={{ 
              display: { 
                xs: activeTab === 0 ? 'block' : 'none',
                sm: 'block'
              }
            }}
          >
            <Box sx={{ pr: { xs: 0, sm: 3 } }}>
              {!isMobile && (
                <SectionHeader 
                  title="eMAG Products" 
                  icon={<IconShoppingCart size={18} />}
                  color="primary"
                />
              )}
              <Grid container spacing={1.5}>
                {products.emag.map((product) => (
                  <Grid item xs={12} sm={6} key={product.id}>
                    <ProductCard product={product} />
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Box>

          {/* Vertical Divider - Only show on desktop */}
          {!isMobile && (
            <Box
              sx={{
                width: '0.5px',
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                my: -2.5,
                mx: 0.5,
                position: 'relative',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '100%',
                  background: `linear-gradient(180deg, 
                    transparent 0%, 
                    ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} 15%, 
                    ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} 85%, 
                    transparent 100%
                  )`
                }
              }}
            />
          )}

          {/* Created Products */}
          <Box 
            flex={1}
            sx={{ 
              display: { 
                xs: activeTab === 1 ? 'block' : 'none',
                sm: 'block'
              }
            }}
          >
            <Box sx={{ pl: { xs: 0, sm: 3 } }}>
              {!isMobile && (
                <SectionHeader 
                  title="Created Products" 
                  icon={<IconBuildingStore size={18} />}
                  color="success"
                />
              )}
              <Grid container spacing={1.5}>
                {products.created.map((product) => (
                  <Grid item xs={12} sm={6} key={product.id}>
                    <ProductCard product={product} />
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Box>
        </Stack>
      </DialogContent>
    </Dialog>
  );
};

export default ProductSelectionModal; 