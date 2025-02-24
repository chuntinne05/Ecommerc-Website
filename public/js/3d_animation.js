document.addEventListener("DOMContentLoaded", function () {
    const cakeModel = document.getElementById("cake-model");

    if (!cakeModel) {
        console.error("Không tìm thấy model 3D!");
        return;
    }

    const shiftPositions = [0, -20, 0, 25];

    const cameraOrbits = [
        [90, 90],
        [-45, 90],
        [-180, 0],
        [45, 90]
    ];

    const sections = Array.from(document.querySelectorAll("section"));
    if (sections.length === 0) {
        console.warn("Không tìm thấy section nào, camera sẽ không thay đổi.");
        return;
    }

    const sectionOffsets = sections.map(section => section.offsetTop);
    const lastSectionIndex = sections.length - 1;

    // Hàm nội suy tuyến tính
    const interpolate = (start, end, progress) => start + (end - start) * progress;

    // Hàm tính toán tiến trình cuộn trang
    const getScrollProgress = (scrollY) => {
        for (let i = 0; i < lastSectionIndex; i++) {
            if (scrollY >= sectionOffsets[i] && scrollY < sectionOffsets[i + 1]) {
                return i + (scrollY - sectionOffsets[i]) / (sectionOffsets[i + 1] - sectionOffsets[i]);
            }
        }
        return lastSectionIndex;
    };

    // Lắng nghe sự kiện cuộn trang
    window.addEventListener("scroll", () => {
        const scrollProgress = getScrollProgress(window.scrollY);
        const selectionIndex = Math.floor(scrollProgress);
        const sectionProgress = scrollProgress - selectionIndex;

        const currentShift = interpolate(
            shiftPositions[selectionIndex],
            shiftPositions[selectionIndex + 1] ?? shiftPositions[selectionIndex],
            sectionProgress
        );

        const currentOrbit = cameraOrbits[selectionIndex].map((val, i) =>
            interpolate(val, cameraOrbits[selectionIndex + 1]?.[i] ?? val, sectionProgress)
        );

        cakeModel.style.transform = `translateX(${currentShift}%)`;
        cakeModel.setAttribute("camera-orbit", `${currentOrbit[0]}deg ${currentOrbit[1]}deg`);
    });
});

// document.addEventListener("DOMContentLoaded", function () {
//     const cakeModel = document.getElementById("cake-model");

//     if (!cakeModel) {
//         console.error("Không tìm thấy model 3D!");
//         return;
//     }

//     // Giá trị bắt đầu và kết thúc của camera-orbit (theta, phi)
//     const startOrbit = [90, 90];
//     const endOrbit = [-45, 90];

//     // Hàm nội suy tuyến tính
//     const interpolate = (start, end, progress) => start + (end - start) * progress;

//     window.addEventListener("scroll", () => {
//         const scrollY = window.scrollY;
//         const docHeight = document.documentElement.scrollHeight - window.innerHeight;
//         const progress = docHeight ? scrollY / docHeight : 0;

//         // Nội suy giữa startOrbit và endOrbit dựa trên progress
//         const currentOrbit = startOrbit.map((start, i) => 
//             interpolate(start, endOrbit[i], progress)
//         );

//         cakeModel.setAttribute("camera-orbit", `${currentOrbit[0]}deg ${currentOrbit[1]}deg`);
//     });
// });