// ********************************* MODULE KHỞI TẠO BẢN ĐỒ ********************************* //
mapboxgl.accessToken =
  "pk.eyJ1IjoiYmluaGFjdiIsImEiOiJjbGtkZDhvdmEwdDJrM2lvM2l6NXU3c3FnIn0.at02F3Zn-lkVpQdU7zmXGQ";
var map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/mapbox/satellite-streets-v12",
  center: [106.6528, 10.8158],
  zoom: 14,
  bearing: -20.9,
});
// Tính năng Tìm kiếm, Phóng to, Xác định vị trí
// map.addControl(
//   new MapboxGeocoder({ accessToken: mapboxgl.accessToken, mapboxgl: mapboxgl })
// );
// map.addControl(new mapboxgl.FullscreenControl());
var geolocate = new mapboxgl.GeolocateControl({
  positionOptions: {
    enableHighAccuracy: true,
  },
  trackUserLocation: true,
});
map.addControl(geolocate);

// ================================= THÊM CÁC LAYER ĐÈN =================================//

map.on("load", function () {
  map.addSource("raster-source", {
    type: "raster",
    tiles: [
      "https://api.mapbox.com/v4/binhacv.dj02homp/{z}/{x}/{y}.png?access_token=" +
        mapboxgl.accessToken,
    ],
    tileSize: 256,
  });

  map.addLayer({
    id: "raster-layer",
    type: "raster",
    source: "raster-source",
    paint: {},
  });

  //   map.addLayer({
  //     id: "update-TSN-airfield-layer",
  //     type: "raster", // Choose the appropriate type for your data, e.g., 'fill', 'line', 'circle', etc.
  //     source: {
  //       type: "raster",
  //       url: "mapbox://binhacv.dj02homp",
  //     },
  //     "source-layer": "update-TSN-113I6v", // The name of the layer in your tileset
  //   });

  map.addLayer({
    id: "boundary-layer",
    type: "line", // Choose the appropriate type for your data, e.g., 'fill', 'line', 'circle', etc.
    source: {
      type: "vector",
      url: "mapbox://binhacv.clkkxvdit07fw2bt4197x15s2-1cpsa",
    },
    "source-layer": "boundary", // The name of the layer in your tileset
    paint: {
      "line-color": "red",
      "line-width": 1,
      "line-opacity": 0.7, // Adjust the opacity as needed
    },
  });

  map.addLayer({
    id: "TE-P1-layer",
    type: "fill", // Change the type based on your new layer's data
    source: {
      type: "vector",
      url: "mapbox://binhacv.clkkxi2oc0pip2iqpuwfwft9j-4fa3a",
    },
    "source-layer": "TE_P1_light", // The name of the layer in your new tileset
    paint: {
      "fill-color": "blue", // Replace with the desired color for the new layer
    },
  });

  map.addLayer({
    id: "TE-P2-layer",
    type: "fill", // Change the type based on your new layer's data
    source: {
      type: "vector",
      url: "mapbox://binhacv.clkwh3m9h06fq2po9r0pxppts-6f7h2",
    },
    "source-layer": "TE_P2_light", // The name of the layer in your new tileset
    paint: {
      "fill-color": "blue", // Replace with the desired color for the new layer
    },
  });

  // FETCH dữ liệu từ database lần đầu khi load map
  fetchDatafromDB();
  fetchNotificationDatafromDB();
});

/**======================================================================================== */
// ================================= TÍNH NĂNG CHỌN TỪNG LAYER ĐÈN =================================//
// Event handling for the select box
var selectBox = document.getElementById("menu");
selectBox.addEventListener("change", function () {
  var selectedLayer = selectBox.value;
  // Perform actions on the map based on the selected layer
  var selectedLayerBounds = getLayerBounds(selectedLayer);
  if (selectedLayerBounds) {
    // Fit the map to the bounds of the selected layer
    map.fitBounds(selectedLayerBounds, {
      padding: 1,
      bearing: map.getBearing(),
    }); // You can adjust the padding as needed

    updateSidebarContent(selectedLayer);
  }
});

function getLayerBounds(layerName) {
  if (layerName === "overview-layer") {
    return [
      [106.64, 10.8061],
      [106.671, 10.8282],
    ];
  } else if (layerName === "TE-P1-layer") {
    return [
      [106.662, 10.8211],
      [106.664, 10.825],
    ];
  } else if (layerName === "TE-P2-layer") {
    return [
      [106.66, 10.8199],
      [106.662, 10.8243],
    ];
  }
  // Add more conditions for other layers
  return null; // Return null if the layer name is not found
}
// *********************************************************************************************************************** */

