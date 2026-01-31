import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient.ts';
import './App.css';

// Define a type for our product data for type safety
type Product = {
  MaSP: string;
  TenSP: string;
  DonViTinh: string;
  GiaNiemYet: number;
};

function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('SAN_PHAM')
          .select('*');

        if (error) {
          throw error;
        }

        setProducts(data || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) {
    return <div>Loading products...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="App">
      <h1>TechStore Products</h1>
      {products.length === 0 ? (
        <p>No products found.</p>
      ) : (
        <ul>
          {products.map((product) => (
            <li key={product.MaSP}>
              <strong>{product.TenSP}</strong> ({product.MaSP}) - ${product.GiaNiemYet}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default App;
