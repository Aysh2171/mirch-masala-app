from flask import Flask, request, jsonify, render_template, send_from_directory, Response
from flask_cors import CORS
import mysql.connector
import json
import os
from datetime import datetime
import requests
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__, static_folder='static', template_folder='templates')

CORS(app)  # Enable CORS for all routes

# Database connection configuration
DB_CONFIG = {
    'host': os.getenv('DB_HOST'),
    'user': os.getenv('DB_USER'),
    'password': os.getenv('DB_PASSWORD'),
    'database': os.getenv('DB_NAME')
}


def get_db_connection():
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        print("✅ DB connection succeeded")  # Add this
        return conn
    except mysql.connector.Error as err:
        print("❌ DB connection failed:", err)  # Add this
        return None


# Serve static files
@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('.', path)

@app.route('/')
def index():
    return render_template('index.html')  # not send_from_directory


# API Routes
@app.route('/api/menu', methods=['GET'])
def get_menu():
    try:
        category = request.args.get('category', 'all')
        
        conn = get_db_connection()
        if not conn:
            return jsonify({"status": "error", "message": "Database connection failed"}), 500
        
        cursor = conn.cursor(dictionary=True)
        
        if category and category != 'all':
            cursor.execute("SELECT * FROM menu WHERE category LIKE %s", (f"%{category}%",))
        else:
            cursor.execute("SELECT * FROM menu")
            
        menu_items = cursor.fetchall()
        cursor.close()
        conn.close()
        
        return jsonify({"status": "success", "items": menu_items})
    
    except Exception as e:
        print(f"Menu fetch error: {str(e)}")
        return jsonify({"status": "error", "message": "An error occurred while fetching menu"}), 500

@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.json
        email = data.get('email')
        password = data.get('password')
        user_type = data.get('userType', 'customer')
        
        if not email or not password:
            return jsonify({"status": "error", "message": "Email and password are required"}), 400
        
        conn = get_db_connection()
        if not conn:
            return jsonify({"status": "error", "message": "Database connection failed"}), 500
        
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM users WHERE email=%s AND password=%s AND user_type=%s", 
                      (email, password, user_type))
        user = cursor.fetchone()
        cursor.close()
        conn.close()
        
        if user:
            # Don't send password back to client
            if 'password' in user:
                user.pop('password')
            return jsonify({"status": "success", "user": user})
        else:
            return jsonify({"status": "error", "message": "Invalid credentials"}), 401
    
    except Exception as e:
        print(f"Login error: {str(e)}")
        return jsonify({"status": "error", "message": "An error occurred during login"}), 500

