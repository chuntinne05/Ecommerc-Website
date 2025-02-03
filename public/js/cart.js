
document.addEventListener("DOMContentLoaded", () => {
    // Chức năng tăng số lượng
    document.querySelectorAll('.increase-qty').forEach(button => {
        button.addEventListener("click", () => {
            const productId = button.getAttribute("data-id");
            updateQuantity(productId, 1);
        });
    });

    // Chức năng giảm số lượng
    document.querySelectorAll('.decrease-qty').forEach(button => {
        button.addEventListener("click", () => {
            const productId = button.getAttribute("data-id");
            updateQuantity(productId, -1);
        });
    });

    // Chức năng xoá sản phẩm
    document.querySelectorAll('.delete-item').forEach(button => {
        button.addEventListener("click", () => {
            const productId = button.getAttribute("data-id");
            deleteItem(productId);
        });
    });

    // Chức năng cập nhật số lượng thông qua input
    document.querySelectorAll('.quantity-input').forEach(input => {
        input.addEventListener("change", () => {
            const productId = input.getAttribute("data-id");
            let newQuantity = parseInt(input.value);
            if (isNaN(newQuantity) || newQuantity < 1) {
                newQuantity = 1;
                input.value = 1;
            }
            const change = newQuantity - getCurrentQuantity(productId);
            updateQuantity(productId, change);
        });
    });

    // Hàm lấy số lượng hiện tại từ DOM
    function getCurrentQuantity(productId) {
        const input = document.querySelector(`.quantity-input[data-id='${productId}']`);
        return parseInt(input.value);
    }

    // Hàm cập nhật số lượng
    function updateQuantity(productId, change) {
        fetch("/update-cart", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ productId, change }),
        })
        .then(response => response.text())
        .then(data => {
            // alert(data);
            // location.reload();
            fetch("/cart")
            .then(response => response.text())
            .then(html => {
                // Cập nhật nội dung cart
                document.querySelector('.container').innerHTML = 
                    new DOMParser()
                        .parseFromString(html, 'text/html')
                        .querySelector('.container').innerHTML;
            });
        })
        .catch(error => {
            console.error("Error:", error);
        });
    }

    // Hàm xoá sản phẩm
    function deleteItem(productId) {
        if (confirm("Bạn có chắc chắn muốn xoá sản phẩm này khỏi giỏ hàng?")) {
            fetch("/delete-from-cart", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ productId }),
            })
            .then(response => response.text())
            .then(data => {
                alert(data);
                location.reload();
            })
            .catch(error => {
                console.error("Error:", error);
            });
        }
    }
});