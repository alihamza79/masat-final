import { useEmagData } from '@/lib/hooks/useEmagData';

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
  const { integrationsData } = useEmagData();

  // Get eMAG product menu items
  const getEmagProductMenuItems = (): MenuItem[] => {
    if (!integrationsData || Object.keys(integrationsData).length === 0) {
      return [];
    }

    const menuItems: MenuItem[] = [];

    // Process integrations data
    Object.entries(integrationsData).forEach(([integrationId, data]) => {
      if (data.productOffers && Array.isArray(data.productOffers)) {
        data.productOffers.forEach((product: any) => {
          menuItems.push({
            value: `emag-${integrationId}-${product.id}`,
            label: product.name,
            group: 'eMAG Products',
            data: product
          });
        });
      }
    });

    return menuItems;
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
  const getProductNameByValue = (value: string): string | undefined => {
    if (!value) return undefined;
    
    // Check if it's an eMAG product with new format
    if (value.startsWith('emag-') && value.split('-').length > 2) {
      const [prefix, integrationId, productId] = value.split('-');
      if (integrationsData && integrationsData[integrationId]) {
        const product = integrationsData[integrationId].productOffers?.find(
          (p: any) => p.id.toString() === productId
        );
        return product ? (product as any).name : undefined;
      }
      return undefined;
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