// **************************** MODULE TRUYỀN NHẬN DỮ LIỆU TỪ FRONTEND - BACKEND - DATABASE ************************** //
let main_url =
  "https://script.google.com/macros/s/AKfycbxrLxLhelOHd8Row0SzjZnm0sI-dh4dSEHKrQOr02fu3hX1b2052wxxtz4v7S05DI8wcg/exec";
let noti_url =
  "https://script.google.com/macros/s/AKfycbwJr3kKHqBuFND9LMtqPrQequQHYpy5gE5dGiNhlLbinbLF1ztAQ9Z_k4P83OggMCriPA/exec";
// Hàm fetch dữ liệu tới Database
function fetchDatatoDB(Data) {
  fetch(main_url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(Data),
    mode: "no-cors",
  })
    .then((response) => response.text())
    .then((responseText) => {
      console.log("Backend Response:", responseText);
    })
    .catch((error) => {
      console.error("Fetch error:", error);
    });
}

// =============================================== Lấy data về và thêm marker vào map ========================================================== //
// Khởi tạo 1 set để lưu các marker đã thêm - để không bị trùng
var existingCoordinates = new Set();
var existingMarkers = [];
var currentPopup = null;
var markerId = null;

var markerlatitude = null;
var markerlongitude = null;
var markerstatus = null;
var markerlevel = null;
var markerposition = null;
var markerdesc = null;
var markerimageUrl = null;

// Hàm fetch lấy dữ liệu các marker từ Database về
function fetchDatafromDB() {
  fetch(main_url)
    .then((response) => response.json())
    .then((data) => {
      data.forEach((item) => {
        const databaseTimestr = item.timestamp;
        markerId = item.id;
        markerlatitude = parseFloat(item.latitude);
        markerlongitude = parseFloat(item.longitude);
        markerstatus = item.status;
        markerlevel = item.level;
        markerposition = item.position;
        markerdesc = item.desc;
        markerimageUrl = item.imageUrl;

        const markerColor = getMarkerColor(markerlevel);

        // Chỉnh thới gian của marker
        const markerTime = ConvertTimefromDB(databaseTimestr);

        // Create a marker for each data point
        if (
          !isNaN(markerlatitude) &&
          !isNaN(markerlongitude) &&
          !existingCoordinates.has(`${markerlatitude},${markerlongitude}`)
        ) {
          // Add the coordinates to the set
          existingCoordinates.add(`${markerlatitude},${markerlongitude}`);
          // Create a marker for each data point
          const marker = new mapboxgl.Marker({ color: markerColor }).setLngLat([
            markerlongitude,
            markerlatitude,
          ]);
          marker.addTo(map);
          // ============================= Xử lý popup của marker
          var popup = new mapboxgl.Popup({
            closeButton: true,
            closeOnClick: true,
            className: "custom-popup",
          }).setHTML(
            `<h7>Báo cáo</h7>
            <p>Thời gian: ${markerTime}</p>
            <p>Vị trí: ${markerposition}</p>
            <p>Mô tả: ${markerstatus} - ${markerdesc}</p>
            <p>Mức độ: ${markerlevel}</p>
            <img src="${markerimageUrl}" alt="Image" style="max-width: 100px;">
            <button onclick="onConfirmFixedClick('${markerId}','${markerlatitude}','${markerlongitude}','${markerposition}','${markerstatus}','${markerdesc}',)">Báo đã xử lý</button>`
          );
          marker.setPopup(popup);
          // event click
          marker.getElement().addEventListener("click", function (e) {
            if (currentPopup) currentPopup.remove();
            e.preventDefault(); // Prevent any default behavior (may not be necessary)
            e.stopPropagation(); // Prevent the event from propagating to the map
            popup.addTo(map);
            currentPopup = popup;
          });
        } else {
          const marker = new mapboxgl.Marker({ color: markerColor }).setLngLat([
            markerlongitude,
            markerlatitude,
          ]);
          marker.remove;
        }
      });
    })
    .catch((error) => console.error("Error fetching data:", error));
  return markerId;
}
// Update từ Database về mỗi 5 giây
setInterval(fetchDatafromDB, 5000);
setInterval(fetchNotificationDatafromDB, 5000);
// Hàm xử lý màu của các Marker
function getMarkerColor(level) {
  switch (level) {
    case "Đã xử lý":
      return "green"; // Change this to the desired color for "Low" level
    case "Thấp":
      return "yellow"; // Change this to the desired color for "Medium" level
    case "Cao":
      return "red"; // Change this to the desired color for "High" level
    default:
      return "blue"; // Default color if level doesn't match any case
  }
}

