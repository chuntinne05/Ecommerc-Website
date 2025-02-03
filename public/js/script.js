// const { response } = require("express");

document.addEventListener("DOMContentLoaded", () => {
	// const wrapper = document.querySelector('.wrapper');
	// const loginLink = document.querySelector('.login-link');
	// const registerLink = document.querySelector('.register-link');
	// const btnPopup = document.querySelector('.btnLogin-popup');
	// const iconClose = document.querySelector('.icon-close');

	// registerLink.addEventListener('click', () => {
	// 	wrapper.classList.add('active');
	// });

	// loginLink.addEventListener('click', () => {
	// 	wrapper.classList.remove('active');
	// });

	// btnPopup.addEventListener('click', () => {
	// 	wrapper.classList.add('active-popup');
	// });

	// iconClose.addEventListener('click', () => {
	// 	wrapper.classList.remove('active-popup');
	// });
	const registerForm = document.getElementById("registerForm");
	const loginForm = document.getElementById("loginForm");

	if (registerForm) {
		registerForm.addEventListener("submit", (e) => {
			e.preventDefault();

			const name = document.getElementById("name").value;
			const email = document.getElementById("email").value;
			const password = document.getElementById("password").value;

			fetch("/register", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ name, email, password }),
			})
				.then((response) => response.text())
				.then((data) => {
					alert(data);
					if (data === "Đăng ký thành công") {
						window.location.href = "/login.html";
					}
				})
				.catch((error) => {
					console.error("Error: ", error);
				});
		});
	}

	if (loginForm) {
		loginForm.addEventListener("submit", (e) => {
			e.preventDefault();

			const email = document.getElementById("email").value;
			const password = document.getElementById("password").value;

			fetch("/login", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ email, password }),
			})
				.then((response) => response.text())
				.then((data) => {
					alert(data);
					if (data === "Đăng nhập thành công") {
						window.location.href = "/home";
					}
				})
				.catch((error) => {
					console.error("Error:", error);
				});
		});
	}
    const addToCartButtons = document.querySelectorAll('.add-to-cart');
	    // Xử lý thêm vào giỏ hàng
		addToCartButtons.forEach(button => {
			button.addEventListener("click", () => {
				const productId = button.getAttribute("data-id");
				const quantity = 1; // Bạn có thể thêm input cho phép người dùng chọn số lượng
		
				fetch("/add-to-cart", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ productId, quantity }),
				})
					.then(response => {
						if (response.status === 401) {
							alert("Bạn cần đăng nhập để thêm sản phẩm vào giỏ hàng.");
							window.location.href = "/login.html";
						} else if (!response.ok) {
							return response.text().then(text => { throw new Error(text) });
						}
						return response.text();
					})
					.then(data => {
						alert(data);
					})
					.catch(error => {
						console.error("Error:", error);
					});
			});
		});
});
