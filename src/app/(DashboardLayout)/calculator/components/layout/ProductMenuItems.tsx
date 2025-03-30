import { SavedCalculation } from '../../hooks/useSavedCalculations';
import useProducts from '@/lib/hooks/useProducts';

export interface MenuItem {
  value: string;
  label: string;
  group?: string;
  data?: any;
}

// Define static products for legacy support
const staticProducts = {
  emag: [] as Array<{ id: string; name: string; price: string }>,
  created: [
    { id: 'created-1', name: 'Gaming Mouse RGB', price: '249.99' },
    { id: 'created-2', name: 'Mechanical Keyboard', price: '499.99' },
    { id: 'created-3', name: 'Gaming Headset', price: '349.99' }
  ]
};

export const useProductMenuItems = () => {
  const { products } = useProducts();

  // Get eMAG product menu items
  const getEmagProductMenuItems = (): MenuItem[] => {
    if (!products || products.length === 0) {
      return [];
    }
    return products.map((product: any) => ({
      value: `emag-${product.integrationId}-${product.id}`,
      label: product.name,
      group: 'eMAG Products',
      data: product
    }));
  };

  // Get static menu items
  const getStaticMenuItems = (): MenuItem[] => {
    const menuItems: MenuItem[] = [];
    
    // Add created products
    staticProducts.created.forEach(product => {
      menuItems.push({
        value: product.id,
        label: product.name,
        group: 'Created Products'
      });
    });
    
    return menuItems;
  };

  // Get all menu items
  const getAllMenuItems = (): MenuItem[] => {
    return [...getEmagProductMenuItems(), ...getStaticMenuItems()];
  };

  // Get product name by value
  const getProductNameByValue = (value: string, savedCalculations: SavedCalculation[]): string | undefined => {
    if (!value) return undefined;
    
    // Check if it's a saved calculation
    if (value.startsWith('saved-') && savedCalculations && savedCalculations.length > 0) {
      const calculationId = value.replace('saved-', '');
      const savedCalculation = savedCalculations.find(calc => calc._id === calculationId);
      if (savedCalculation) {
        return savedCalculation.title;
      }
      return 'Saved Calculation';
    }
    
    // Check if it's an eMAG product with new format
    if (value.startsWith('emag-') && value.split('-').length > 2) {
      const [prefix, integrationId, productId] = value.split('-');
      const product = products.find((p: any) => p.integrationId === integrationId && p.id.toString() === productId);
      return product ? product.name : undefined;
    }
    
    // Otherwise use the menu items
    return getAllMenuItems().find(item => item.value === value)?.label;
  };

  return {
    getEmagProductMenuItems,
    getStaticMenuItems,
    getAllMenuItems,
    getProductNameByValue,
    staticProducts
  };
};

export default useProductMenuItems; 