// Hàm xử lý thời gian
function ConvertTimefromDB(Timestring) {
  const Time = new Date(Timestring);
  return `${Time.getHours().toString().padStart(2, "0")}:${Time.getMinutes()
    .toString()
    .padStart(2, "0")}:${Time.getSeconds()
    .toString()
    .padStart(2, "0")} ${Time.getDate().toString().padStart(2, "0")}-${(
    Time.getMonth() + 1
  )
    .toString()
    .padStart(2, "0")}-${Time.getFullYear()}`;
}

// Hàm xử lý khi nhấn xác nhận đã xử lý
function onConfirmFixedClick(
  markerId,
  markerlatitude,
  markerlongitude,
  markerposition,
  markerstatus,
  markerdesc
) {
  const markerData = {
    uniqueId: markerId,
    latitude: markerlatitude,
    longitude: markerlongitude,
    status: markerstatus,
    level: "Đã xử lý",
    position: markerposition,
    desc: markerdesc,
  };
  fetchDatatoDB(markerData);
}

// *********************************************************************************************************************** //

// ************************************** MODULE THÊM MARKER VÀO BẢN ĐỒ ************************************************** //

var isClickonMap = false;
var newMarkerLat = null;
var newMarkerLng = null;
var marker = null;

// Event click lên màn hình để thêm marker
map.on("click", function (e) {
  // Extract clicked coordinates
  newMarkerLat = e.lngLat.lat;
  newMarkerLng = e.lngLat.lng;
  isClickonMap = true;

  addMarkerWithPopup(newMarkerLat, newMarkerLng);

  // Bỏ chọn và xoá text khi mở popup
  radioInputs.forEach((input) => {
    input.checked = false;
  });

  // Clear text inputs
  textInputs.forEach((input) => {
    input.value = "";
  });
});

// Hiển thị BẢNG BÁO CÁO khi click chọn trên map và thêm 1 marker tạm thời
function addMarkerWithPopup(lat, lng) {
  // Remove any existing marker
  if (marker) {
    marker.remove();
  }

  // Create a new marker at the clicked coordinates
  marker = new mapboxgl.Marker().setLngLat([lng, lat]).addTo(map);

  // Get the popup element from the DOM
  document.querySelector(".popup").classList.add("active");
}

// ************************************** MODULE CỬA SỐ BÁO CÁO ************************************************** //

// khởi tạo các biến của BẢNG BÁO CÁO
const button = document.getElementById("open-report-btn");
const popup = document.querySelector(".popup");
const radioInputs = document.querySelectorAll(
  '.popup-element input[type="radio"]'
);
const textInputs = document.querySelectorAll(
  '.popup-element input[type="text"]'
);

// Khi nhấn nút BÁO CÁO để hiển thị BẢNG BÁO CÁO
button.addEventListener("click", () => {
  // Hiển thị BẢNG BÁO CÁO bằng cách thêm 'active' class
  document.querySelector(".popup").classList.add("active");

  // Set giá trị biến
  isClickonMap = false;

  // Bỏ chọn và xoá text khi mở popup
  radioInputs.forEach((input) => {
    input.checked = false;
  });

  // Clear text inputs
  textInputs.forEach((input) => {
    input.value = "";
  });
});

// Tắt BẢNG BÁO CÁO và xoá marker
document
  .querySelector(".popup .popup-header i")
  .addEventListener("click", function () {
    popup.classList.remove("active"); // Tắt BẢNG CÁO CÁO remove 'active' class

    // Remove the marker when the popup is closed
    if (marker) {
      marker.remove();
    }
  });

// Nhấn nút XÁC NHẬN - của BÁO CÁO TẠI CHỖ
const confirmButton = document.getElementById("confirmButton");
let file = document.getElementById("imageInput");
let obj = null;
let objType = null;

// Add an event listener to the image input
file.addEventListener("change", () => {
  let fr = new FileReader();
  // This line adds an event listener to the "loadend" event of the FileReader object
  fr.addEventListener("loadend", () => {
    // This line declares a variable called "res" and assigns it the result of the FileReader object
    let res = fr.result;
    // This line splits the "res" variable into an array, using the string "base64," as the separator, and assigns the second element to a variable called "spt"
    let spt = res.split("base64,")[1];
    // This line creates an object called "obj" with three properties: "base64", "type", and "name"
    obj = spt;
    objType = file.files[0].type;
  });
  if (file.files.length > 0) {
    fr.readAsDataURL(file.files[0]);
  } else {
    obj = null;
    objType = null;
  }
});

