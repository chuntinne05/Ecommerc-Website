const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const mysql = require("mysql2");
const path = require("path");
const req = require("express/lib/request");

const app = express();
const port = 3000;
// app.use(express.static("public"));
app.use(express.static(path.join(__dirname, "public")));

const db = mysql.createConnection({
	host: "127.0.0.1",
	user: "root",
	password: "tinoccho0462005",
	database: "user_management",
});

db.connect((err) => {
	if (err) {
		console.error("Kết nối voi user_account thất bại:", err);
	} else {
		console.log("Kết nối user_account thành công");
	}
});
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(
	session({
		secret: "041522",
		resave: false,
		saveUninitialized: true,
	})
);

app.post("/register", (req, res) => {
	console.log("Dữ liệu nhận được từ form:", req.body);
	const { name, email, password } = req.body;
	const checkEmailQuery = "SELECT * FROM users WHERE email = ?";
	db.query(checkEmailQuery, [email], (err, results) => {
		if (err) {
			console.error(err);
			return res.status(500).send(`Lỗi máy chủ : ${err.message}`);
		}
		if (results.length > 0) {
			return res.status(400).send("Email đã được sử dụng");
		}

		const hashedPassword = bcrypt.hashSync(password, 10);

		const insertUserQuery =
			"INSERT INTO users (username, email, password) VALUES (?, ?, ?)";
		db.query(insertUserQuery, [name, email, hashedPassword], (err, results) => {
			if (err) {
				console.error(err);
				return res.status(500).send(`Lỗi máy chủ : ${err.message}`);
			}
			return res.status(200).send("Đăng ký thành công");
		});
	});
});

app.post("/login", (req, res) => {
	const { email, password } = req.body;

	const getUserQuery = "SELECT * FROM users WHERE email = ?";
	db.query(getUserQuery, [email], (err, results) => {
		if (err) {
			console.error(err);
			return res.status(500).send("Lỗi máy chủ");
		}
		if (results.length === 0) {
			return res.status(400).send("Email không tồn tại");
		}

		const user = results[0];
		// So sánh mật khẩu
		const isPasswordValid = bcrypt.compareSync(password, user.password);
		if (!isPasswordValid) {
			return res.status(400).send("Mật khẩu không chính xác");
		}

		// Lưu thông tin người dùng vào session
		req.session.userId = user.id;
		req.session.user = { id: user.id, name: user.username, email: user.email }; // Thêm thông tin user
		console.log("Đã lưu session:", req.session);
		return res.status(200).send("Đăng nhập thành công");
	});
});

// Middleware kiểm tra đăng nhập
function isAuthenticated(req, res, next) {
	if (req.session.userId) {
		next();
	} else {
		res.status(401).send("Bạn cần đăng nhập để thực hiện hành động này.");
	}
}

app.get("/home", (req, res) => {
	const userId = req.session.userId;
	const selectedIds = [7, 8, 9];
	const placeholders = selectedIds.map(() => "?").join(", ");
	const query = `SELECT * FROM products WHERE id IN (${placeholders})`;

	db.query(query, selectedIds, (err, results) => {
		if (err) {
			console.error(err);
			return res.status(500).send("Lỗi máy chủ");
		}
		res.render("home", { products: results, userId: userId });
	});
});

app.get("/the-food", (req, res) => {
	const userId = req.session.userId;
	res.render("the-food", { userId: userId });
});

// Đăng xuất
app.get("/logout", (req, res) => {
	req.session.destroy((err) => {
		if (err) {
			return res.status(500).send("Lỗi máy chủ");
		}
		res.redirect("/login.html");
	});
});

app.get("/shop", (req, res) => {
	const userId = req.session.userId;
	const categoryId = req.query.category; // Lấy category_id từ query string
	let query =
		"SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id";
	let params = [];

	if (categoryId) {
		query += " WHERE p.category_id = ?";
		params.push(categoryId);
	}

	db.query(query, params, (err, results) => {
		if (err) {
			console.error(err);
			return res.status(500).send("Lỗi máy chủ");
		}

		// Lấy danh sách categories để hiển thị trong filter
		const getCategoriesQuery = "SELECT * FROM categories";
		db.query(getCategoriesQuery, (err, categories) => {
			if (err) {
				console.error(err);
				return res.status(500).send("Lỗi máy chủ");
			}
			res.render("shop", {
				products: results,
				userId: userId,
				categories: categories,
				selectedCategory: categoryId,
			});
		});
	});
});