@app.route('/api/signup', methods=['POST'])
def signup():
    try:
        data = request.json
        name = data.get('name')
        email = data.get('email')
        phone = data.get('phone')
        password = data.get('password')
        address = data.get('address')
        user_type = data.get('userType', 'customer')
        
        if not all([name, email, phone, password, address]):
            return jsonify({"status": "error", "message": "All fields are required"}), 400
        
        conn = get_db_connection()
        if not conn:
            return jsonify({"status": "error", "message": "Database connection failed"}), 500
        
        cursor = conn.cursor()
        
        # Check if email already exists
        cursor.execute("SELECT * FROM users WHERE email=%s", (email,))
        if cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({"status": "error", "message": "Email already registered"}), 409
        
        # Insert new user
        cursor.execute("""
            INSERT INTO users (name, email, phone_number, password, address, user_type) 
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (name, email, phone, password, address, user_type))
        
        user_id = cursor.lastrowid
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({"status": "success", "message": "Registration successful", "user_id": user_id})
    
    except Exception as e:
        print(f"Signup error: {str(e)}")
        return jsonify({"status": "error", "message": "An error occurred during registration"}), 500

@app.route('/api/image-proxy')
def image_proxy():
    # Get the external image URL from the query parameter
    url = request.args.get('url')
    if not url:
        return 'Image URL not provided', 400

    try:
        # Fetch the image from the external URL
        response = requests.get(url, stream=True)
        response.raise_for_status()  # Raise an exception for bad status codes (4xx or 5xx)

        # Get the content type of the image (e.g., 'image/jpeg')
        content_type = response.headers['content-type']
        
        # Stream the image content back to the user's browser
        return Response(response.iter_content(chunk_size=1024), content_type=content_type)
    
    except requests.exceptions.RequestException as e:
        # If the request fails, return an error
        print(f"Error proxying image: {e}")
        return 'Failed to fetch image', 500

@app.route('/api/cart', methods=['POST'])
def add_to_cart():
    try:
        data = request.json
        user_id = data.get('user_id')
        item_id = data.get('item_id')
        quantity = data.get('quantity', 1)
        
        if not user_id or not item_id:
            return jsonify({"status": "error", "message": "User ID and Item ID are required"}), 400
        
        conn = get_db_connection()
        if not conn:
            return jsonify({"status": "error", "message": "Database connection failed"}), 500
        
        cursor = conn.cursor()
        
        # Check if item already in cart
        cursor.execute("SELECT * FROM cart WHERE user_id=%s AND item_id=%s", (user_id, item_id))
        existing_item = cursor.fetchone()
        
        if existing_item:
            # Update quantity
            cursor.execute("UPDATE cart SET quantity=quantity+%s WHERE user_id=%s AND item_id=%s", 
                          (quantity, user_id, item_id))
        else:
            # Add new item to cart
            cursor.execute("INSERT INTO cart (user_id, item_id, quantity) VALUES (%s, %s, %s)", 
                          (user_id, item_id, quantity))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({"status": "success", "message": "Item added to cart"})
    
    except Exception as e:
        print(f"Add to cart error: {str(e)}")
        return jsonify({"status": "error", "message": "An error occurred while adding to cart"}), 500

@app.route('/api/cart/<int:user_id>', methods=['GET'])
def get_cart(user_id):
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({"status": "error", "message": "Database connection failed"}), 500
        
        cursor = conn.cursor(dictionary=True)
        
        # Get cart items with details
        cursor.execute("""
            SELECT c.cart_id, c.item_id, m.item_name as name, m.description, m.category, m.price, c.quantity, 
                   (m.price * c.quantity) as subtotal
            FROM cart c
            JOIN menu m ON c.item_id = m.item_id
            WHERE c.user_id = %s
        """, (user_id,))
        
        cart_items = cursor.fetchall()
        cursor.close()
        conn.close()
        
        # Calculate total
        total = sum(item['subtotal'] for item in cart_items)
        
        return jsonify({
            "status": "success", 
            "items": cart_items,
            "total": total
        })
    
    except Exception as e:
        print(f"Get cart error: {str(e)}")
        return jsonify({"status": "error", "message": "An error occurred while fetching cart"}), 500

@app.route('/api/cart/<int:user_id>/update', methods=['POST'])
def update_cart_item(user_id):
    try:
        data = request.json
        item_id = data.get('item_id')
        quantity = data.get('quantity')
        
        if not item_id or quantity is None:
            return jsonify({"status": "error", "message": "Item ID and quantity are required"}), 400
        
        conn = get_db_connection()
        if not conn:
            return jsonify({"status": "error", "message": "Database connection failed"}), 500
        
        cursor = conn.cursor()
        
        if quantity > 0:
            cursor.execute("UPDATE cart SET quantity=%s WHERE user_id=%s AND item_id=%s", 
                          (quantity, user_id, item_id))
        else:
            cursor.execute("DELETE FROM cart WHERE user_id=%s AND item_id=%s", (user_id, item_id))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({"status": "success", "message": "Cart updated"})
    
    except Exception as e:
        print(f"Update cart error: {str(e)}")
        return jsonify({"status": "error", "message": "An error occurred while updating cart"}), 500

@app.route('/api/orders', methods=['POST'])
def place_order():
    try:
        data = request.json
        print("📥 Received order payload:", data)

        user_id = data.get('user_id')
        delivery_address = data.get('deliveryAddress')
        payment_method = data.get('paymentMethod')

        if not all([user_id, delivery_address, payment_method]):
            return jsonify({"status": "error", "message": "All fields are required"}), 400

        conn = get_db_connection()
        if not conn:
            return jsonify({"status": "error", "message": "Database connection failed"}), 500

        cursor = conn.cursor(dictionary=True)

        # Fetch cart
        cursor.execute("""
            SELECT c.item_id, m.price, c.quantity, (m.price * c.quantity) as subtotal
            FROM cart c
            JOIN menu m ON c.item_id = m.item_id
            WHERE c.user_id = %s
        """, (user_id,))
        cart_items = cursor.fetchall()

        if not cart_items:
            cursor.close()
            conn.close()
            return jsonify({"status": "error", "message": "Cart is empty"}), 400

        total_price = sum(item['subtotal'] for item in cart_items)

        # Map payment method correctly
        payment_map = {
            'cod': 'Cash on Delivery',
            'online': 'Online Payment',
            'upi': 'Online Payment'  # map UPI under Online for now
}
        payment_method_db = payment_map.get(payment_method.lower(), 'Cash on Delivery')

        transaction_status = 'pending' if payment_method == 'cod' else 'successful'

        # Insert into orders
        cursor.execute("""
            INSERT INTO orders (user_id, order_date, total_price, payment_mode, status)
            VALUES (%s, %s, %s, %s, %s)
        """, (user_id, datetime.now(), total_price, payment_method_db, 'pending'))
        order_id = cursor.lastrowid

        # Order items
        for item in cart_items:
            cursor.execute("""
                INSERT INTO order_items (order_id, item_id, quantity, subtotal)
                VALUES (%s, %s, %s, %s)
            """, (order_id, item['item_id'], item['quantity'], item['subtotal']))

        # Payment record
        cursor.execute("""
            INSERT INTO payments (order_id, amount, payment_method, transaction_status)
            VALUES (%s, %s, %s, %s)
        """, (order_id, total_price, payment_method_db, transaction_status))

        # Delivery
        cursor.execute("""
            INSERT INTO delivery_info (order_id, delivery_address, delivery_status, estimated_time)
            VALUES (%s, %s, %s, %s)
        """, (order_id, delivery_address, 'pending', datetime.now()))

        # Clear cart
        cursor.execute("DELETE FROM cart WHERE user_id = %s", (user_id,))

        # Log
#        cursor.execute("""
#           INSERT INTO logs (user_id, action, order_id, timestamp)
#           VALUES (%s, %s, %s, %s)
#        """, (user_id, 'Placed an order', order_id, datetime.now()))

        print("✅ Order inserted successfully. Cart cleared.")


        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({"status": "success", "message": "Order placed successfully", "order_id": order_id})

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"status": "error", "message": "An error occurred while placing order"}), 500