confirmButton.addEventListener("click", () => {
  var lightStatus = findSelectedStatus();
  var lightLevel = findSelectedLevel();
  var lightPosition = PositionValue();
  var lightDesc = Description();
  if (
    lightStatus == null ||
    lightLevel == null ||
    lightPosition == "" ||
    lightDesc == ""
  ) {
    alert("Vui lòng nhập đầy đủ thông tin");
  } else {
    if (isClickonMap == false) {
      navigator.geolocation.getCurrentPosition(
        function (position) {
          const markerData = {
            // Create a unique ID based on timestamp and coordinate data
            uniqueId:
              new Date().getTime() +
              "_" +
              position.coords.latitude +
              "_" +
              position.coords.longitude,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            status: lightStatus,
            level: lightLevel,
            position: lightPosition,
            desc: lightDesc,
            image: obj,
            imageType: objType,
          };
          const markerNoti = {
            uniqueId:
              new Date().getTime() +
              "_" +
              position.coords.latitude +
              "_" +
              position.coords.longitude,
            text:
              "Vị trí: " +
              lightPosition +
              " - " +
              " Tình trạng: " +
              lightStatus +
              " - " +
              "Mô tả: " +
              lightDesc,
            mark: false,
            read: false,
            level: lightLevel,
          };
          fetchDatatoDB(markerData);
          fetchNotificationDatatoDB(markerNoti);
          // console.log(markerData);
        },
        function (error) {
          console.error("Error getting GPS location:", error);
        }
      );
    } else {
      const markerData = {
        // Create a unique ID based on timestamp and coordinate data
        uniqueId:
          new Date().getTime() + "_" + newMarkerLat + "_" + newMarkerLng,
        latitude: newMarkerLat,
        longitude: newMarkerLng,
        status: lightStatus,
        level: lightLevel,
        position: lightPosition,
        desc: lightDesc,
        image: obj,
        imageType: objType,
      };
      const markerNoti = {
        uniqueId:
          new Date().getTime() + "_" + newMarkerLat + "_" + newMarkerLng,
        text:
          "Vị trí: " +
          lightPosition +
          " - " +
          " Tình trạng: " +
          lightStatus +
          " - " +
          "Mô tả: " +
          lightDesc,
        mark: false,
        read: false,
        level: lightLevel,
      };
      fetchDatatoDB(markerData);
      fetchNotificationDatatoDB(markerNoti);
    }
    popup.classList.remove("active");
  }
});

// Khi chọn status của đèn (Hư bóng - Thay đèn)
let statusRadioBtns = document.querySelectorAll("input[name = 'status']");
let findSelectedStatus = () => {
  const selectedStatus = document.querySelector(
    "input[name = 'status']:checked"
  );
  if (selectedStatus) return selectedStatus.value;
  else return null;
};
statusRadioBtns.forEach((statusRadioBtn) => {
  statusRadioBtn.addEventListener("change", findSelectedStatus);
});

// Khi chọn level của đèn (Thấp - Cao)
let levelRadioBtns = document.querySelectorAll("input[name = 'level']");
let findSelectedLevel = () => {
  const selectedLevel = document.querySelector("input[name = 'level']:checked");
  if (selectedLevel) return selectedLevel.value;
  else return null;
};
levelRadioBtns.forEach((levelRadioBtn) => {
  levelRadioBtn.addEventListener("change", findSelectedLevel);
});

// Khi nhập text vào vị trí đèn (position)
function PositionValue() {
  let position = document.getElementById("position");
  return (txtposition = position.value); // Text khi nhập vào position
}

// Khi nhập text vào mô tả (description)
function Description() {
  let desc = document.getElementById("desc");
  return (txtdesc = desc.value); // Text khi nhập vào description
}

// ************************************** MODULE CODE JQUERRY CỦA NOTIFICATION SLIDEUP ************************************************** //
// Hàm fetch truyền dữ liệu thông báo đến Database
function fetchNotificationDatatoDB(Data) {
  fetch(noti_url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(Data),
    mode: "no-cors",
  })
    .then((response) => response.text())
    .then((responseText) => {
      console.log("Backend Response:", responseText);
    })
    .catch((error) => {
      console.error("Fetch error:", error);
    });
}

