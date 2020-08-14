import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      // TODO LOAD ITEMS FROM ASYNC STORAGE
      const productsInCart = await AsyncStorage.getItem(
        'GoMarketplace:products',
      );

      if (productsInCart) {
        setProducts([...JSON.parse(productsInCart)]);
      }
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(
    async product => {
      const productExistsInCart = products.find(
        productInList => productInList.id === product.id,
      );

      let updatedProductsList;

      if (productExistsInCart) {
        updatedProductsList = products.map(productInList =>
          productInList.id === product.id
            ? { ...product, quantity: productInList.quantity + 1 }
            : productInList,
        );

        setProducts(updatedProductsList);
      } else {
        updatedProductsList = [...products, { ...product, quantity: 1 }];

        setProducts(updatedProductsList);
      }

      await AsyncStorage.setItem(
        'GoMarketplace:products',
        JSON.stringify(updatedProductsList),
      );
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      const updatedProductsList = products.map(productInList =>
        productInList.id === id
          ? { ...productInList, quantity: productInList.quantity + 1 }
          : productInList,
      );

      setProducts(updatedProductsList);

      await AsyncStorage.setItem(
        'GoMarketplace:products',
        JSON.stringify(updatedProductsList),
      );
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const updatedProductsList = products.map(productInList =>
        productInList.id === id && productInList.quantity > 0
          ? { ...productInList, quantity: productInList.quantity - 1 }
          : productInList,
      );

      const [productWithQuantityZero] = updatedProductsList.filter(
        product => product.quantity < 1,
      );

      if (productWithQuantityZero) {
        updatedProductsList.splice(
          updatedProductsList.indexOf(productWithQuantityZero),
          1,
        );
      }

      setProducts(updatedProductsList);

      await AsyncStorage.setItem(
        'GoMarketplace:products',
        JSON.stringify(updatedProductsList),
      );
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