@app.route('/api/orders/<int:user_id>', methods=['GET'])
def get_orders(user_id):
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({"status": "error", "message": "Database connection failed"}), 500
        
        cursor = conn.cursor(dictionary=True)
        
        # Get orders
        cursor.execute("""
            SELECT order_id, order_date, total_price, payment_mode, status
            FROM orders
            WHERE user_id = %s
            ORDER BY order_date DESC
        """, (user_id,))
        
        orders = cursor.fetchall()
        
        # Get order items for each order
        for order in orders:
            cursor.execute("""
                SELECT oi.item_id, m.item_name, oi.quantity, oi.subtotal
                FROM order_items oi
                JOIN menu m ON oi.item_id = m.item_id
                WHERE oi.order_id = %s
            """, (order['order_id'],))
            
            order['items'] = cursor.fetchall()
            
            # Get payment info
            cursor.execute("""
                SELECT payment_method, transaction_status
                FROM payments
                WHERE order_id = %s
            """, (order['order_id'],))
            
            payment = cursor.fetchone()
            if payment:
                order['payment'] = payment
        
        cursor.close()
        conn.close()
        
        return jsonify({"status": "success", "orders": orders})
    
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Place order error: {str(e)}")
        return jsonify({"status": "error", "message": "An error occurred while placing order"}), 500


