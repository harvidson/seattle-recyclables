// const $script = $('<script>');
// $script.attr('src', `https://maps.googleapis.com/maps/api/js?key=${googleMapsAPI}`);
// $('body').append($script);

let markers = [];
let map;

let searchID = 0;
const iconColors = ['ff6f00', '00e676', '18ffff', 'ffea00']
const defaultIcon = makeMarkerIcon('ff6f00');

initMap();

// add event listeners to all the materials in drop-down lists
$('.categories').on('click', 'li', function(event) {
  // console.log($(this).attr('id'));
  const selectedMaterial = $(this).attr('id');
  //if id=threadcycle, use hardcoded array as data source to map options
  if (selectedMaterial === 'threadcycle') {
    // threadcycle();
    console.log("you picked threadcycle; you should get a toast telling you more about this program");
    //if id=garbage, use a toast to notify
  } else if (selectedMaterial === 'garbage') {
    console.log("you'll get a toast telling you to throw that stuff in garbage");
    //otherwise, use api call against county data to map options
  } else {
    getMaterialHandled(selectedMaterial);
  }
});

function initMap() {
  const seattle = {
    lat: 47.620828,
    lng: -122.332982
  };
  map = new google.maps.Map(document.getElementById('map'), {
    zoom: 12,
    center: seattle
  });
}

function createMarkers(data) {
  const infoWindow = new google.maps.InfoWindow({});
  let bounds = new google.maps.LatLngBounds();

//loop through data and
  for (let i = 0; i < data.length; i++) {
    const position = {
      lat: data[i].geolocation.coordinates[1],
      lng: data[i].geolocation.coordinates[0]
    };
    const title = data[i].provider_name;
    const marker = new google.maps.Marker({
      map: map,
      position: position,
      title: title,
      animation: google.maps.Animation.DROP,
      icon: makeMarkerIcon(iconColors[searchID]),
      id: i
    });
    markers.push(marker);
    bounds.extend(marker.position);

    // listen for click event on each marker
    marker.addListener('click', function() {
      populateInfoWindow(this, infoWindow);
    });

  }
  map.fitBounds(bounds);
  console.log(markers);
  searchID++;
}


// make an array of marker colors; add this-- createMarkerIcon(markerColors[i])--to event listener on click
function makeMarkerIcon(markerColor) {
  var markerImage = new google.maps.MarkerImage(
    'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|'+ markerColor +
    '|40|_|%E2%80%A2',
    new google.maps.Size(21, 34),
    new google.maps.Point(0, 0),
    new google.maps.Point(10, 34),
    new google.maps.Size(21,34));
  return markerImage;
}

//add to this so that it's got more info: address, hours, learn more, save, etc.
function populateInfoWindow(marker, infoWindow) {
  if (infoWindow.marker != marker) {
    infoWindow.marker = marker;
    infoWindow.setContent(`<div>${marker.title}</div>`);
    infoWindow.open(map, marker);
    infoWindow.addListener('closeclick', function() {
      //weird bug here--if you close the infoWindow you can't immediately click on it again to reopen
      infoWindow.close();
    });
  }
}

// change id of selected item into a string that matches material_handled in county json
function getMaterialHandled(selectedMaterial) {
  console.log(nameMatches[selectedMaterial]);
  let materialHandled = nameMatches[selectedMaterial];
  getResults(materialHandled);
}

function getResults(materialHandled) {
  $.ajax({
    url: `https://data.kingcounty.gov/resource/tzui-ygc5.json?city=Seattle&material_handled=${materialHandled}`,
    dataType: 'json',
  }).done(function(data) {
    //i think line below will become createMarkers(data);
    console.log("here's the data from KC: ", data);
    createMarkers(data);
  }).fail(function() {
    alert("There was an error. Please search again.")
  });
}
