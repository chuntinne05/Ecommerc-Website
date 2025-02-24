document.addEventListener("DOMContentLoaded", function () {
    const blocks = document.querySelectorAll(".block");
    const userId = localStorage.getItem("userId"); // Giả định userId được lưu trong localStorage
    const userMenu = document.getElementById("user-menu");

    if (userId) {
        userMenu.innerHTML = `
            <li><a href="/cart"><i class="bx bx-cart-alt"></i>Cart</a></li>
            <li><a href="/logout">Đăng xuất</a></li>
        `;
    } else {
        userMenu.innerHTML = `
            <li><a href="/login.html">Đăng nhập</a></li>
            <li><a href="/register.html">Đăng ký</a></li>
        `;
    }
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("show");
            }
        });
    }, { threshold: 0.3 }); // Kích hoạt khi 30% phần tử xuất hiện trên màn hình

    blocks.forEach(block => {
        observer.observe(block);
    });
});