@app.route('/api/admin/menu', methods=['POST'])
def add_menu_item():
    try:
        data = request.json
        item_name = data.get('name')
        description = data.get('description')
        category = data.get('category')
        price = data.get('price')
        
        if not all([item_name, description, category, price]):
            return jsonify({"status": "error", "message": "All fields are required"}), 400
        
        conn = get_db_connection()
        if not conn:
            return jsonify({"status": "error", "message": "Database connection failed"}), 500
        
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO menu (item_name, description, category, price, availability) 
            VALUES (%s, %s, %s, %s, %s)
        """, (item_name, description, category, price, True))
        
        item_id = cursor.lastrowid
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({
            "status": "success", 
            "message": "Menu item added successfully", 
            "item_id": item_id
        })
    
    except Exception as e:
        print(f"Add menu item error: {str(e)}")
        return jsonify({"status": "error", "message": "An error occurred while adding menu item"}), 500

@app.route('/api/admin/menu/<int:item_id>', methods=['DELETE'])
def delete_menu_item(item_id):
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({"status": "error", "message": "Database connection failed"}), 500
        
        cursor = conn.cursor()
        
        cursor.execute("DELETE FROM menu WHERE item_id = %s", (item_id,))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({
            "status": "success", 
            "message": "Menu item deleted successfully"
        })
    
    except Exception as e:
        print(f"Delete menu item error: {str(e)}")
        return jsonify({"status": "error", "message": "An error occurred while deleting menu item"}), 500

@app.route('/api/admin/menu/<int:item_id>', methods=['GET'])
def get_menu_item(item_id):
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({"status": "error", "message": "Database connection failed"}), 500
        
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM menu WHERE item_id = %s", (item_id,))
        item = cursor.fetchone()
        cursor.close()
        conn.close()
        
        if item:
            return jsonify({"status": "success", "item": item})
        else:
            return jsonify({"status": "error", "message": "Item not found"}), 404
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/admin/menu/<int:item_id>', methods=['PUT'])
def update_menu_item(item_id):
    try:
        data = request.json
        item_name = data.get('name')
        description = data.get('description')
        category = data.get('category')
        price = data.get('price')
        image = data.get('image')

        conn = get_db_connection()
        if not conn:
            return jsonify({"status": "error", "message": "Database connection failed"}), 500

        cursor = conn.cursor()
        cursor.execute("""
            UPDATE menu 
            SET item_name = %s, description = %s, category = %s, price = %s, image = %s
            WHERE item_id = %s
        """, (item_name, description, category, price, image, item_id))

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({"status": "success", "message": "Menu item updated successfully"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/user/<int:user_id>', methods=['GET'])
def get_user(user_id):
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({"status": "error", "message": "Database connection failed"}), 500
        
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("SELECT user_id, name, email, phone_number, address, user_type FROM users WHERE user_id = %s", (user_id,))
        
        user = cursor.fetchone()
        cursor.close()
        conn.close()
        
        if not user:
            return jsonify({"status": "error", "message": "User not found"}), 404
        
        return jsonify({
            "status": "success", 
            "user": user
        })
    
    except Exception as e:
        print(f"Get user error: {str(e)}")
        return jsonify({"status": "error", "message": "An error occurred while fetching user"}), 500
'''   
@app.route('/api/image-proxy')
def image_proxy():
    url = request.args.get('url')
    if not url:
        return 'Image URL not provided', 400
    try:
        response = requests.get(url, stream=True)
        response.raise_for_status()
        content_type = response.headers['content-type']
        return Response(response.iter_content(chunk_size=1024), content_type=content_type)
    except requests.exceptions.RequestException as e:
        print(f"Error proxying image: {e}")
        return 'Failed to fetch image', 500
'''
if __name__ == "__main__":
    app.run(debug=True, port=5000)