app.get("/add-product", (req, res) => {
	const query = "SELECT * FROM categories";
	db.query(query, (err, categories) => {
		if (err) {
			console.error(err);
			return res.status(500).send("Lỗi máy chủ");
		}
		res.render("add-product", { categories: categories });
	});
});

// Xử lý thêm sản phẩm
app.post("/add-product", (req, res) => {
	const { name, price, image, description, category } = req.body;
	const query =
		"INSERT INTO products (name, price, image, description, category_id) VALUES (?, ?, ?, ?, ?)";
	db.query(
		query,
		[name, price, image, description, category],
		(err, results) => {
			if (err) {
				console.error(err);
				return res.status(500).send("Lỗi máy chủ");
			}
			res.redirect("/shop");
		}
	);
});

// Route thêm sản phẩm vào giỏ hàng
app.post("/add-to-cart", isAuthenticated, (req, res) => {
	const userId = req.session.userId;
	const { productId, quantity } = req.body;

	const checkCartQuery =
		"SELECT * FROM cart_items WHERE user_id = ? AND product_id = ?";
	db.query(checkCartQuery, [userId, productId], (err, results) => {
		if (err) {
			console.error(err);
			return res.status(500).send("Lỗi máy chủ");
		}

		if (results.length > 0) {
			// Nếu sản phẩm đã có trong giỏ, tăng số lượng
			const newQuantity = results[0].quantity + parseInt(quantity);
			const updateCartQuery = "UPDATE cart_items SET quantity = ? WHERE id = ?";
			db.query(
				updateCartQuery,
				[newQuantity, results[0].id],
				(err, updateResults) => {
					if (err) {
						console.error(err);
						return res.status(500).send("Lỗi máy chủ");
					}
					return res.status(200).send("Cập nhật giỏ hàng thành công");
				}
			);
		} else {
			// Nếu sản phẩm chưa có trong giỏ, thêm mới
			const insertCartQuery =
				"INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)";
			db.query(
				insertCartQuery,
				[userId, productId, quantity],
				(err, insertResults) => {
					if (err) {
						console.error(err);
						return res.status(500).send("Lỗi máy chủ");
					}
					return res.status(200).send("Thêm vào giỏ hàng thành công");
				}
			);
		}
	});
});

// Route xem giỏ hàng
app.get("/cart", isAuthenticated, (req, res) => {
	const userId = req.session.userId;
	const query = `
        SELECT products.*, cart_items.quantity 
        FROM cart_items 
        JOIN products ON cart_items.product_id = products.id 
        WHERE cart_items.user_id =  ?
    `;
	db.query(query, [userId], (err, results) => {
		if (err) {
			console.error(err);
			return res.status(500).send("Lỗi máy chủ");
		}
		// Tính subtotal
		const subtotal = results.reduce((sum, product) => {
			return sum + (product.price * product.quantity);
		}, 0);			
		const total = subtotal;			
		res.render("cart", { 
			products: results, 
			userId: userId,
			subtotal: subtotal,
			total: total
		});
		// res.render("cart", { products: results, userId: userId });
	});
});

app.post("/update-cart", isAuthenticated, (req, res) => {
	const userId = req.session.userId;
	const { productId, change } = req.body;

	const selectQuery =
		"SELECT * FROM cart_items WHERE user_id = ? AND product_id = ?";
	db.query(selectQuery, [userId, productId], (err, results) => {
		if (err) {
			console.error(err);
			return res.status(500).send("Lỗi máy chủ");
		}

		if (results.length > 0) {
			let newQuantity = results[0].quantity + parseInt(change);
			if (newQuantity < 1) newQuantity = 1; // Đảm bảo số lượng ít nhất là 1

			const updateQuery = "UPDATE cart_items SET quantity = ? WHERE id = ?";
			db.query(
				updateQuery,
				[newQuantity, results[0].id],
				(err, updateResults) => {
					if (err) {
						console.error(err);
						return res.status(500).send("Lỗi máy chủ");
					}
					return res.status(200).send("Cập nhật giỏ hàng thành công");
				}
			);
		} else {
			return res.status(400).send("Sản phẩm không tồn tại trong giỏ hàng");
		}
	});
});

