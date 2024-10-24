import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import "./App.css";

const FlipkartTracker = () => {
  const [products, setProducts] = useState([]);
  const [url, setUrl] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [error, setError] = useState('');

  // Extract product title from Flipkart URL
  const extractTitleFromUrl = (url) => {
    try {
      const cleanUrl = url.split('?')[0];
      const parts = cleanUrl.split('/');
      const productPart = parts.find(part => part.includes('-'));
      const title = productPart
        .replace(/-/g, ' ')
        .replace(/\b\w/g, char => char.toUpperCase());
      return title;
    } catch (error) {
      return 'Unknown Product';
    }
  };

  // Validate Flipkart URL
  const isValidFlipkartUrl = (url) => {
    const flipkartUrlPattern = /^https?:\/\/(?:www\.)?flipkart\.com\/.*\/p\/.*/i;
    return flipkartUrlPattern.test(url);
  };

  // Generate random price history
  const generatePriceHistory = (basePrice) => {
    const history = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const variation = Math.floor(Math.random() * 2000 - 1000);
      history.push({
        date: date.toISOString().split('T')[0],
        price: basePrice + variation
      });
    }
    return history;
  };

  const addProduct = () => {
    if (!url) {
      setError('Please enter a URL');
      return;
    }

    if (!isValidFlipkartUrl(url)) {
      setError('Please enter a valid Flipkart product URL');
      return;
    }

    const productTitle = extractTitleFromUrl(url);
    if (!productTitle) {
      setError('Could not extract product title from URL');
      return;
    }

    setError('');

    const basePrice = Math.floor(Math.random() * 50000) + 10000;
    const newProduct = {
      id: Date.now(),
      url: url,
      title: productTitle,
      description: `Product from Flipkart - ${productTitle}`,
      currentPrice: basePrice,
      priceHistory: generatePriceHistory(basePrice),
      reviews: Math.floor(Math.random() * 1000) + 100,
      rating: (3.5 + Math.random() * 1.5).toFixed(1),
      totalPurchases: Math.floor(Math.random() * 5000) + 500,
      lastChecked: new Date().toLocaleString(),
      imageUrl: '/api/placeholder/200/200', // Placeholder for product image
      priceChecked: false // Add this flag
    };

    setProducts([newProduct, ...products]);
    setUrl('');
  };

  const checkPrice = (productId) => {
    setProducts(products.map(product => {
      if (product.id === productId) {
        const variation = Math.floor(Math.random() * 2000 - 1000);
        const newPrice = product.currentPrice + variation;
        const newHistory = [...product.priceHistory, {
          date: new Date().toISOString().split('T')[0],
          price: newPrice
        }];

        if (newHistory.length > 7) {
          newHistory.shift();
        }

        return {
          ...product,
          currentPrice: newPrice,
          priceHistory: newHistory,
          lastChecked: new Date().toLocaleString(),
          priceChecked: true // Set to true when the price is checked
        };
      }
      return product;
    }));
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMinPrice = !minPrice || product.currentPrice >= Number(minPrice);
    const matchesMaxPrice = !maxPrice || product.currentPrice <= Number(maxPrice);
    return matchesSearch && matchesMinPrice && matchesMaxPrice;
  });

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
      <h1 className="text-4xl font-extrabold text-gray-800 mb-8 text-center">
        Flipkart Price Tracker
      </h1>

      {/* Input Form */}
      <div className="mb-8 p-6 bg-white rounded-lg shadow-lg">
        <div className="flex flex-col md:flex-row gap-4">
          <input
            type="text"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setError('');
            }}
            placeholder="Enter Flipkart product URL"
            className="flex-1 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button
            onClick={addProduct}
            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
          >
            Add Product
          </button>
        </div>
        {error && (
          <div className="text-red-500 text-sm mt-2">{error}</div>
        )}
      </div>

      {/* Search and Filter Section */}
      <div className="mb-8 p-6 bg-white rounded-lg shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products"
            className="px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <input
            type="number"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            placeholder="Min price"
            className="px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <input
            type="number"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            placeholder="Max price"
            className="px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
      </div>

      {/* Product List */}
      <div className="space-y-8">
        {filteredProducts.map(product => (
          <div key={product.id} className="border rounded-lg overflow-hidden bg-white shadow-md hover:shadow-lg transition-transform hover:scale-105 duration-200">
            <div className="p-6">
              <div className="flex flex-col md:flex-row items-start gap-4">
                <img
                  // src={product.imageUrl} 
                  // alt={product.title}
                  className="w-24 h-24 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-800">{product.title}</h2>
                  <a
                    href={product.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm break-all"
                  >
                    {/* {product.url} */}
                  </a>
                  <p className="text-gray-500 mt-2">{product.description}</p>
                </div>
                <div className="text-right ml-4">
                  <div className="text-3xl font-bold text-gray-800">₹{product.currentPrice.toLocaleString()}</div>
                  <button
                    onClick={() => checkPrice(product.id)}
                    className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    {product.priceChecked ? 'Recheck Price' : 'Check Price'}
                  </button>
                </div>
              </div>

              {/* Product Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-4 highlight-section p-4 rounded-lg shadow-md">
                <div className="text-center">
                  <div className="text-lg text-gray-700 font-bold">Reviews</div>
                  <div className="text-2xl font-semibold text-gray-800">
                    {product.reviews} <span className="text-yellow-500">({product.rating}★)</span>
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-lg text-gray-700 font-bold">Total Purchases</div>
                  <div className="text-2xl font-semibold text-gray-800">
                    {product.totalPurchases.toLocaleString()}
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-lg text-gray-700 font-bold">Last Checked</div>
                  <div className="text-2xl font-semibold text-gray-800">
                    {product.lastChecked}
                  </div>
                </div>
              </div>



              {/* Price History Chart */}
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={product.priceHistory}>
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="price" stroke="#8884d8" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FlipkartTracker;
