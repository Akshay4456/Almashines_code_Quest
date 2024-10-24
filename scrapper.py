import requests
from bs4 import BeautifulSoup
import re

def scrape_flipkart_product(url):
    # Headers to mimic a browser request
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Connection': 'keep-alive',
    }

    try:
        # Add a delay to prevent rate limiting
        import time
        time.sleep(2)
        
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Extract product details
        title = soup.find('span', {'class': 'B_NuCI'}) or soup.find('h1', {'class': 'yhB1nd'})
        title = title.text.strip() if title else 'Unknown Title'
        
        description = soup.find('div', {'class': '_1mXcCf'}) or soup.find('div', {'class': '_1AN87F'})
        description = description.text.strip() if description else ''
        
        price = soup.find('div', {'class': '_30jeq3'}) or soup.find('div', {'class': '_30jeq3 _16Jk6d'})
        if price:
            price_text = price.text.strip()
            # Remove ₹ symbol and convert to float
            price_value = float(re.sub(r'[^\d.]', '', price_text))
        else:
            price_value = 0.0
            
        return {
            'title': title,
            'description': description,
            'current_price': price_value
        }
        
    except Exception as e:
        print(f"Error scraping product: {str(e)}")
        raise Exception(f"Failed to scrape product: {str(e)}")