app.post("/delete-from-cart", isAuthenticated, (req, res) => {
	const userId = req.session.userId;
	const { productId } = req.body;

	const deleteQuery =
		"DELETE FROM cart_items WHERE user_id = ? AND product_id = ?";
	db.query(deleteQuery, [userId, productId], (err, deleteResults) => {
		if (err) {
			console.error(err);
			return res.status(500).send("Lỗi máy chủ");
		}
		return res.status(200).send("Xoá sản phẩm khỏi giỏ hàng thành công");
	});
});

app.get("/user_profile", (req, res) => {
	const userId = req.session.userId;
	if (!userId) {
		res.redirect("/login.html")
	}
	const query = "SELECT * FROM users WHERE id = ?";
    const addressQuery = "SELECT * FROM delivery_addresses WHERE user_id = ?";
	db.query(query, [userId], (err, results) => {
		if (err) {
			console.error(err);
			return res.status(500).send("Lỗi máy chủ");
		}
		if (results.length === 0) {
			return res.status(404).send("User not find in db");
		}
        db.query(addressQuery, [userId], (err, addressResults) => {
            if (err) {
                console.error(err);
                return res.status(500).send("Server Error");
            }
            const address = addressResults.length ? addressResults[0] : null;
            res.render("user_profile", { user: results[0], userId: userId, address: address });
        });
	});
});

app.post("/user_profile", (req, res) => {
	const userId = req.session.userId;
	const { first_name, last_name, gender, email, phone } = req.body;
	if (!userId) {
		return res.redirect("/login.html");
	}
	const updateQuery = "UPDATE users SET first_name = ?, last_name = ?, gender = ?, email = ?, phone = ? WHERE id = ?";
	db.query(updateQuery, [first_name, last_name, gender, email, phone, userId], (err, results) => {
		if (err) {
			console.error(err);
			return res.status(500).send("Error");
		}
		req.session.user.email = email;
		req.session.user.first_name = first_name;
		req.session.user.last_name = last_name;
		req.session.user.gender = gender;
		req.session.user.phone = phone;

		res.json({ success: true, message: "Email has been changed successfully" });
	});
});

app.post("/update_delivery_address", (req, res) => {
    const userId = req.session.userId;
    if (!userId) {
        return res.redirect("/login.html");
    }
    const { house_number, street, receiver_name, receiver_phone, address_type, notes } = req.body;
    // Kiểm tra xem người dùng đã có địa chỉ chưa
    const checkQuery = "SELECT * FROM delivery_addresses WHERE user_id = ?";
    db.query(checkQuery, [userId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: "Server Error" });
        }
        if (results.length > 0) {
            // Cập nhật địa chỉ
            const updateQuery = `
                UPDATE delivery_addresses 
                SET house_number = ?, street = ?, receiver_name = ?, receiver_phone = ?, address_type = ?, notes = ? 
                WHERE user_id = ?
            `;
            db.query(updateQuery, [house_number, street, receiver_name, receiver_phone, address_type, notes, userId], (err, updateResults) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ success: false, message: "Server Error" });
                }
                res.json({ success: true, message: "Delivery address updated successfully" });
            });
        } else {
            // Chèn địa chỉ mới
            const insertQuery = `
                INSERT INTO delivery_addresses 
                (user_id, house_number, street, receiver_name, receiver_phone, address_type, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `;
            db.query(insertQuery, [userId, house_number, street, receiver_name, receiver_phone, address_type, notes], (err, insertResults) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ success: false, message: "Server Error" });
                }
                res.json({ success: true, message: "Delivery address added successfully" });
            });
        }
    });
});
app.listen(port, () => {
	console.log(`Server đang chạy tại http://localhost:${port}`);
});
