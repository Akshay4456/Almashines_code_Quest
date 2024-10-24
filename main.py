from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
from typing import Optional
from models import Product, PriceHistory
from db.database import get_db, init_db
from scrapper import scrape_flipkart_product

app = FastAPI(title="Flipkart Price Tracker")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins in development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    init_db()

@app.post("/products/")
async def add_product(product: Product):
    product_details = scrape_flipkart_product(product.url)
    current_time = datetime.now().isoformat()

    with get_db() as conn:
        c = conn.cursor()
        
        # Check if the product URL already exists
        c.execute("SELECT id FROM products WHERE url = ?", (product.url,))
        existing_product = c.fetchone()

        if existing_product:
            product_id = existing_product[0]
            # If product exists, update the current price and add a new price history entry
            c.execute('''
                UPDATE products
                SET current_price = ?, last_checked = ?
                WHERE id = ?
            ''', (product_details['current_price'], current_time, product_id))

            # Add price history entry
            c.execute('''
                INSERT INTO price_history (product_id, price, timestamp)
                VALUES (?, ?, ?)
            ''', (product_id, product_details['current_price'], current_time))
            
            conn.commit()
            return {"message": "Product already existed. Price updated.", "product_id": product_id}

        else:
            # Insert new product
            c.execute('''
                INSERT INTO products (url, title, description, current_price, last_checked)
                VALUES (?, ?, ?, ?, ?)
            ''', (
                product.url,
                product_details['title'],
                product_details['description'],
                product_details['current_price'],
                current_time
            ))

            product_id = c.lastrowid

            # Add first price history entry
            c.execute('''
                INSERT INTO price_history (product_id, price, timestamp)
                VALUES (?, ?, ?)
            ''', (product_id, product_details['current_price'], current_time))

            conn.commit()
            return {"message": "Product added successfully", "product_id": product_id}

@app.get("/products/")
async def get_products(search: Optional[str] = None, 
                      min_price: Optional[float] = None, 
                      max_price: Optional[float] = None):
    with get_db() as conn:
        c = conn.cursor()

        query = "SELECT * FROM products WHERE 1=1"
        params = []

        if search:
            query += " AND (title LIKE ? OR description LIKE ?)"
            params.extend([f"%{search}%", f"%{search}%"])

        if min_price is not None:
            query += " AND current_price >= ?"
            params.append(min_price)

        if max_price is not None:
            query += " AND current_price <= ?"
            params.append(max_price)

        c.execute(query, params)
        products = c.fetchall()

        return [{
            "id": p[0],
            "url": p[1],
            "title": p[2],
            "description": p[3],
            "current_price": p[4],
            "last_checked": p[5]
        } for p in products]

@app.get("/products/{product_id}/history")
async def get_price_history(product_id: int):
    with get_db() as conn:
        c = conn.cursor()
        c.execute('''
            SELECT price, timestamp
            FROM price_history
            WHERE product_id = ?
            ORDER BY timestamp DESC
        ''', (product_id,))
        history = c.fetchall()

        return [{"price": h[0], "timestamp": h[1]} for h in history]

@app.post("/products/{product_id}/check")
async def check_price(product_id: int):
    with get_db() as conn:
        c = conn.cursor()

        # Get product URL
        c.execute("SELECT url FROM products WHERE id = ?", (product_id,))
        result = c.fetchone()
        if not result:
            raise HTTPException(status_code=404, detail="Product not found")

        url = result[0]
        product_details = scrape_flipkart_product(url)
        current_time = datetime.now().isoformat()

        # Update product
        c.execute('''
            UPDATE products
            SET current_price = ?, last_checked = ?
            WHERE id = ?
        ''', (product_details['current_price'], current_time, product_id))

        # Add price history entry
        c.execute('''
            INSERT INTO price_history (product_id, price, timestamp)
            VALUES (?, ?, ?)
        ''', (product_id, product_details['current_price'], current_time))

        conn.commit()
        return {"message": "Price updated successfully", "new_price": product_details['current_price']}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