var notiId = null;
var notiText = null;
var notiMark = null;
var notiRead = null;
var notiLevel = null;
let notifications = [];
// Hàm fetch lấy dữ liệu thông báo từ Database về
function fetchNotificationDatafromDB() {
  fetch(noti_url)
    .then((response) => response.json())
    .then((data) => {
      notifications = data.map((item) => {
        const databaseTimestr = item.timestamp;
        notiId = item.id;
        notiText = item.text;
        notiMark = item.mark;
        notiRead = item.read;
        notiLevel = item.level;

        // const markerColor = getMarkerColor(markerlevel);

        // Chỉnh thới gian của marker
        const notiTime = ConvertTimefromDB(databaseTimestr);

        return {
          id: notiId,
          text: notiText,
          mark: notiMark,
          read: notiRead,
          level: notiLevel,
          notiTime: notiTime, // Add notiTime property
        };
      });
      notification_slideup();
    })
    .catch((error) => console.error("Error fetching data:", error));
}

// Code jquerry cho phần thông báo slideup
function notification_slideup() {
  $(document).ready(function () {
    // let notifications = [
    //   { text: "New message received", mark: false, read: false },
    //   { text: "You have a meeting at 3:00 PM", mark: false, read: false },
    //   { text: "Task deadline approaching", mark: false, read: false },
    // ];

    const notificationList = $("#notificationList");
    const notificationCount = $(".notification-count"); // Reference to the count element
    const newNotificationInput = $("#newNotification");
    const addNotificationButton = $("#addNotification");

    function displayNotifications() {
      notificationList.empty();
      let unmarkCount = 0;

      notifications.forEach((notification, index) => {
        if (!notification.mark) {
          unmarkCount++;
        }

        const notifyItem = $("<li>").addClass("notify-item");
        if (!notification.read) {
          notifyItem.addClass("read"); // Apply "read" class for read notifications
        }

        const statusCircle = $("<div>").addClass("status-circle");
        if (notification.read) {
          statusCircle.addClass("read"); // Apply "read" class for read notifications
        }

        const itemContent = $("<div>").addClass("item-content"); // Container for both notify-info and status-circle

        const notifyInfo = $("<div>").addClass("notify-info");
        const notifyText = $("<p>").text(notification.text);
        const notifyTime = $("<span>")
          .addClass("notify-time")
          .text(notification.notiTime);
        notifyInfo.append(notifyText);
        notifyInfo.append(statusCircle); // Append status-circle to the container
        notifyInfo.append(notifyTime);

        itemContent.append(notifyInfo); // Append notify-info to the container

        notifyItem.append(itemContent); // Append the container to the notify-item

        // Add a click event handler to toggle the read status
        notifyItem.on("click", function () {
          if (notification.read == false) {
            notification.read = true; // Mark as read on the first click
            notifyItem.removeClass("read");
            statusCircle.addClass("read");
            console.log("clicked");
          }
          // notification.read = !notification.read; // Toggle read status
          // displayNotifications(); // Update the display
        });

        notificationList.append(notifyItem);
      });

      // Update the notification count
      notificationCount.text(unmarkCount);
    }

    // Nút thêm thông báo mới (Chưa cần thiết)
    addNotificationButton.on("click", function () {
      const newNotificationText = newNotificationInput.val().trim();
      if (newNotificationText !== "") {
        const newNotification = { text: newNotificationText, mark: false };
        notifications.push(newNotification);
        displayNotifications();
        newNotificationInput.val(""); // Clear the input field
      }
    });

    // Nhấn vào chuông Thông báo
    $(".notification-button").click(function () {
      if (
        $("#popup-noti-Overlay").css("transform") === "matrix(1, 0, 0, 1, 0, 0)"
      ) {
        // If the popup is open, close it
        $("#popup-noti, #popup-noti-Overlay").css(
          "transform",
          "translateY(100%)"
        );
        setTimeout(function () {
          $("#popup-noti-Overlay").css("display", "none");
        }, 300);
      } else {
        // If the popup is closed, open it
        $("#popup-noti-Overlay")
          .css("display", "flex")
          .delay(10)
          .queue(function (next) {
            $("#popup-noti, #popup-noti-Overlay").css(
              "transform",
              "translateY(0)"
            );
            next();
          });
        notificationCount.text("0");
      }

      // Close the popup when the close button is clicked
      $("#closePopup").click(function () {
        $("#popup-noti, #popup-noti-Overlay").css(
          "transform",
          "translateY(100%)"
        );
        setTimeout(function () {
          $("#popup-noti-Overlay").css("display", "none");
        }, 300);
      });

      notifications.forEach((notification) => {
        notification.mark = true; // Mark all notifications as mark when the button is clicked
      });
      // if (dropdown.hasClass("active")) {
      //   displayNotifications(); // Display notifications when opening the dropdown
      //   notificationCount.text("0"); // Clear the count when opening
      // }
      displayNotifications();
    });

    // Initial display of notifications
    displayNotifications();
  });
}
