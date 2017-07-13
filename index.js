// const $script = $('<script>');
// $script.attr('src', `https://maps.googleapis.com/maps/api/js?key=${googleMapsAPI}`);
// $('body').append($script);

let markers = [];
let map;
let searchID = -1;
const iconColors = ['ff6f00', '00e676', '18ffff', 'ffea00']

initMap();

// add event listeners to all the materials in drop-down lists
$('.categories').on('click', 'li', function(event) {
  // console.log($(this).attr('id'));
  const selectedMaterial = $(this).attr('id');
  console.log(selectedMaterial);
  //if id=threadcycle, use hardcoded array as data source to map options
  if (selectedMaterial === 'threadcycle') {
    // threadcycle();
    console.log("you picked threadcycle; you should get a toast telling you more about this program");
    //if id=garbage, use a toast to notify
  } else if (selectedMaterial === 'garbage') {
    console.log("you'll get a toast telling you to throw that stuff in garbage");
    //otherwise, use api call against county data to map options
  } else {
    const material = nameMatches[selectedMaterial];
    console.log(material);
    getResults(selectedMaterial, material);
  }
});



// ***********************google maps***************************

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

function createMarkers(data, selectedMaterial) {
  const infoWindow = new google.maps.InfoWindow({});
  let bounds = new google.maps.LatLngBounds();
  searchID++;

  for (let i = 0; i < data.length; i++) {
    console.log(data);
    console.log(data[i]);
    let position;

    if (typeof data[i].geolocation === 'object') {
      position = {
        lat: data[i].geolocation.coordinates[1],
        lng: data[i].geolocation.coordinates[0]
      };
      console.log(position);
    } else {
      const address = data[i].geolocation_address;
      console.log(address);
      position = getCoordinates(address)
      console.log(position);
    };


    const title = data[i].provider_name;
    const marker = new google.maps.Marker({
      map: map,
      position: position,
      title: title,
      animation: google.maps.Animation.DROP,
      icon: makeMarkerIcon(iconColors[searchID]),
      id: i,
      material: selectedMaterial
    });
    markers.push(marker);
    bounds.extend(marker.position);

    // listen for click event on each marker
    marker.addListener('click', function() {
      populateInfoWindow(this, infoWindow);
    });
  }
  map.fitBounds(bounds);
  // console.log(markers);

}

function getCoordinates(address) {
  $.ajax({
    url: `https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=AIzaSyAynp8pr3LY7S2x60jYQ5DXaJz_sMwIhho`
  }).done(function(address) {
    createPosition(address)
  }).fail(function() {
    alert("There was an error. Please search again.")
  });
}

function createPosition(address) {
  const position = {
    lat: address.results[0].geometry.location.lat,
    lng: address.results[0].geometry.location.lng
  };
  console.log(position);
  console.log('createPosition ran');
  return position;
}

// function depopulateMap(materialDeselected) {
//   for (marker of markers) {
//     if (marker.material === materialDeselected) {
//       marker.setMap(null)
//     }
//   }
// }
//
//
// depopulateMap(materialDeselected);

function makeMarkerIcon(markerColor) {
  var markerImage = new google.maps.MarkerImage(
    'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|' + markerColor +
    '|40|_|%E2%80%A2',
    new google.maps.Size(21, 34),
    new google.maps.Point(0, 0),
    new google.maps.Point(10, 34),
    new google.maps.Size(21, 34));
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

// ************results from King County data**************

function getResults(selectedMaterial, material) {
  $.ajax({
    url: `https://data.kingcounty.gov/resource/tzui-ygc5.json?city=Seattle&material_handled=${material}`,
    dataType: 'json'
  }).done(function(data) {
    createMarkers(data, selectedMaterial);
    addTags(selectedMaterial); //or could this go above with event listener?
  }).fail(function() {
    alert("There was an error. Please search again.")
  });
}

//create a tag when a material is selected
// function addTags(selectedMaterial) {
//   const $newTag = $('<div>').addClass('chip').text(selectedMaterial).css("background-color", `#${iconColors[searchID]}`);
//   const $newIcon = $('<i>').addClass('close material-icons').text('close');
//   $newTag.append($newIcon);
//
//
//   // $('.chips').material_chip();
//
// }
let tagsArray = [];

function addTags(selectedMaterial) {
  tagsArray.push({
    tag: selectedMaterial
  });
  $('.chips').material_chip({
    data: tagsArray
  });
  $(`.chip:contains('${selectedMaterial}')`).css("background-color", `#${iconColors[searchID]}`)
  // console.log(tagsArray);
}

// $('.chips').on('chip.add', function(e, chip){
//   // you have the added chip here
//   console.log("i want to add a color");
//   chip.css("background-color", `#${iconColors[searchID]}`);
// });

$('.chips').on('chip.delete', function(e, chip) {
  console.log(chip);
  console.log("chip deleted");
  // you have the deleted chip here
});

// $('.chips-initial').material_chip({
//   data: [{
//     tag: 'Apple',
//   }, {
//     tag: 'Microsoft',
//   }, {
//     tag: 'Google',
//   }],
// });
