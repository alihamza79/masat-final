'use client';
import { Box, Typography } from '@mui/material';
import { 
  IconPackage, 
  IconDeviceLaptop, 
  IconDeviceMobile, 
  IconHeadphones, 
  IconDeviceDesktop, 
  IconShirt,
  IconBrandApple
} from '@tabler/icons-react';
import React from 'react';

interface ProductImageProps {
  product: any;
  size?: 'small' | 'large';
}

// Helper function to render product image or fallback icon
const ProductImage = ({ product, size = 'small' }: ProductImageProps) => {
  const isSmall = size === 'small';
  const iconSize = isSmall ? 18 : 32;
  
  // Get the appropriate icon based on product category or name
  const getIcon = () => {
    const category = product.category?.toLowerCase() || '';
    const name = product.name?.toLowerCase() || '';
    
    if (product.brand === 'Apple' || name.includes('iphone') || name.includes('macbook') || name.includes('ipad')) {
      return <IconBrandApple size={iconSize} />;
    } else if (category.includes('laptop') || name.includes('laptop')) {
      return <IconDeviceLaptop size={iconSize} />;
    } else if (category.includes('audio') || name.includes('headphone') || name.includes('airpod') || name.includes('headset')) {
      return <IconHeadphones size={iconSize} />;
    } else if (category.includes('smartphone') || category.includes('phone') || name.includes('phone')) {
      return <IconDeviceMobile size={iconSize} />;
    } else if (category.includes('monitor') || category.includes('display') || name.includes('monitor')) {
      return <IconDeviceDesktop size={iconSize} />;
    } else if (category.includes('clothing') || category.includes('apparel') || name.includes('shirt') || name.includes('clothing')) {
      return <IconShirt size={iconSize} />;
    } else {
      // Default icon for other products
      return <IconPackage size={iconSize} />;
    }
  };

  // Check for image in different possible locations in the product object
  const getImageUrl = () => {
    // Direct image property (as used in our test)
    if (product.image) {
      return product.image;
    }
    
    // Array of images (as returned from API)
    if (product.images && product.images.length > 0 && product.images[0].url) {
      return product.images[0].url;
    }
    
    // No image found
    return null;
  };
  
  const imageUrl = getImageUrl();

  return (
    <Box
      sx={{
        width: isSmall ? 32 : '100%',
        height: isSmall ? 32 : '0',
        paddingBottom: isSmall ? 0 : '100%', // Make it square with 1:1 aspect ratio for large size
        position: 'relative',
        borderRadius: isSmall ? 0.5 : 1,
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: theme => theme.palette.mode === 'dark' ? 'grey.800' : 'grey.50',
      }}
    >
      {imageUrl ? (
        <>
          <Box
            component="img"
            src={imageUrl}
            alt={product.name}
            sx={{
              position: isSmall ? 'static' : 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
            onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
              // If image fails to load, show the fallback icon
              e.currentTarget.style.display = 'none';
              const fallbackEl = e.currentTarget.parentElement?.querySelector('.fallback-icon');
              if (fallbackEl) {
                (fallbackEl as HTMLElement).style.display = 'flex';
              }
            }}
          />
          <Box 
            className="fallback-icon"
            sx={{
              position: isSmall ? 'static' : 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              display: 'none', // Hidden by default, shown on image error
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Typography 
              variant="h3" 
              color="text.secondary"
              sx={{ opacity: 0.7 }}
            >
              {getIcon()}
            </Typography>
          </Box>
        </>
      ) : (
        <Box
          sx={{
            position: isSmall ? 'static' : 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Typography 
            variant="h3" 
            color="text.secondary"
            sx={{ opacity: 0.7 }}
          >
            {getIcon()}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default ProductImage; 